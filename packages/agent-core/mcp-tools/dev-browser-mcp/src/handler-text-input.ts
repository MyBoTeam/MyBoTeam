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
import type { BrowserFileUploadInput, BrowserGetTextInput, BrowserSelectInput } from './types.js';

export async function handleBrowserSelect(args: unknown): Promise<CallToolResult> {
  const { ref, selector, value, label, index, page_name } = args as BrowserSelectInput;
  const page = await getPage(page_name);
  let selectOption: { value?: string; label?: string; index?: number } | undefined;
  if (value !== undefined) selectOption = { value };
  else if (label !== undefined) selectOption = { label };
  else if (index !== undefined) selectOption = { index };
  if (!selectOption)
    return {
      content: [{ type: 'text', text: 'Error: Provide value, label, or index to select' }],
      isError: true,
    };
  if (ref) {
    const element = await selectSnapshotRef(page, ref);
    if (!element)
      return {
        content: [{ type: 'text', text: `Error: Could not find element with ref "${ref}"` }],
        isError: true,
      };
    await element.selectOption(selectOption);
    const by = value ? `value="${value}"` : label ? `label="${label}"` : `index=${index}`;
    return { content: [{ type: 'text', text: `Selected option (${by}) in [ref=${ref}]` }] };
  }
  if (!selector)
    return {
      content: [{ type: 'text', text: 'Error: Provide ref or selector for the select element' }],
      isError: true,
    };
  await page.selectOption(selector, selectOption);
  const by2 = value ? `value="${value}"` : label ? `label="${label}"` : `index=${index}`;
  return { content: [{ type: 'text', text: `Selected option (${by2}) in "${selector}"` }] };
}

export async function handleBrowserFileUpload(args: unknown): Promise<CallToolResult> {
  const { ref, selector, files, page_name } = args as BrowserFileUploadInput;
  const page = await getPage(page_name);
  if (!files || files.length === 0)
    return {
      content: [{ type: 'text', text: 'Error: At least one file path is required' }],
      isError: true,
    };
  let element: ElementHandle | null = null;
  if (ref) {
    element = await selectSnapshotRef(page, ref);
    if (!element)
      return {
        content: [{ type: 'text', text: `Error: Could not find element with ref "${ref}"` }],
        isError: true,
      };
  } else if (selector) {
    element = await page.$(selector);
    if (!element)
      return {
        content: [{ type: 'text', text: `Error: Could not find element matching "${selector}"` }],
        isError: true,
      };
  } else
    return {
      content: [{ type: 'text', text: 'Error: Provide ref or selector for the file input' }],
      isError: true,
    };
  await element.setInputFiles(files);
  return {
    content: [
      {
        type: 'text',
        text: `Uploaded ${files.length} file(s) to ${ref ? `[ref=${ref}]` : `"${selector}"`}`,
      },
    ],
  };
}

export async function handleBrowserGetText(args: unknown): Promise<CallToolResult> {
  const { ref, selector, page_name } = args as BrowserGetTextInput;
  const page = await getPage(page_name);
  let element: ElementHandle | null = null;
  let target: string;
  if (ref) {
    element = await selectSnapshotRef(page, ref);
    target = `[ref=${ref}]`;
    if (!element)
      return {
        content: [{ type: 'text', text: `Error: Could not find element with ref "${ref}"` }],
        isError: true,
      };
  } else if (selector) {
    element = await page.$(selector);
    target = `"${selector}"`;
    if (!element)
      return {
        content: [{ type: 'text', text: `Error: Could not find element matching "${selector}"` }],
        isError: true,
      };
  } else
    return { content: [{ type: 'text', text: 'Error: Provide ref or selector' }], isError: true };
  const value = await element.evaluate((el) => {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
      return { type: 'value', text: el.value };
    if (el instanceof HTMLSelectElement)
      return { type: 'value', text: el.options[el.selectedIndex]?.text || '' };
    return { type: 'text', text: el.textContent || '' };
  });
  return { content: [{ type: 'text', text: `${target} ${value.type}: "${value.text}"` }] };
}
