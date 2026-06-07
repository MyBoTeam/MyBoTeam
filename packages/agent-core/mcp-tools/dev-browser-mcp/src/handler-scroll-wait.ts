import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ElementHandle } from 'playwright';
import { toAIFriendlyError } from './browser-actions.js';
import { getPage } from './session-manager.js';
import { resetSnapshotManager } from './snapshot/index.js';
import { selectSnapshotRef } from './snapshot-manager.js';
import type { BrowserIframeInput, BrowserScrollInput, BrowserWaitInput } from './types.js';

export async function handleBrowserScroll(args: unknown): Promise<CallToolResult> {
  const { direction, amount, ref, selector, position, page_name } = args as BrowserScrollInput;
  const page = await getPage(page_name);
  if (ref) {
    const element = await selectSnapshotRef(page, ref);
    if (!element)
      return {
        content: [{ type: 'text', text: `Error: Could not find element with ref "${ref}"` }],
        isError: true,
      };
    await element.scrollIntoViewIfNeeded();
    resetSnapshotManager();
    return { content: [{ type: 'text', text: `Scrolled [ref=${ref}] into view` }] };
  }
  if (selector) {
    const element = await page.$(selector);
    if (!element)
      return {
        content: [{ type: 'text', text: `Error: Could not find element matching "${selector}"` }],
        isError: true,
      };
    await element.scrollIntoViewIfNeeded();
    resetSnapshotManager();
    return { content: [{ type: 'text', text: `Scrolled "${selector}" into view` }] };
  }
  if (position) {
    if (position === 'top') {
      await page.evaluate(() => window.scrollTo(0, 0));
      resetSnapshotManager();
      return { content: [{ type: 'text', text: 'Scrolled to top of page' }] };
    }
    if (position === 'bottom') {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      resetSnapshotManager();
      return { content: [{ type: 'text', text: 'Scrolled to bottom of page' }] };
    }
  }
  if (direction) {
    const scrollAmount = amount || 500;
    let deltaX = 0,
      deltaY = 0;
    switch (direction) {
      case 'up':
        deltaY = -scrollAmount;
        break;
      case 'down':
        deltaY = scrollAmount;
        break;
      case 'left':
        deltaX = -scrollAmount;
        break;
      case 'right':
        deltaX = scrollAmount;
        break;
    }
    const centerX = (page.viewportSize()?.width || 1280) / 2;
    const centerY = (page.viewportSize()?.height || 720) / 2;
    await page.mouse.move(centerX, centerY);
    await page.mouse.wheel(deltaX, deltaY);
    resetSnapshotManager();
    return { content: [{ type: 'text', text: `Scrolled ${direction} by ${scrollAmount}px` }] };
  }
  return {
    content: [{ type: 'text', text: 'Error: Provide direction, ref, selector, or position' }],
    isError: true,
  };
}

export async function handleBrowserWait(args: unknown): Promise<CallToolResult> {
  const { condition, selector, script, timeout, page_name } = args as BrowserWaitInput;
  const page = await getPage(page_name);
  const waitTimeout = timeout || 30000;
  switch (condition) {
    case 'selector': {
      if (!selector)
        return {
          content: [{ type: 'text', text: 'Error: "selector" is required for selector condition' }],
          isError: true,
        };
      await page.waitForSelector(selector, { timeout: waitTimeout });
      return { content: [{ type: 'text', text: `Element "${selector}" appeared` }] };
    }
    case 'hidden': {
      if (!selector)
        return {
          content: [{ type: 'text', text: 'Error: "selector" is required for hidden condition' }],
          isError: true,
        };
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
      if (!script)
        return {
          content: [{ type: 'text', text: 'Error: "script" is required for function condition' }],
          isError: true,
        };
      try {
        await page.waitForFunction(script, { timeout: waitTimeout });
        return {
          content: [
            {
              type: 'text',
              text: `Custom condition met: ${script.substring(0, 50)}${script.length > 50 ? '...' : ''}`,
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: toAIFriendlyError(err, script).message }],
          isError: true,
        };
      }
    }
    default:
      return {
        content: [{ type: 'text', text: `Error: Unknown wait condition "${condition}"` }],
        isError: true,
      };
  }
}

export async function handleBrowserIframe(args: unknown): Promise<CallToolResult> {
  const { action, ref, selector, page_name } = args as BrowserIframeInput;
  const page = await getPage(page_name);
  if (action === 'enter') {
    let frameElement: ElementHandle | null = null;
    if (ref) {
      frameElement = await selectSnapshotRef(page, ref);
      if (!frameElement)
        return {
          content: [{ type: 'text', text: `Error: Could not find iframe with ref "${ref}"` }],
          isError: true,
        };
    } else if (selector) {
      frameElement = await page.$(selector);
      if (!frameElement)
        return {
          content: [{ type: 'text', text: `Error: Could not find iframe matching "${selector}"` }],
          isError: true,
        };
    } else
      return {
        content: [{ type: 'text', text: 'Error: Provide ref or selector for the iframe' }],
        isError: true,
      };
    const frame = await frameElement.contentFrame();
    if (!frame)
      return {
        content: [
          { type: 'text', text: 'Error: Element is not an iframe or frame is not accessible' },
        ],
        isError: true,
      };
    return {
      content: [
        {
          type: 'text',
          text: `Entered iframe. Frame URL: ${frame.url()}\nNote: Use browser_evaluate with frame-aware selectors, or take a snapshot to see iframe content.`,
        },
      ],
    };
  }
  if (action === 'exit')
    return { content: [{ type: 'text', text: 'Exited iframe. Now working with main page.' }] };
  return {
    content: [{ type: 'text', text: `Error: Unknown iframe action "${action}"` }],
    isError: true,
  };
}
