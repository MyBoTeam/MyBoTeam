import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  getElementCoordinates,
  isCoordinateClickApp,
  toAIFriendlyError,
  waitForPageLoad,
} from './browser-actions.js';
import { getPage } from './session-manager.js';
import { selectSnapshotRef } from './snapshot-manager.js';
import type { BrowserClickInput } from './types.js';

export async function handleBrowserClick(args: unknown): Promise<CallToolResult> {
  const { ref, selector, x, y, position, button, click_count, page_name } =
    args as BrowserClickInput;
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
      const clickY =
        position === 'center-lower'
          ? ((viewport?.height || 720) * 2) / 3
          : (viewport?.height || 720) / 2;
      await page.mouse.click(clickX, clickY, clickOptions);
      await waitForPageLoad(page);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Clicked viewport ${position === 'center-lower' ? 'center-lower (2/3 down)' : 'center'} (${Math.round(clickX)}, ${Math.round(clickY)})${clickDesc}`,
          },
        ],
      };
    }
    if (x !== undefined && y !== undefined) {
      await page.mouse.click(x, y, clickOptions);
      await waitForPageLoad(page);
      return {
        content: [
          { type: 'text' as const, text: `Clicked at coordinates (${x}, ${y})${clickDesc}` },
        ],
      };
    }
    if (ref) {
      const element = await selectSnapshotRef(page, ref);
      if (!element)
        return {
          content: [
            {
              type: 'text',
              text: `Element [ref=${ref}] not found. Run browser_snapshot() to get updated refs.`,
            },
          ],
          isError: true,
        };
      const coordApp = isCoordinateClickApp(page.url());
      if (coordApp) {
        const coords = await getElementCoordinates(element);
        if (!coords)
          return {
            content: [
              {
                type: 'text',
                text: `Element [ref=${ref}] has no bounding box on ${coordApp}. Try browser_click with explicit x/y coordinates or position="center".`,
              },
            ],
            isError: true,
          };
        await page.mouse.click(coords.centerX, coords.centerY, clickOptions);
        await waitForPageLoad(page);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Clicked element [ref=${ref}] at (${coords.centerX}, ${coords.centerY}) [box: ${coords.x}, ${coords.y}, ${coords.width}, ${coords.height}]${clickDesc} (coordinate click: ${coordApp})`,
            },
          ],
        };
      }
      try {
        await element.click(clickOptions);
        await waitForPageLoad(page);
        return {
          content: [{ type: 'text' as const, text: `Clicked element [ref=${ref}]${clickDesc}` }],
        };
      } catch (clickErr) {
        const coords = await getElementCoordinates(element);
        if (coords) {
          await page.mouse.click(coords.centerX, coords.centerY, clickOptions);
          await waitForPageLoad(page);
          return {
            content: [
              {
                type: 'text' as const,
                text: `Clicked element [ref=${ref}] [box: ${coords.x}, ${coords.y}, ${coords.width}, ${coords.height}]${clickDesc} (coordinate fallback)`,
              },
            ],
          };
        }
        throw clickErr;
      }
    }
    if (selector) {
      await page.click(selector, clickOptions);
      await waitForPageLoad(page);
      return {
        content: [
          { type: 'text' as const, text: `Clicked element matching "${selector}"${clickDesc}` },
        ],
      };
    }
    return {
      content: [
        { type: 'text', text: 'Error: Provide x/y coordinates, ref, selector, or position' },
      ],
      isError: true,
    };
  } catch (err) {
    const targetDesc = ref ? `[ref=${ref}]` : selector ? `"${selector}"` : `(${x}, ${y})`;
    return {
      content: [{ type: 'text', text: toAIFriendlyError(err, targetDesc).message }],
      isError: true,
    };
  }
}

export { handleBrowserCanvasType, handleBrowserDrag, handleBrowserHover } from './handler-drag.js';
