import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { waitForPageLoad } from './browser-actions.js';
import { closePage, listPages } from './connection.js';
import {
  checkInteractionMode,
  ensureConnected,
  getPage,
  injectActiveTabGlow,
  setActivePageOverride,
  startScreencast,
} from './session-manager.js';
import { resetSnapshotManager } from './snapshot/index.js';
import type { BrowserNavigateInput, BrowserPagesInput, BrowserTabsInput } from './types.js';

export async function handleBrowserNavigate(args: unknown): Promise<CallToolResult> {
  const { url, page_name } = args as BrowserNavigateInput;
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
    content: [
      {
        type: 'text' as const,
        text: `Navigation successful.\nURL: ${currentUrl}\nTitle: ${title}\nViewport: ${viewport?.width || 1280}x${viewport?.height || 720}\n\nThe page has loaded. Use browser_snapshot() to see the page elements and find interactive refs, or browser_screenshot() to see what the page looks like visually.`,
      },
    ],
    isError: false,
  };
}

export async function handleBrowserPages(args: unknown): Promise<CallToolResult> {
  const { action, page_name } = args as BrowserPagesInput;
  if (action === 'list') {
    const taskPages = await listPages();
    return {
      content: [
        {
          type: 'text',
          text: taskPages.length > 0 ? `Open pages: ${taskPages.join(', ')}` : 'No pages open',
        },
      ],
    };
  }
  if (action === 'close') {
    if (!page_name)
      return {
        content: [{ type: 'text', text: 'Error: page_name is required for close action' }],
        isError: true,
      };
    const closed = await closePage(page_name);
    return closed
      ? { content: [{ type: 'text', text: `Closed page "${page_name}"` }] }
      : {
          content: [{ type: 'text', text: `Error: Page "${page_name}" not found` }],
          isError: true,
        };
  }
  return { content: [{ type: 'text', text: `Error: Unknown action "${action}"` }], isError: true };
}

export async function handleBrowserTabs(args: unknown): Promise<CallToolResult> {
  const { action, index, timeout, page_name: _page_name } = args as BrowserTabsInput;
  const b = await ensureConnected();
  if (action === 'list') {
    const allPages = b.contexts().flatMap((ctx) => ctx.pages());
    let output = `Open tabs (${allPages.length}):\n${allPages.map((p, i) => `${i}: ${p.url()}`).join('\n')}`;
    if (allPages.length > 1)
      output +=
        '\n\nMultiple tabs detected! Use browser_tabs(action="switch", index=N) to switch to another tab.';
    return { content: [{ type: 'text', text: output }] };
  }
  if (action === 'switch') {
    if (index === undefined)
      return {
        content: [{ type: 'text', text: 'Error: index is required for switch action' }],
        isError: true,
      };
    const allPages = b.contexts().flatMap((ctx) => ctx.pages());
    if (index < 0 || index >= allPages.length)
      return {
        content: [
          {
            type: 'text',
            text: `Error: Invalid tab index ${index}. Valid range: 0-${allPages.length - 1}`,
          },
        ],
        isError: true,
      };
    const targetPage = allPages[index]!;
    await targetPage.bringToFront();
    setActivePageOverride(targetPage);
    await injectActiveTabGlow(targetPage);
    return {
      content: [
        {
          type: 'text',
          text: `Switched to tab ${index}: ${targetPage.url()}\n\nNow use browser_snapshot() to see the content of this tab.`,
        },
      ],
    };
  }
  if (action === 'close') {
    if (index === undefined)
      return {
        content: [{ type: 'text', text: 'Error: index is required for close action' }],
        isError: true,
      };
    const allPages = b.contexts().flatMap((ctx) => ctx.pages());
    if (index < 0 || index >= allPages.length)
      return {
        content: [
          {
            type: 'text',
            text: `Error: Invalid tab index ${index}. Valid range: 0-${allPages.length - 1}`,
          },
        ],
        isError: true,
      };
    const targetPage = allPages[index]!;
    const closedUrl = targetPage.url();
    setActivePageOverride(null);
    await targetPage.close();
    return { content: [{ type: 'text', text: `Closed tab ${index}: ${closedUrl}` }] };
  }
  if (action === 'wait_for_new') {
    const waitTimeout = timeout || 5000;
    const context = b.contexts()[0];
    if (!context)
      return {
        content: [{ type: 'text', text: 'Error: No browser context available' }],
        isError: true,
      };
    try {
      const newPage = await context.waitForEvent('page', { timeout: waitTimeout });
      await newPage.waitForLoadState('domcontentloaded');
      setActivePageOverride(newPage);
      await injectActiveTabGlow(newPage);
      return {
        content: [
          {
            type: 'text',
            text: `New tab opened at index ${context.pages().indexOf(newPage)}: ${newPage.url()}`,
          },
        ],
      };
    } catch {
      return {
        content: [{ type: 'text', text: `No new tab opened within ${waitTimeout}ms` }],
        isError: true,
      };
    }
  }
  return {
    content: [{ type: 'text', text: `Error: Unknown tabs action "${action}"` }],
    isError: true,
  };
}
