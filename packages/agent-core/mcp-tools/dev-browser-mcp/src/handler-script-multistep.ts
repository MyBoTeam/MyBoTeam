import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { waitForPageLoad } from './browser-actions.js';
import { captureBoundedScreenshot, MAX_SCREENSHOT_BYTES } from './screenshot.js';
import { getPage } from './session-manager.js';
import { getSnapshotWithHistory, selectSnapshotRef } from './snapshot-manager.js';
import type { BrowserScriptInput } from './types.js';

export async function handleBrowserScript(args: unknown): Promise<CallToolResult> {
  const { actions, page_name } = args as BrowserScriptInput;
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
          if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://'))
            fullUrl = `https://${fullUrl}`;
          await page.goto(fullUrl, {
            waitUntil: 'domcontentloaded',
            timeout: step.timeout || 30000,
          });
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
            if (step.pressEnter) {
              await el.press('Enter');
              await waitForPageLoad(page);
            }
            results.push(
              `${stepNum}. Filled "${step.selector}" with "${step.text || ''}"${step.pressEnter ? ' + Enter' : ''}`,
            );
          } else if (step.skipIfNotFound) {
            results.push(`${stepNum}. Skipped (not found): "${step.selector}"`);
          } else throw new Error(`Element not found: "${step.selector}"`);
          break;
        }
        case 'findAndClick': {
          if (!step.selector) throw new Error('findAndClick requires selector parameter');
          const cel = await page.$(step.selector);
          if (cel) {
            await cel.click();
            await waitForPageLoad(page);
            results.push(`${stepNum}. Clicked "${step.selector}"`);
          } else if (step.skipIfNotFound) {
            results.push(`${stepNum}. Skipped (not found): "${step.selector}"`);
          } else throw new Error(`Element not found: "${step.selector}"`);
          break;
        }
        case 'fillByRef': {
          if (!step.ref) throw new Error('fillByRef requires ref parameter');
          const fel = await selectSnapshotRef(page, step.ref);
          if (fel) {
            await fel.click();
            await fel.fill(step.text || '');
            if (step.pressEnter) {
              await fel.press('Enter');
              await waitForPageLoad(page);
            }
            results.push(
              `${stepNum}. Filled [ref=${step.ref}] with "${step.text || ''}"${step.pressEnter ? ' + Enter' : ''}`,
            );
          } else if (step.skipIfNotFound) {
            results.push(`${stepNum}. Skipped (ref not found): "${step.ref}"`);
          } else throw new Error(`Ref not found: "${step.ref}". Run snapshot first.`);
          break;
        }
        case 'clickByRef': {
          if (!step.ref) throw new Error('clickByRef requires ref parameter');
          const cel2 = await selectSnapshotRef(page, step.ref);
          if (cel2) {
            await cel2.click();
            await waitForPageLoad(page);
            results.push(`${stepNum}. Clicked [ref=${step.ref}]`);
          } else if (step.skipIfNotFound) {
            results.push(`${stepNum}. Skipped (ref not found): "${step.ref}"`);
          } else throw new Error(`Ref not found: "${step.ref}". Run snapshot first.`);
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
            screenshotData = {
              type: 'image',
              mimeType: 'image/jpeg',
              data: screenshot.buffer.toString('base64'),
            };
            results.push(
              requestedFullPage && !screenshot.fullPageUsed
                ? `${stepNum}. Screenshot taken (auto-switched to viewport)`
                : `${stepNum}. Screenshot taken (${screenshot.byteLength} bytes)`,
            );
          } else {
            results.push(
              `${stepNum}. Screenshot skipped (still ${screenshot.byteLength} bytes after compression)`,
            );
          }
          break;
        }
        case 'keyboard': {
          if (step.key) {
            await page.keyboard.press(step.key);
            results.push(`${stepNum}. Pressed key: ${step.key}`);
          } else if (step.text) {
            await page.keyboard.type(step.text);
            results.push(`${stepNum}. Typed: "${step.text}"`);
          } else throw new Error('keyboard requires key or text parameter');
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
      try {
        snapshotResult = await getSnapshotWithHistory(page);
        results.push('→ Captured page state at failure');
      } catch {
        /* empty */
      }
      const content: CallToolResult['content'] = [
        { type: 'text', text: `Script stopped at step ${stepNum}:\n${results.join('\n')}` },
      ];
      if (snapshotResult) content.push({ type: 'text', text: `\nPage state:\n${snapshotResult}` });
      if (screenshotData) content.push(screenshotData);
      return { content, isError: true };
    }
  }

  const lastAction = actions[actions.length - 1];
  if (lastAction?.action !== 'snapshot') {
    try {
      await waitForPageLoad(page, 2000);
      snapshotResult = await getSnapshotWithHistory(page);
      results.push('→ Auto-captured final page state');
    } catch {
      /* empty */
    }
  }
  const content: CallToolResult['content'] = [
    { type: 'text', text: `Script completed (${actions.length} actions):\n${results.join('\n')}` },
  ];
  if (snapshotResult) content.push({ type: 'text', text: `\nPage state:\n${snapshotResult}` });
  if (screenshotData) content.push(screenshotData);
  return { content };
}
