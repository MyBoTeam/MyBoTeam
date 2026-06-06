import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { toAIFriendlyError } from './browser-actions.js';
import { getPage } from './session-manager.js';
import { selectSnapshotRef } from './snapshot-manager.js';
import type {
  BrowserIsCheckedInput,
  BrowserIsEnabledInput,
  BrowserIsVisibleInput,
} from './types.js';

export async function handleBrowserIsVisible(args: unknown): Promise<CallToolResult> {
  const { ref, selector, page_name } = args as BrowserIsVisibleInput;
  const page = await getPage(page_name);
  try {
    if (ref) {
      const el = await selectSnapshotRef(page, ref);
      return {
        content: [
          {
            type: 'text',
            text: el
              ? `${await el.isVisible()}`
              : `false (element [ref=${ref}] not found - run browser_snapshot() to get updated refs)`,
          },
        ],
      };
    }
    if (selector) {
      const el = await page.$(selector);
      return {
        content: [
          {
            type: 'text',
            text: el ? `${await el.isVisible()}` : `false (element "${selector}" not found)`,
          },
        ],
      };
    }
    return { content: [{ type: 'text', text: 'Error: Provide ref or selector' }], isError: true };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: toAIFriendlyError(err, ref ? `[ref=${ref}]` : selector || 'element').message,
        },
      ],
      isError: true,
    };
  }
}

export async function handleBrowserIsEnabled(args: unknown): Promise<CallToolResult> {
  const { ref, selector, page_name } = args as BrowserIsEnabledInput;
  const page = await getPage(page_name);
  try {
    if (ref) {
      const el = await selectSnapshotRef(page, ref);
      return {
        content: [
          {
            type: 'text',
            text: el ? `${await el.isEnabled()}` : `false (element [ref=${ref}] not found)`,
          },
        ],
      };
    }
    if (selector) {
      const el = await page.$(selector);
      return {
        content: [
          {
            type: 'text',
            text: el ? `${await el.isEnabled()}` : `false (element "${selector}" not found)`,
          },
        ],
      };
    }
    return { content: [{ type: 'text', text: 'Error: Provide ref or selector' }], isError: true };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: toAIFriendlyError(err, ref ? `[ref=${ref}]` : selector || 'element').message,
        },
      ],
      isError: true,
    };
  }
}

export async function handleBrowserIsChecked(args: unknown): Promise<CallToolResult> {
  const { ref, selector, page_name } = args as BrowserIsCheckedInput;
  const page = await getPage(page_name);
  try {
    if (ref) {
      const el = await selectSnapshotRef(page, ref);
      return {
        content: [
          {
            type: 'text',
            text: el ? `${await el.isChecked()}` : `false (element [ref=${ref}] not found)`,
          },
        ],
      };
    }
    if (selector) {
      const el = await page.$(selector);
      return {
        content: [
          {
            type: 'text',
            text: el ? `${await el.isChecked()}` : `false (element "${selector}" not found)`,
          },
        ],
      };
    }
    return { content: [{ type: 'text', text: 'Error: Provide ref or selector' }], isError: true };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: toAIFriendlyError(err, ref ? `[ref=${ref}]` : selector || 'element').message,
        },
      ],
      isError: true,
    };
  }
}

export {
  handleBrowserIframe,
  handleBrowserScroll,
  handleBrowserWait,
} from './handler-scroll-wait.js';
