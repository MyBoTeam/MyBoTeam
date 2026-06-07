import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getPage } from './session-manager.js';
import { selectSnapshotRef } from './snapshot-manager.js';
import type { BrowserCanvasTypeInput, BrowserDragInput, BrowserHoverInput } from './types.js';

export async function handleBrowserHover(args: unknown): Promise<CallToolResult> {
  const { ref, selector, x, y, page_name } = args as BrowserHoverInput;
  const page = await getPage(page_name);
  if (x !== undefined && y !== undefined) {
    await page.mouse.move(x, y);
    return { content: [{ type: 'text', text: `Hovered at coordinates (${x}, ${y})` }] };
  }
  if (ref) {
    const element = await selectSnapshotRef(page, ref);
    if (!element)
      return {
        content: [{ type: 'text', text: `Error: Could not find element with ref "${ref}"` }],
        isError: true,
      };
    try {
      await element.hover();
      return { content: [{ type: 'text', text: `Hovered over [ref=${ref}]` }] };
    } catch (hoverErr) {
      const coords = await (await import('./browser-actions.js')).getElementCoordinates(element);
      if (coords) {
        await page.mouse.move(coords.centerX, coords.centerY);
        return {
          content: [
            {
              type: 'text',
              text: `Hovered over [ref=${ref}] at (${coords.centerX}, ${coords.centerY}) (coordinate fallback — DOM hover failed)`,
            },
          ],
        };
      }
      throw hoverErr;
    }
  }
  if (selector) {
    await page.hover(selector);
    return { content: [{ type: 'text', text: `Hovered over "${selector}"` }] };
  }
  return {
    content: [{ type: 'text', text: 'Error: Provide ref, selector, or x/y coordinates' }],
    isError: true,
  };
}

export async function handleBrowserDrag(args: unknown): Promise<CallToolResult> {
  const {
    source_ref,
    source_selector,
    source_x,
    source_y,
    target_ref,
    target_selector,
    target_x,
    target_y,
    page_name,
  } = args as BrowserDragInput;
  const page = await getPage(page_name);
  const getPos = async (
    ref?: string,
    selector?: string,
    x?: number,
    y?: number,
  ): Promise<{ x: number; y: number } | null> => {
    if (x !== undefined && y !== undefined) return { x, y };
    if (ref) {
      const el = await selectSnapshotRef(page, ref);
      if (!el) return null;
      const box = await el.boundingBox();
      if (!box) return null;
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    }
    if (selector) {
      const el = await page.$(selector);
      if (!el) return null;
      const box = await el.boundingBox();
      if (!box) return null;
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    }
    return null;
  };
  const sourcePos = await getPos(source_ref, source_selector, source_x, source_y);
  if (!sourcePos)
    return {
      content: [
        { type: 'text', text: 'Error: Provide source_ref, source_selector, or source_x/source_y' },
      ],
      isError: true,
    };
  const targetPos = await getPos(target_ref, target_selector, target_x, target_y);
  if (!targetPos)
    return {
      content: [
        { type: 'text', text: 'Error: Provide target_ref, target_selector, or target_x/target_y' },
      ],
      isError: true,
    };
  await page.mouse.move(sourcePos.x, sourcePos.y);
  await page.mouse.down();
  await page.mouse.move(targetPos.x, targetPos.y, { steps: 10 });
  await page.mouse.up();
  return {
    content: [
      {
        type: 'text',
        text: `Dragged from ${source_ref ? `[ref=${source_ref}]` : source_selector ? `"${source_selector}"` : `(${source_x}, ${source_y})`} to ${target_ref ? `[ref=${target_ref}]` : target_selector ? `"${target_selector}"` : `(${target_x}, ${target_y})`}`,
      },
    ],
  };
}

export async function handleBrowserCanvasType(args: unknown): Promise<CallToolResult> {
  const { text, position, page_name } = args as BrowserCanvasTypeInput;
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
  return {
    content: [
      {
        type: 'text',
        text: `Typed "${text.length > 50 ? `${text.slice(0, 50)}...` : text}" ${position !== 'current' ? 'at document start' : 'at current position'}`,
      },
    ],
  };
}
