import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { isCoordinateClickApp } from './browser-actions.js';
import { captureBoundedScreenshot, MAX_SCREENSHOT_BYTES } from './screenshot.js';
import { getPage, injectActiveTabGlow, removeActiveTabGlow } from './session-manager.js';
import { getAISnapshot } from './snapshot-manager.js';
import type {
  BrowserHighlightInput,
  BrowserScreenshotInput,
  BrowserSnapshotInput,
} from './types.js';

export async function handleBrowserSnapshot(args: unknown): Promise<CallToolResult> {
  const {
    page_name,
    interactive_only,
    full_snapshot,
    max_elements,
    viewport_only,
    include_history,
    max_tokens,
  } = args as BrowserSnapshotInput;
  const page = await getPage(page_name);
  const validatedMaxElements = full_snapshot
    ? Infinity
    : Math.min(Math.max(max_elements ?? 300, 1), 1000);
  const validatedMaxTokens = full_snapshot
    ? Infinity
    : Math.min(Math.max(max_tokens ?? 8000, 1000), 50000);
  const isCoordApp = isCoordinateClickApp(page.url());
  const effectiveViewportOnly = viewport_only ?? !!isCoordApp;
  const snapshotOptions = {
    interactiveOnly: interactive_only ?? true,
    maxElements: validatedMaxElements,
    viewportOnly: effectiveViewportOnly,
    maxTokens: validatedMaxTokens,
  };
  const rawSnapshot = await getAISnapshot(page, snapshotOptions);
  let viewport = page.viewportSize();
  if (!viewport || (viewport.width === 0 && viewport.height === 0)) {
    try {
      viewport = await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
      }));
    } catch {
      /* empty */
    }
  }
  const url = page.url();
  const title = await page.title();
  const detectedCoordApp = isCoordApp;
  const manager = (await import('./snapshot/index.js')).getSnapshotManager();
  const result = manager.processSnapshot(rawSnapshot, url, title, {
    fullSnapshot: full_snapshot,
    interactiveOnly: interactive_only ?? true,
  });
  let output = '';
  const includeHistory = include_history !== false;
  if (includeHistory) {
    const sessionSummary = manager.getSessionSummary();
    if (sessionSummary.history) output += `# ${sessionSummary.history}\n\n`;
  }
  output += `# Page Info\nURL: ${url}\nViewport: ${viewport?.width || 1280}x${viewport?.height || 720} (center: ${Math.round((viewport?.width || 1280) / 2)}, ${Math.round((viewport?.height || 720) / 2)})\n`;
  if (result.type === 'diff') output += 'Mode: Diff (showing changes since last snapshot)\n';
  else if (interactive_only ?? true)
    output += 'Mode: Interactive elements only (buttons, links, inputs)\n';
  if (detectedCoordApp)
    output += `\n⚠️ COORDINATE-CLICK APP: ${detectedCoordApp}\nShowing viewport-only elements. Scroll to reveal more. Clicks use coordinate-based clicking.\n`;
  output +=
    result.type === 'diff'
      ? `\n# Changes Since Last Snapshot\n${result.content}`
      : `\n# Accessibility Tree\n${result.content}`;
  return { content: [{ type: 'text', text: output }] };
}

export async function handleBrowserScreenshot(args: unknown): Promise<CallToolResult> {
  const { page_name, full_page } = args as BrowserScreenshotInput;
  const page = await getPage(page_name);
  const requestedFullPage = full_page ?? false;
  const screenshot = await captureBoundedScreenshot(page, requestedFullPage);
  if (!screenshot.buffer) {
    return {
      content: [
        {
          type: 'text',
          text: `Screenshot skipped: image remained ${screenshot.byteLength} bytes after compression (max ${MAX_SCREENSHOT_BYTES} bytes). Use browser_snapshot() for a lightweight page view.`,
        },
      ],
      isError: true,
    };
  }
  const base64 = screenshot.buffer.toString('base64');
  const fallbackNote =
    requestedFullPage && !screenshot.fullPageUsed
      ? ' Full-page capture was reduced to viewport to stay within size limits.'
      : '';
  return {
    content: [
      {
        type: 'text',
        text: `Screenshot captured (${screenshot.byteLength} bytes, JPEG quality ${screenshot.qualityUsed}).${fallbackNote}`,
      },
      { type: 'image', data: base64, mimeType: 'image/jpeg' },
    ],
  };
}

export async function handleBrowserHighlight(args: unknown): Promise<CallToolResult> {
  const { enabled, page_name } = args as BrowserHighlightInput;
  const page = await getPage(page_name);
  if (enabled) {
    await injectActiveTabGlow(page);
    return {
      content: [
        { type: 'text', text: 'Highlight enabled - tab now shows color-cycling glow border' },
      ],
    };
  }
  await removeActiveTabGlow(page);
  return { content: [{ type: 'text', text: 'Highlight disabled - glow removed from tab' }] };
}
