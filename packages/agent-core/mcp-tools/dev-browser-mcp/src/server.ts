import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  type CallToolResult,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { ElementHandle } from 'playwright';
import { closePage, listPages } from './connection.js';
import {
  checkInteractionMode,
  ensureConnected,
  getPage,
  getToolDebug,
  injectActiveTabGlow,
  removeActiveTabGlow,
  setActivePageOverride,
  startScreencast,
} from './session-manager.js';
import {
  getElementCoordinates,
  isCoordinateClickApp,
  toAIFriendlyError,
  waitForPageLoad,
} from './browser-actions.js';
import { getAISnapshot, getSnapshotWithHistory, selectSnapshotRef } from './snapshot-manager.js';
import type {
  BrowserCanvasTypeInput,
  BrowserClickInput,
  BrowserDragInput,
  BrowserEvaluateInput,
  BrowserFileUploadInput,
  BrowserGetTextInput,
  BrowserHighlightInput,
  BrowserHoverInput,
  BrowserIframeInput,
  BrowserIsCheckedInput,
  BrowserIsEnabledInput,
  BrowserIsVisibleInput,
  BrowserKeyboardInput,
  BrowserNavigateInput,
  BrowserPagesInput,
  BrowserScreenshotInput,
  BrowserScrollInput,
  BrowserScriptInput,
  BrowserSelectInput,
  BrowserSequenceInput,
  BrowserSnapshotInput,
  BrowserTabsInput,
  BrowserTypeInput,
  BrowserWaitInput,
} from './types.js';
import { captureBoundedScreenshot, MAX_SCREENSHOT_BYTES } from './screenshot.js';
import { resetSnapshotManager } from './snapshot/index.js';
import { getToolDefinitions } from './tool-definitions.js';

const server = new Server(
  { name: 'dev-browser-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: getToolDefinitions(),
}));

server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const { name, arguments: args } = request.params;

  console.error(`[MCP] Tool called: ${name}`, JSON.stringify(args, null, 2));

  const toolDebug = getToolDebug();
  const debugContext = { getPage, getAISnapshot: toolDebug?.getAISnapshot ?? getAISnapshot };
  let preCapture: unknown;
  if (toolDebug?.handlePreAction) {
    try {
      preCapture = await toolDebug.handlePreAction(name, args, debugContext);
    } catch (err) {
      console.error('[dev-browser-mcp] debugPreAction error:', err);
    }
  }

  const executeToolAction = async (): Promise<CallToolResult> => {
    try {
      switch (name) {
        case 'browser_navigate': {
          const { url, page_name } = args as unknown as BrowserNavigateInput;
          let fullUrl = url;
          if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
            fullUrl = `https://${fullUrl}`;
          }
          resetSnapshotManager();
          const page = await getPage(page_name);
          await page.goto(fullUrl);
          await waitForPageLoad(page);
          await injectActiveTabGlow(page);
          void startScreencast(page_name);
          void checkInteractionMode(page, page_name);
          const title = await page.title();
          const currentUrl = page.url();
          const viewport = page.viewportSize();
          return {
            content: [{ type: 'text' as const, text: `Navigation successful.\nURL: ${currentUrl}\nTitle: ${title}\nViewport: ${viewport?.width || 1280}x${viewport?.height || 720}\n\nThe page has loaded. Use browser_snapshot() to see the page elements and find interactive refs, or browser_screenshot() to see what the page looks like visually.` }],
            isError: false,
          };
        }

        case 'browser_snapshot': {
          const { page_name, interactive_only, full_snapshot, max_elements, viewport_only, include_history, max_tokens } = args as unknown as BrowserSnapshotInput;
          const page = await getPage(page_name);
          const validatedMaxElements = full_snapshot ? Infinity : Math.min(Math.max(max_elements ?? 300, 1), 1000);
          const validatedMaxTokens = full_snapshot ? Infinity : Math.min(Math.max(max_tokens ?? 8000, 1000), 50000);
          const isCoordApp = isCoordinateClickApp(page.url());
          const effectiveViewportOnly = viewport_only ?? !!isCoordApp;
          const snapshotOptions = { interactiveOnly: interactive_only ?? true, maxElements: validatedMaxElements, viewportOnly: effectiveViewportOnly, maxTokens: validatedMaxTokens };
          const rawSnapshot = await getAISnapshot(page, snapshotOptions);
          let viewport = page.viewportSize();
          if (!viewport || (viewport.width === 0 && viewport.height === 0)) {
            try { viewport = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight })); } catch { /* intentionally empty */ }
          }
          const url = page.url();
          const title = await page.title();
          const detectedCoordApp = isCoordApp;
          const manager = (await import('./snapshot/index.js')).getSnapshotManager();
          const result = manager.processSnapshot(rawSnapshot, url, title, { fullSnapshot: full_snapshot, interactiveOnly: interactive_only ?? true });
          let output = '';
          const includeHistory = include_history !== false;
          if (includeHistory) {
            const sessionSummary = manager.getSessionSummary();
            if (sessionSummary.history) output += `# ${sessionSummary.history}\n\n`;
          }
          output += `# Page Info\nURL: ${url}\nViewport: ${viewport?.width || 1280}x${viewport?.height || 720} (center: ${Math.round((viewport?.width || 1280) / 2)}, ${Math.round((viewport?.height || 720) / 2)})\n`;
          if (result.type === 'diff') output += 'Mode: Diff (showing changes since last snapshot)\n';
          else if (interactive_only ?? true) output += 'Mode: Interactive elements only (buttons, links, inputs)\n';
          if (detectedCoordApp) output += `\n⚠️ COORDINATE-CLICK APP: ${detectedCoordApp}\nShowing viewport-only elements. Scroll to reveal more. Clicks use coordinate-based clicking.\n`;
          output += result.type === 'diff' ? `\n# Changes Since Last Snapshot\n${result.content}` : `\n# Accessibility Tree\n${result.content}`;
          return { content: [{ type: 'text', text: output }] };
        }

        case 'browser_click': {
          const { ref, selector, x, y, position, button, click_count, page_name } = args as unknown as BrowserClickInput;
          const page = await getPage(page_name);
          const clickOptions: { button?: 'left' | 'right' | 'middle'; clickCount?: number } = {};
          if (button) clickOptions.button = button;
          if (click_count) clickOptions.clickCount = click_count;
          const descParts: string[] = [];
          if (click_count === 2) descParts.push('double-click');
          else if (click_count === 3) descParts.push('triple-click');
          else if (click_count && click_count > 1) descParts.push(`${click_count}x click`);
          if (button === 'right') descParts.push('right-click');
          else if (button === 'middle') descParts.push('middle-click');
          const clickDesc = descParts.length > 0 ? ` (${descParts.join(', ')})` : '';

          try {
            if (position === 'center' || position === 'center-lower') {
              const viewport = page.viewportSize();
              const clickX = (viewport?.width || 1280) / 2;
              const clickY = position === 'center-lower' ? ((viewport?.height || 720) * 2) / 3 : (viewport?.height || 720) / 2;
              await page.mouse.click(clickX, clickY, clickOptions);
              await waitForPageLoad(page);
              return { content: [{ type: 'text' as const, text: `Clicked viewport ${position === 'center-lower' ? 'center-lower (2/3 down)' : 'center'} (${Math.round(clickX)}, ${Math.round(clickY)})${clickDesc}` }] };
            }

            if (x !== undefined && y !== undefined) {
              await page.mouse.click(x, y, clickOptions);
              await waitForPageLoad(page);
              return { content: [{ type: 'text' as const, text: `Clicked at coordinates (${x}, ${y})${clickDesc}` }] };
            }

            if (ref) {
              const element = await selectSnapshotRef(page, ref);
              if (!element) return { content: [{ type: 'text', text: `Element [ref=${ref}] not found. Run browser_snapshot() to get updated refs - the page may have changed.` }], isError: true };
              const coordApp = isCoordinateClickApp(page.url());
              if (coordApp) {
                const coords = await getElementCoordinates(element);
                if (!coords) return { content: [{ type: 'text', text: `Element [ref=${ref}] has no bounding box on ${coordApp}. Try browser_click with explicit x/y coordinates or position="center".` }], isError: true };
                await page.mouse.click(coords.centerX, coords.centerY, clickOptions);
                await waitForPageLoad(page);
                return { content: [{ type: 'text' as const, text: `Clicked element [ref=${ref}] at (${coords.centerX}, ${coords.centerY}) [box: ${coords.x}, ${coords.y}, ${coords.width}, ${coords.height}]${clickDesc} (coordinate click: ${coordApp})` }] };
              }
              try {
                await element.click(clickOptions);
                await waitForPageLoad(page);
                return { content: [{ type: 'text' as const, text: `Clicked element [ref=${ref}]${clickDesc}` }] };
              } catch (clickErr) {
                const coords = await getElementCoordinates(element);
                if (coords) {
                  await page.mouse.click(coords.centerX, coords.centerY, clickOptions);
                  await waitForPageLoad(page);
                  return { content: [{ type: 'text' as const, text: `Clicked element [ref=${ref}] [box: ${coords.x}, ${coords.y}, ${coords.width}, ${coords.height}]${clickDesc} (coordinate fallback — DOM click failed)` }] };
                }
                throw clickErr;
              }
            }

            if (selector) {
              await page.click(selector, clickOptions);
              await waitForPageLoad(page);
              return { content: [{ type: 'text' as const, text: `Clicked element matching "${selector}"${clickDesc}` }] };
            }

            return { content: [{ type: 'text', text: 'Error: Provide x/y coordinates, ref, selector, or position' }], isError: true };
          } catch (err) {
            const targetDesc = ref ? `[ref=${ref}]` : selector ? `"${selector}"` : `(${x}, ${y})`;
            return { content: [{ type: 'text', text: toAIFriendlyError(err, targetDesc).message }], isError: true };
          }
        }

        case 'browser_type': {
          const { ref, selector, text, press_enter, page_name } = args as unknown as BrowserTypeInput;
          const page = await getPage(page_name);
          try {
            let element: ElementHandle | null = null;
            if (ref) {
              element = await selectSnapshotRef(page, ref);
              if (!element) return { content: [{ type: 'text', text: `Element [ref=${ref}] not found. Run browser_snapshot() to get updated refs - the page may have changed.` }], isError: true };
            } else if (selector) {
              element = await page.$(selector);
              if (!element) return { content: [{ type: 'text', text: `Element "${selector}" not found. Run browser_snapshot() to see current page elements.` }], isError: true };
            } else {
              return { content: [{ type: 'text', text: 'Error: Either ref or selector is required' }], isError: true };
            }
            const target = ref ? `[ref=${ref}]` : `"${selector}"`;
            const enterNote = press_enter ? ' and pressed Enter' : '';
            const coordApp = isCoordinateClickApp(page.url());
            if (coordApp) {
              const coords = await getElementCoordinates(element);
              if (!coords) return { content: [{ type: 'text', text: `Element ${target} has no bounding box on ${coordApp}. Try browser_click(position="center-lower") then browser_keyboard(action="type", text="...").` }], isError: true };
              await page.mouse.click(coords.centerX, coords.centerY);
              await page.keyboard.type(text);
              if (press_enter) { await page.keyboard.press('Enter'); await waitForPageLoad(page); }
              return { content: [{ type: 'text', text: `Typed "${text}" into ${target} [box: ${coords.x}, ${coords.y}, ${coords.width}, ${coords.height}]${enterNote} (coordinate click: ${coordApp})` }] };
            }
            try {
              await element.click();
              await element.fill(text);
              if (press_enter) { await element.press('Enter'); await waitForPageLoad(page); }
              return { content: [{ type: 'text', text: `Typed "${text}" into ${target}${enterNote}` }] };
            } catch (fillErr) {
              const coords = await getElementCoordinates(element);
              if (coords) {
                await page.mouse.click(coords.centerX, coords.centerY);
                await page.keyboard.type(text);
                if (press_enter) { await page.keyboard.press('Enter'); await waitForPageLoad(page); }
                return { content: [{ type: 'text', text: `Typed "${text}" into ${target} [box: ${coords.x}, ${coords.y}, ${coords.width}, ${coords.height}]${enterNote} (coordinate fallback — DOM fill failed)` }] };
              }
              throw fillErr;
            }
          } catch (err) {
            const targetDesc = ref ? `[ref=${ref}]` : selector || 'element';
            return { content: [{ type: 'text', text: toAIFriendlyError(err, targetDesc).message }], isError: true };
          }
        }

        case 'browser_screenshot': {
          const { page_name, full_page } = args as unknown as BrowserScreenshotInput;
          const page = await getPage(page_name);
          const requestedFullPage = full_page ?? false;
          const screenshot = await captureBoundedScreenshot(page, requestedFullPage);
          if (!screenshot.buffer) {
            return { content: [{ type: 'text', text: `Screenshot skipped: image remained ${screenshot.byteLength} bytes after compression (max ${MAX_SCREENSHOT_BYTES} bytes). Use browser_snapshot() for a lightweight page view.` }], isError: true };
          }
          const base64 = screenshot.buffer.toString('base64');
          const fallbackNote = requestedFullPage && !screenshot.fullPageUsed ? ' Full-page capture was reduced to viewport to stay within size limits.' : '';
          return { content: [{ type: 'text', text: `Screenshot captured (${screenshot.byteLength} bytes, JPEG quality ${screenshot.qualityUsed}).${fallbackNote}` }, { type: 'image', data: base64, mimeType: 'image/jpeg' }] };
        }

        case 'browser_evaluate': {
          const { script, page_name } = args as unknown as BrowserEvaluateInput;
          const page = await getPage(page_name);
          const wrappedScript = `(async () => { ${script} })()`;
          const result = await page.evaluate(wrappedScript);
          return { content: [{ type: 'text', text: result !== undefined ? JSON.stringify(result, null, 2) : 'Script executed (no return value)' }] };
        }

        case 'browser_pages': {
          const { action, page_name } = args as unknown as BrowserPagesInput;
          if (action === 'list') {
            const taskPages = await listPages();
            return { content: [{ type: 'text', text: taskPages.length > 0 ? `Open pages: ${taskPages.join(', ')}` : 'No pages open' }] };
          }
          if (action === 'close') {
            if (!page_name) return { content: [{ type: 'text', text: 'Error: page_name is required for close action' }], isError: true };
            const closed = await closePage(page_name);
            return closed ? { content: [{ type: 'text', text: `Closed page "${page_name}"` }] } : { content: [{ type: 'text', text: `Error: Page "${page_name}" not found` }], isError: true };
          }
          return { content: [{ type: 'text', text: `Error: Unknown action "${action}"` }], isError: true };
        }

        case 'browser_keyboard': {
          const { text, key, typing_delay, page_name } = args as unknown as BrowserKeyboardInput;
          const page = await getPage(page_name);
          if (!text && !key) return { content: [{ type: 'text', text: 'Error: Either text or key must be provided' }], isError: true };
          const results: string[] = [];
          if (text) { await page.keyboard.type(text, { delay: typing_delay ?? 20 }); results.push(`Typed: "${text}"`); }
          if (key) { await page.keyboard.press(key); results.push(`Pressed: ${key}`); }
          return { content: [{ type: 'text', text: results.join(', ') }] };
        }

        case 'browser_sequence': {
          const { actions, page_name } = args as unknown as BrowserSequenceInput;
          const page = await getPage(page_name);
          const results: string[] = [];
          for (let i = 0; i < actions.length; i++) {
            const step = actions[i];
            const stepNum = i + 1;
            try {
              switch (step.action) {
                case 'click': {
                  if (step.x !== undefined && step.y !== undefined) { await page.mouse.click(step.x, step.y); results.push(`${stepNum}. Clicked at (${step.x}, ${step.y})`); }
                  else if (step.ref) { const el = await selectSnapshotRef(page, step.ref); if (!el) throw new Error(`Ref "${step.ref}" not found`); await el.click(); results.push(`${stepNum}. Clicked [ref=${step.ref}]`); }
                  else if (step.selector) { await page.click(step.selector); results.push(`${stepNum}. Clicked "${step.selector}"`); }
                  else throw new Error('Click requires x/y, ref, or selector');
                  await waitForPageLoad(page);
                  break;
                }
                case 'type': {
                  let el: ElementHandle | null = null;
                  if (step.ref) { el = await selectSnapshotRef(page, step.ref); if (!el) throw new Error(`Ref "${step.ref}" not found`); }
                  else if (step.selector) { el = await page.$(step.selector); if (!el) throw new Error(`Selector "${step.selector}" not found`); }
                  else throw new Error('Type requires ref or selector');
                  await el.click();
                  await el.fill(step.text || '');
                  if (step.press_enter) { await el.press('Enter'); await waitForPageLoad(page); }
                  results.push(`${stepNum}. Typed "${step.text}" into ${step.ref ? `[ref=${step.ref}]` : `"${step.selector}"`}${step.press_enter ? ' + Enter' : ''}`);
                  break;
                }
                case 'snapshot': {
                  await getSnapshotWithHistory(page);
                  results.push(`${stepNum}. Snapshot taken (refs updated)`);
                  break;
                }
                case 'screenshot': {
                  results.push(`${stepNum}. Screenshot taken`);
                  break;
                }
                case 'wait': {
                  const timeout = step.timeout || 1000;
                  await new Promise((resolve) => setTimeout(resolve, timeout));
                  results.push(`${stepNum}. Waited ${timeout}ms`);
                  break;
                }
                default:
                  results.push(`${stepNum}. Unknown action: ${step.action}`);
              }
            } catch (err) {
              const errMsg = err instanceof Error ? err.message : String(err);
              results.push(`${stepNum}. FAILED: ${errMsg}`);
              return { content: [{ type: 'text', text: `Sequence stopped at step ${stepNum}:\n${results.join('\n')}` }], isError: true };
            }
          }
          return { content: [{ type: 'text', text: `Sequence completed (${actions.length} actions):\n${results.join('\n')}` }] };
        }

        case 'browser_script': {
          const { actions, page_name } = args as unknown as BrowserScriptInput;
          const page = await getPage(page_name);
          const results: string[] = [];
          let snapshotResult = '';
          let screenshotData: { type: 'image'; mimeType: string; data: string } | null = null;

          for (let i = 0; i < actions.length; i++) {
            const step = actions[i];
            const stepNum = i + 1;
            try {
              switch (step.action) {
                case 'goto': {
                  if (!step.url) throw new Error('goto requires url parameter');
                  let fullUrl = step.url;
                  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) fullUrl = `https://${fullUrl}`;
                  await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: step.timeout || 30000 });
                  results.push(`${stepNum}. Navigated to ${fullUrl}`);
                  break;
                }
                case 'waitForLoad': {
                  await waitForPageLoad(page, step.timeout || 10000);
                  results.push(`${stepNum}. Page loaded`);
                  break;
                }
                case 'waitForSelector': {
                  if (!step.selector) throw new Error('waitForSelector requires selector parameter');
                  await page.waitForSelector(step.selector, { timeout: step.timeout || 10000 });
                  results.push(`${stepNum}. Found "${step.selector}"`);
                  break;
                }
                case 'waitForNavigation': {
                  await page.waitForNavigation({ timeout: step.timeout || 10000 }).catch(() => {});
                  results.push(`${stepNum}. Navigation completed`);
                  break;
                }
                case 'findAndFill': {
                  if (!step.selector) throw new Error('findAndFill requires selector parameter');
                  const el = await page.$(step.selector);
                  if (el) {
                    await el.click();
                    await el.fill(step.text || '');
                    if (step.pressEnter) { await el.press('Enter'); await waitForPageLoad(page); }
                    results.push(`${stepNum}. Filled "${step.selector}" with "${step.text || ''}"${step.pressEnter ? ' + Enter' : ''}`);
                  } else if (step.skipIfNotFound) { results.push(`${stepNum}. Skipped (not found): "${step.selector}"`); }
                  else throw new Error(`Element not found: "${step.selector}"`);
                  break;
                }
                case 'findAndClick': {
                  if (!step.selector) throw new Error('findAndClick requires selector parameter');
                  const cel = await page.$(step.selector);
                  if (cel) { await cel.click(); await waitForPageLoad(page); results.push(`${stepNum}. Clicked "${step.selector}"`); }
                  else if (step.skipIfNotFound) { results.push(`${stepNum}. Skipped (not found): "${step.selector}"`); }
                  else throw new Error(`Element not found: "${step.selector}"`);
                  break;
                }
                case 'fillByRef': {
                  if (!step.ref) throw new Error('fillByRef requires ref parameter');
                  const fel = await selectSnapshotRef(page, step.ref);
                  if (fel) {
                    await fel.click();
                    await fel.fill(step.text || '');
                    if (step.pressEnter) { await fel.press('Enter'); await waitForPageLoad(page); }
                    results.push(`${stepNum}. Filled [ref=${step.ref}] with "${step.text || ''}"${step.pressEnter ? ' + Enter' : ''}`);
                  } else if (step.skipIfNotFound) { results.push(`${stepNum}. Skipped (ref not found): "${step.ref}"`); }
                  else throw new Error(`Ref not found: "${step.ref}". Run snapshot first.`);
                  break;
                }
                case 'clickByRef': {
                  if (!step.ref) throw new Error('clickByRef requires ref parameter');
                  const cel2 = await selectSnapshotRef(page, step.ref);
                  if (cel2) { await cel2.click(); await waitForPageLoad(page); results.push(`${stepNum}. Clicked [ref=${step.ref}]`); }
                  else if (step.skipIfNotFound) { results.push(`${stepNum}. Skipped (ref not found): "${step.ref}"`); }
                  else throw new Error(`Ref not found: "${step.ref}". Run snapshot first.`);
                  break;
                }
                case 'snapshot': {
                  snapshotResult = await getSnapshotWithHistory(page);
                  results.push(`${stepNum}. Snapshot taken`);
                  break;
                }
                case 'screenshot': {
                  const requestedFullPage = step.fullPage ?? false;
                  const screenshot = await captureBoundedScreenshot(page, requestedFullPage);
                  if (screenshot.buffer) {
                    screenshotData = { type: 'image', mimeType: 'image/jpeg', data: screenshot.buffer.toString('base64') };
                    results.push(requestedFullPage && !screenshot.fullPageUsed ? `${stepNum}. Screenshot taken (auto-switched to viewport to stay under ${MAX_SCREENSHOT_BYTES} bytes)` : `${stepNum}. Screenshot taken (${screenshot.byteLength} bytes)`);
                  } else {
                    results.push(`${stepNum}. Screenshot skipped (still ${screenshot.byteLength} bytes after compression; max ${MAX_SCREENSHOT_BYTES})`);
                  }
                  break;
                }
                case 'keyboard': {
                  if (step.key) { await page.keyboard.press(step.key); results.push(`${stepNum}. Pressed key: ${step.key}`); }
                  else if (step.text) { await page.keyboard.type(step.text); results.push(`${stepNum}. Typed: "${step.text}"`); }
                  else throw new Error('keyboard requires key or text parameter');
                  break;
                }
                case 'evaluate': {
                  if (!step.code) throw new Error('evaluate requires code parameter');
                  const evalResult = await page.evaluate((code: string) => eval(code), step.code);
                  results.push(`${stepNum}. Evaluated: ${JSON.stringify(evalResult)}`);
                  break;
                }
                default:
                  results.push(`${stepNum}. Unknown action: ${(step as any).action}`);
              }
            } catch (err) {
              const errMsg = err instanceof Error ? err.message : String(err);
              results.push(`${stepNum}. FAILED: ${errMsg}`);
              try { snapshotResult = await getSnapshotWithHistory(page); results.push('→ Captured page state at failure'); } catch { /* intentionally empty */ }
              const content: CallToolResult['content'] = [{ type: 'text', text: `Script stopped at step ${stepNum}:\n${results.join('\n')}` }];
              if (snapshotResult) content.push({ type: 'text', text: `\nPage state:\n${snapshotResult}` });
              if (screenshotData) content.push(screenshotData);
              return { content, isError: true };
            }
          }

          const lastAction = actions[actions.length - 1];
          if (lastAction?.action !== 'snapshot') {
            try { await waitForPageLoad(page, 2000); snapshotResult = await getSnapshotWithHistory(page); results.push('→ Auto-captured final page state'); } catch { /* intentionally empty */ }
          }
          const content: CallToolResult['content'] = [{ type: 'text', text: `Script completed (${actions.length} actions):\n${results.join('\n')}` }];
          if (snapshotResult) content.push({ type: 'text', text: `\nPage state:\n${snapshotResult}` });
          if (screenshotData) content.push(screenshotData);
          return { content };
        }

        case 'browser_scroll': {
          const { direction, amount, ref, selector, position, page_name } = args as unknown as BrowserScrollInput;
          const page = await getPage(page_name);
          if (ref) {
            const element = await selectSnapshotRef(page, ref);
            if (!element) return { content: [{ type: 'text', text: `Error: Could not find element with ref "${ref}"` }], isError: true };
            await element.scrollIntoViewIfNeeded();
            resetSnapshotManager();
            return { content: [{ type: 'text', text: `Scrolled [ref=${ref}] into view` }] };
          }
          if (selector) {
            const element = await page.$(selector);
            if (!element) return { content: [{ type: 'text', text: `Error: Could not find element matching "${selector}"` }], isError: true };
            await element.scrollIntoViewIfNeeded();
            resetSnapshotManager();
            return { content: [{ type: 'text', text: `Scrolled "${selector}" into view` }] };
          }
          if (position) {
            if (position === 'top') { await page.evaluate(() => window.scrollTo(0, 0)); resetSnapshotManager(); return { content: [{ type: 'text', text: 'Scrolled to top of page' }] }; }
            if (position === 'bottom') { await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); resetSnapshotManager(); return { content: [{ type: 'text', text: 'Scrolled to bottom of page' }] }; }
          }
          if (direction) {
            const scrollAmount = amount || 500;
            let deltaX = 0, deltaY = 0;
            switch (direction) { case 'up': deltaY = -scrollAmount; break; case 'down': deltaY = scrollAmount; break; case 'left': deltaX = -scrollAmount; break; case 'right': deltaX = scrollAmount; break; }
            const scrollViewport = page.viewportSize();
            const centerX = (scrollViewport?.width || 1280) / 2;
            const centerY = (scrollViewport?.height || 720) / 2;
            await page.mouse.move(centerX, centerY);
            await page.mouse.wheel(deltaX, deltaY);
            resetSnapshotManager();
            return { content: [{ type: 'text', text: `Scrolled ${direction} by ${scrollAmount}px` }] };
          }
          return { content: [{ type: 'text', text: 'Error: Provide direction, ref, selector, or position' }], isError: true };
        }

        case 'browser_hover': {
          const { ref, selector, x, y, page_name } = args as unknown as BrowserHoverInput;
          const page = await getPage(page_name);
          if (x !== undefined && y !== undefined) { await page.mouse.move(x, y); return { content: [{ type: 'text', text: `Hovered at coordinates (${x}, ${y})` }] }; }
          if (ref) {
            const element = await selectSnapshotRef(page, ref);
            if (!element) return { content: [{ type: 'text', text: `Error: Could not find element with ref "${ref}"` }], isError: true };
            const hoverCoordApp = isCoordinateClickApp(page.url());
            if (hoverCoordApp) {
              const coords = await getElementCoordinates(element);
              if (coords) { await page.mouse.move(coords.centerX, coords.centerY); return { content: [{ type: 'text', text: `Hovered over [ref=${ref}] at (${coords.centerX}, ${coords.centerY}) (coordinate hover: ${hoverCoordApp})` }] }; }
              return { content: [{ type: 'text', text: `Element [ref=${ref}] has no bounding box on ${hoverCoordApp}. Try browser_hover with explicit x/y coordinates.` }], isError: true };
            }
            try { await element.hover(); return { content: [{ type: 'text', text: `Hovered over [ref=${ref}]` }] }; } catch (hoverErr) {
              const coords = await getElementCoordinates(element);
              if (coords) { await page.mouse.move(coords.centerX, coords.centerY); return { content: [{ type: 'text', text: `Hovered over [ref=${ref}] at (${coords.centerX}, ${coords.centerY}) (coordinate fallback — DOM hover failed)` }] }; }
              throw hoverErr;
            }
          }
          if (selector) { await page.hover(selector); return { content: [{ type: 'text', text: `Hovered over "${selector}"` }] }; }
          return { content: [{ type: 'text', text: 'Error: Provide ref, selector, or x/y coordinates' }], isError: true };
        }

        case 'browser_select': {
          const { ref, selector, value, label, index, page_name } = args as unknown as BrowserSelectInput;
          const page = await getPage(page_name);
          let selectOption: { value?: string; label?: string; index?: number } | undefined;
          if (value !== undefined) selectOption = { value };
          else if (label !== undefined) selectOption = { label };
          else if (index !== undefined) selectOption = { index };
          if (!selectOption) return { content: [{ type: 'text', text: 'Error: Provide value, label, or index to select' }], isError: true };
          if (ref) {
            const element = await selectSnapshotRef(page, ref);
            if (!element) return { content: [{ type: 'text', text: `Error: Could not find element with ref "${ref}"` }], isError: true };
            await element.selectOption(selectOption);
            const by = value ? `value="${value}"` : label ? `label="${label}"` : `index=${index}`;
            return { content: [{ type: 'text', text: `Selected option (${by}) in [ref=${ref}]` }] };
          }
          if (!selector) return { content: [{ type: 'text', text: 'Error: Provide ref or selector for the select element' }], isError: true };
          await page.selectOption(selector, selectOption);
          const by2 = value ? `value="${value}"` : label ? `label="${label}"` : `index=${index}`;
          return { content: [{ type: 'text', text: `Selected option (${by2}) in "${selector}"` }] };
        }

        case 'browser_wait': {
          const { condition, selector, script, timeout, page_name } = args as unknown as BrowserWaitInput;
          const page = await getPage(page_name);
          const waitTimeout = timeout || 30000;
          switch (condition) {
            case 'selector': {
              if (!selector) return { content: [{ type: 'text', text: 'Error: "selector" is required for selector condition' }], isError: true };
              await page.waitForSelector(selector, { timeout: waitTimeout });
              return { content: [{ type: 'text', text: `Element "${selector}" appeared` }] };
            }
            case 'hidden': {
              if (!selector) return { content: [{ type: 'text', text: 'Error: "selector" is required for hidden condition' }], isError: true };
              await page.waitForSelector(selector, { state: 'hidden', timeout: waitTimeout });
              return { content: [{ type: 'text', text: `Element "${selector}" is now hidden` }] };
            }
            case 'navigation': {
              await page.waitForNavigation({ timeout: waitTimeout });
              return { content: [{ type: 'text', text: `Navigation completed. Now at: ${page.url()}` }] };
            }
            case 'network_idle': {
              await page.waitForLoadState('networkidle', { timeout: waitTimeout });
              return { content: [{ type: 'text', text: 'Network is idle' }] };
            }
            case 'timeout': {
              const waitMs = timeout || 1000;
              await page.waitForTimeout(waitMs);
              return { content: [{ type: 'text', text: `Waited ${waitMs}ms` }] };
            }
            case 'function': {
              if (!script) return { content: [{ type: 'text', text: 'Error: "script" is required for function condition' }], isError: true };
              try { await page.waitForFunction(script, { timeout: waitTimeout }); return { content: [{ type: 'text', text: `Custom condition met: ${script.substring(0, 50)}${script.length > 50 ? '...' : ''}` }] }; } catch (err) { return { content: [{ type: 'text', text: toAIFriendlyError(err, script).message }], isError: true }; }
            }
            default:
              return { content: [{ type: 'text', text: `Error: Unknown wait condition "${condition}"` }], isError: true };
          }
        }

        case 'browser_file_upload': {
          const { ref, selector, files, page_name } = args as unknown as BrowserFileUploadInput;
          const page = await getPage(page_name);
          if (!files || files.length === 0) return { content: [{ type: 'text', text: 'Error: At least one file path is required' }], isError: true };
          let element: ElementHandle | null = null;
          if (ref) { element = await selectSnapshotRef(page, ref); if (!element) return { content: [{ type: 'text', text: `Error: Could not find element with ref "${ref}"` }], isError: true }; }
          else if (selector) { element = await page.$(selector); if (!element) return { content: [{ type: 'text', text: `Error: Could not find element matching "${selector}"` }], isError: true }; }
          else return { content: [{ type: 'text', text: 'Error: Provide ref or selector for the file input' }], isError: true };
          await element.setInputFiles(files);
          return { content: [{ type: 'text', text: `Uploaded ${files.length} file(s) to ${ref ? `[ref=${ref}]` : `"${selector}"`}` }] };
        }

        case 'browser_drag': {
          const { source_ref, source_selector, source_x, source_y, target_ref, target_selector, target_x, target_y, page_name } = args as unknown as BrowserDragInput;
          const page = await getPage(page_name);
          const getPos = async (ref?: string, selector?: string, x?: number, y?: number): Promise<{ x: number; y: number } | null> => {
            if (x !== undefined && y !== undefined) return { x, y };
            if (ref) { const el = await selectSnapshotRef(page, ref); if (!el) return null; const box = await el.boundingBox(); if (!box) return null; return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; }
            if (selector) { const el = await page.$(selector); if (!el) return null; const box = await el.boundingBox(); if (!box) return null; return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; }
            return null;
          };
          const sourcePos = await getPos(source_ref, source_selector, source_x, source_y);
          if (!sourcePos) return { content: [{ type: 'text', text: 'Error: Provide source_ref, source_selector, or source_x/source_y' }], isError: true };
          const targetPos = await getPos(target_ref, target_selector, target_x, target_y);
          if (!targetPos) return { content: [{ type: 'text', text: 'Error: Provide target_ref, target_selector, or target_x/target_y' }], isError: true };
          await page.mouse.move(sourcePos.x, sourcePos.y);
          await page.mouse.down();
          await page.mouse.move(targetPos.x, targetPos.y, { steps: 10 });
          await page.mouse.up();
          return { content: [{ type: 'text', text: `Dragged from ${source_ref ? `[ref=${source_ref}]` : source_selector ? `"${source_selector}"` : `(${source_x}, ${source_y})`} to ${target_ref ? `[ref=${target_ref}]` : target_selector ? `"${target_selector}"` : `(${target_x}, ${target_y})`}` }] };
        }

        case 'browser_get_text': {
          const { ref, selector, page_name } = args as unknown as BrowserGetTextInput;
          const page = await getPage(page_name);
          let element: ElementHandle | null = null;
          let target: string;
          if (ref) { element = await selectSnapshotRef(page, ref); target = `[ref=${ref}]`; if (!element) return { content: [{ type: 'text', text: `Error: Could not find element with ref "${ref}"` }], isError: true }; }
          else if (selector) { element = await page.$(selector); target = `"${selector}"`; if (!element) return { content: [{ type: 'text', text: `Error: Could not find element matching "${selector}"` }], isError: true }; }
          else return { content: [{ type: 'text', text: 'Error: Provide ref or selector' }], isError: true };
          const value = await element.evaluate((el) => {
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return { type: 'value', text: el.value };
            if (el instanceof HTMLSelectElement) return { type: 'value', text: el.options[el.selectedIndex]?.text || '' };
            return { type: 'text', text: el.textContent || '' };
          });
          return { content: [{ type: 'text', text: `${target} ${value.type}: "${value.text}"` }] };
        }

        case 'browser_is_visible': {
          const { ref, selector, page_name } = args as unknown as BrowserIsVisibleInput;
          const page = await getPage(page_name);
          try {
            if (ref) { const el = await selectSnapshotRef(page, ref); return { content: [{ type: 'text', text: el ? `${await el.isVisible()}` : `false (element [ref=${ref}] not found - run browser_snapshot() to get updated refs)` }] }; }
            if (selector) { const el = await page.$(selector); return { content: [{ type: 'text', text: el ? `${await el.isVisible()}` : `false (element "${selector}" not found)` }] }; }
            return { content: [{ type: 'text', text: 'Error: Provide ref or selector' }], isError: true };
          } catch (err) { return { content: [{ type: 'text', text: toAIFriendlyError(err, ref ? `[ref=${ref}]` : selector || 'element').message }], isError: true }; }
        }

        case 'browser_is_enabled': {
          const { ref, selector, page_name } = args as unknown as BrowserIsEnabledInput;
          const page = await getPage(page_name);
          try {
            if (ref) { const el = await selectSnapshotRef(page, ref); return { content: [{ type: 'text', text: el ? `${await el.isEnabled()}` : `false (element [ref=${ref}] not found - run browser_snapshot() to get updated refs)` }] }; }
            if (selector) { const el = await page.$(selector); return { content: [{ type: 'text', text: el ? `${await el.isEnabled()}` : `false (element "${selector}" not found)` }] }; }
            return { content: [{ type: 'text', text: 'Error: Provide ref or selector' }], isError: true };
          } catch (err) { return { content: [{ type: 'text', text: toAIFriendlyError(err, ref ? `[ref=${ref}]` : selector || 'element').message }], isError: true }; }
        }

        case 'browser_is_checked': {
          const { ref, selector, page_name } = args as unknown as BrowserIsCheckedInput;
          const page = await getPage(page_name);
          try {
            if (ref) { const el = await selectSnapshotRef(page, ref); return { content: [{ type: 'text', text: el ? `${await el.isChecked()}` : `false (element [ref=${ref}] not found - run browser_snapshot() to get updated refs)` }] }; }
            if (selector) { const el = await page.$(selector); return { content: [{ type: 'text', text: el ? `${await el.isChecked()}` : `false (element "${selector}" not found)` }] }; }
            return { content: [{ type: 'text', text: 'Error: Provide ref or selector' }], isError: true };
          } catch (err) { return { content: [{ type: 'text', text: toAIFriendlyError(err, ref ? `[ref=${ref}]` : selector || 'element').message }], isError: true }; }
        }

        case 'browser_iframe': {
          const { action, ref, selector, page_name } = args as unknown as BrowserIframeInput;
          const page = await getPage(page_name);
          if (action === 'enter') {
            let frameElement: ElementHandle | null = null;
            if (ref) { frameElement = await selectSnapshotRef(page, ref); if (!frameElement) return { content: [{ type: 'text', text: `Error: Could not find iframe with ref "${ref}"` }], isError: true }; }
            else if (selector) { frameElement = await page.$(selector); if (!frameElement) return { content: [{ type: 'text', text: `Error: Could not find iframe matching "${selector}"` }], isError: true }; }
            else return { content: [{ type: 'text', text: 'Error: Provide ref or selector for the iframe' }], isError: true };
            const frame = await frameElement.contentFrame();
            if (!frame) return { content: [{ type: 'text', text: 'Error: Element is not an iframe or frame is not accessible' }], isError: true };
            return { content: [{ type: 'text', text: `Entered iframe. Frame URL: ${frame.url()}\nNote: Use browser_evaluate with frame-aware selectors, or take a snapshot to see iframe content.` }] };
          }
          if (action === 'exit') return { content: [{ type: 'text', text: 'Exited iframe. Now working with main page.' }] };
          return { content: [{ type: 'text', text: `Error: Unknown iframe action "${action}"` }], isError: true };
        }

        case 'browser_tabs': {
          const { action, index, timeout, page_name: _page_name } = args as unknown as BrowserTabsInput;
          const b = await ensureConnected();
          if (action === 'list') {
            const allPages = b.contexts().flatMap((ctx) => ctx.pages());
            let output = `Open tabs (${allPages.length}):\n${allPages.map((p, i) => `${i}: ${p.url()}`).join('\n')}`;
            if (allPages.length > 1) output += '\n\nMultiple tabs detected! Use browser_tabs(action="switch", index=N) to switch to another tab.';
            return { content: [{ type: 'text', text: output }] };
          }
          if (action === 'switch') {
            if (index === undefined) return { content: [{ type: 'text', text: 'Error: index is required for switch action' }], isError: true };
            const allPages = b.contexts().flatMap((ctx) => ctx.pages());
            if (index < 0 || index >= allPages.length) return { content: [{ type: 'text', text: `Error: Invalid tab index ${index}. Valid range: 0-${allPages.length - 1}` }], isError: true };
            const targetPage = allPages[index]!;
            await targetPage.bringToFront();
            setActivePageOverride(targetPage);
            await injectActiveTabGlow(targetPage);
            return { content: [{ type: 'text', text: `Switched to tab ${index}: ${targetPage.url()}\n\nNow use browser_snapshot() to see the content of this tab.` }] };
          }
          if (action === 'close') {
            if (index === undefined) return { content: [{ type: 'text', text: 'Error: index is required for close action' }], isError: true };
            const allPages = b.contexts().flatMap((ctx) => ctx.pages());
            if (index < 0 || index >= allPages.length) return { content: [{ type: 'text', text: `Error: Invalid tab index ${index}. Valid range: 0-${allPages.length - 1}` }], isError: true };
            const targetPage = allPages[index]!;
            const closedUrl = targetPage.url();
            setActivePageOverride(null);
            await targetPage.close();
            return { content: [{ type: 'text', text: `Closed tab ${index}: ${closedUrl}` }] };
          }
          if (action === 'wait_for_new') {
            const waitTimeout = timeout || 5000;
            const context = b.contexts()[0];
            if (!context) return { content: [{ type: 'text', text: 'Error: No browser context available' }], isError: true };
            try {
              const newPage = await context.waitForEvent('page', { timeout: waitTimeout });
              await newPage.waitForLoadState('domcontentloaded');
              setActivePageOverride(newPage);
              await injectActiveTabGlow(newPage);
              return { content: [{ type: 'text', text: `New tab opened at index ${context.pages().indexOf(newPage)}: ${newPage.url()}` }] };
            } catch { return { content: [{ type: 'text', text: `No new tab opened within ${waitTimeout}ms` }], isError: true }; }
          }
          return { content: [{ type: 'text', text: `Error: Unknown tabs action "${action}"` }], isError: true };
        }

        case 'browser_canvas_type': {
          const { text, position, page_name } = args as unknown as BrowserCanvasTypeInput;
          const page = await getPage(page_name);
          const viewport = page.viewportSize();
          const clickX = (viewport?.width || 1280) / 2;
          const clickY = ((viewport?.height || 720) * 2) / 3;
          await page.mouse.click(clickX, clickY);
          await page.waitForTimeout(100);
          if (position !== 'current') {
            const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
            await page.keyboard.press(`${modifier}+Home`);
            await page.waitForTimeout(50);
          }
          await page.keyboard.type(text);
          return { content: [{ type: 'text', text: `Typed "${text.length > 50 ? `${text.slice(0, 50)}...` : text}" ${position !== 'current' ? 'at document start' : 'at current position'}` }] };
        }

        case 'browser_highlight': {
          const { enabled, page_name } = args as unknown as BrowserHighlightInput;
          const page = await getPage(page_name);
          if (enabled) { await injectActiveTabGlow(page); return { content: [{ type: 'text', text: 'Highlight enabled - tab now shows color-cycling glow border' }] }; }
          await removeActiveTabGlow(page);
          return { content: [{ type: 'text', text: 'Highlight disabled - glow removed from tab' }] };
        }

        case 'browser_batch_actions': {
          const { urls, extractScript, waitForSelector, page_name } = args as unknown as { urls: string[]; extractScript: string; waitForSelector?: string; page_name?: string };
          if (!urls || urls.length === 0) return { content: [{ type: 'text', text: 'Error: urls array is required and must not be empty' }], isError: true };
          if (urls.length > 20) return { content: [{ type: 'text', text: 'Error: Maximum 20 URLs per batch call' }], isError: true };
          if (!extractScript) return { content: [{ type: 'text', text: 'Error: extractScript is required' }], isError: true };
          const BATCH_TIMEOUT_MS = 120_000;
          const MAX_RESULT_SIZE_BYTES = 1_048_576;
          const page = await getPage(page_name);
          const batchResults: Array<{ url: string; status: 'success' | 'failed'; data?: Record<string, unknown>; error?: string }> = [];
          const batchStart = Date.now();
          for (const url of urls) {
            if (Date.now() - batchStart > BATCH_TIMEOUT_MS) { batchResults.push({ url, status: 'failed', error: 'Batch timeout exceeded (2 min limit)' }); continue; }
            let fullUrl = url;
            if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) fullUrl = `https://${fullUrl}`;
            const remainingTime = BATCH_TIMEOUT_MS - (Date.now() - batchStart);
            try {
              await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: Math.min(30000, remainingTime) });
              if (waitForSelector) await page.waitForSelector(waitForSelector, { timeout: Math.min(10000, remainingTime) }).catch(() => {});
              const data = await page.evaluate((script: string) => { const fn = new Function(script); return fn(); }, extractScript);
              const serialized = JSON.stringify(data);
              if (serialized.length > MAX_RESULT_SIZE_BYTES) { batchResults.push({ url: fullUrl, status: 'failed', error: `Result too large: ${serialized.length} bytes (max ${MAX_RESULT_SIZE_BYTES})` }); continue; }
              batchResults.push({ url: fullUrl, status: 'success', data });
            } catch (err) { batchResults.push({ url: fullUrl, status: 'failed', error: err instanceof Error ? err.message : String(err) }); }
          }
          resetSnapshotManager();
          return { content: [{ type: 'text', text: JSON.stringify({ results: batchResults, summary: { total: urls.length, succeeded: batchResults.filter(r => r.status === 'success').length, failed: batchResults.filter(r => r.status === 'failed').length } }, null, 2) }] };
        }

        default:
          return { content: [{ type: 'text', text: `Error: Unknown tool: ${name}` }], isError: true };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { content: [{ type: 'text', text: `Error: ${errorMessage}` }], isError: true };
    }
  };

  let result = await executeToolAction();

  if (toolDebug?.handlePostAction) {
    try {
      result = await toolDebug.handlePostAction(name, args, result, preCapture, debugContext);
    } catch (err) {
      console.error('[dev-browser-mcp] debugPostAction error:', err);
    }
  }

  return result;
});

export { server };
