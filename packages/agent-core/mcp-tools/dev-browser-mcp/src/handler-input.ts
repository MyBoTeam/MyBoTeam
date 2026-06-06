import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ElementHandle } from 'playwright';
import {
  getElementCoordinates,
  isCoordinateClickApp,
  toAIFriendlyError,
  waitForPageLoad,
} from './browser-actions.js';
import { getPage } from './session-manager.js';
import { selectSnapshotRef } from './snapshot-manager.js';
import type { BrowserKeyboardInput, BrowserTypeInput } from './types.js';

export async function handleBrowserType(args: unknown): Promise<CallToolResult> {
  const { ref, selector, text, press_enter, page_name } = args as BrowserTypeInput;
  const page = await getPage(page_name);
  try {
    let element: ElementHandle | null = null;
    if (ref) {
      element = await selectSnapshotRef(page, ref);
      if (!element)
        return {
          content: [
            {
              type: 'text',
              text: `Element [ref=${ref}] not found. Run browser_snapshot() to get updated refs - the page may have changed.`,
            },
          ],
          isError: true,
        };
    } else if (selector) {
      element = await page.$(selector);
      if (!element)
        return {
          content: [
            {
              type: 'text',
              text: `Element "${selector}" not found. Run browser_snapshot() to see current page elements.`,
            },
          ],
          isError: true,
        };
    } else {
      return {
        content: [{ type: 'text', text: 'Error: Either ref or selector is required' }],
        isError: true,
      };
    }
    const target = ref ? `[ref=${ref}]` : `"${selector}"`;
    const enterNote = press_enter ? ' and pressed Enter' : '';
    const coordApp = isCoordinateClickApp(page.url());
    if (coordApp) {
      const coords = await getElementCoordinates(element);
      if (!coords)
        return {
          content: [
            {
              type: 'text',
              text: `Element ${target} has no bounding box on ${coordApp}. Try browser_click(position="center-lower") then browser_keyboard(action="type", text="...").`,
            },
          ],
          isError: true,
        };
      await page.mouse.click(coords.centerX, coords.centerY);
      await page.keyboard.type(text);
      if (press_enter) {
        await page.keyboard.press('Enter');
        await waitForPageLoad(page);
      }
      return {
        content: [
          {
            type: 'text',
            text: `Typed "${text}" into ${target} [box: ${coords.x}, ${coords.y}, ${coords.width}, ${coords.height}]${enterNote} (coordinate click: ${coordApp})`,
          },
        ],
      };
    }
    try {
      await element.click();
      await element.fill(text);
      if (press_enter) {
        await element.press('Enter');
        await waitForPageLoad(page);
      }
      return { content: [{ type: 'text', text: `Typed "${text}" into ${target}${enterNote}` }] };
    } catch (fillErr) {
      const coords = await getElementCoordinates(element);
      if (coords) {
        await page.mouse.click(coords.centerX, coords.centerY);
        await page.keyboard.type(text);
        if (press_enter) {
          await page.keyboard.press('Enter');
          await waitForPageLoad(page);
        }
        return {
          content: [
            {
              type: 'text',
              text: `Typed "${text}" into ${target} [box: ${coords.x}, ${coords.y}, ${coords.width}, ${coords.height}]${enterNote} (coordinate fallback — DOM fill failed)`,
            },
          ],
        };
      }
      throw fillErr;
    }
  } catch (err) {
    const targetDesc = ref ? `[ref=${ref}]` : selector || 'element';
    return {
      content: [{ type: 'text', text: toAIFriendlyError(err, targetDesc).message }],
      isError: true,
    };
  }
}

export async function handleBrowserKeyboard(args: unknown): Promise<CallToolResult> {
  const { text, key, typing_delay, page_name } = args as BrowserKeyboardInput;
  const page = await getPage(page_name);
  if (!text && !key)
    return {
      content: [{ type: 'text', text: 'Error: Either text or key must be provided' }],
      isError: true,
    };
  const results: string[] = [];
  if (text) {
    await page.keyboard.type(text, { delay: typing_delay ?? 20 });
    results.push(`Typed: "${text}"`);
  }
  if (key) {
    await page.keyboard.press(key);
    results.push(`Pressed: ${key}`);
  }
  return { content: [{ type: 'text', text: results.join(', ') }] };
}

export {
  handleBrowserFileUpload,
  handleBrowserGetText,
  handleBrowserSelect,
} from './handler-text-input.js';
