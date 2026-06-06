import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { waitForPageLoad } from './browser-actions.js';
import { getPage } from './session-manager.js';
import { getSnapshotWithHistory, selectSnapshotRef } from './snapshot-manager.js';
import type { BrowserSequenceInput } from './types.js';

export async function handleBrowserSequence(args: unknown): Promise<CallToolResult> {
  const { actions, page_name } = args as BrowserSequenceInput;
  const page = await getPage(page_name);
  const results: string[] = [];
  for (let i = 0; i < actions.length; i++) {
    const step = actions[i];
    const stepNum = i + 1;
    try {
      switch (step.action) {
        case 'click': {
          if (step.x !== undefined && step.y !== undefined) {
            await page.mouse.click(step.x, step.y);
            results.push(`${stepNum}. Clicked at (${step.x}, ${step.y})`);
          } else if (step.ref) {
            const el = await selectSnapshotRef(page, step.ref);
            if (!el) throw new Error(`Ref "${step.ref}" not found`);
            await el.click();
            results.push(`${stepNum}. Clicked [ref=${step.ref}]`);
          } else if (step.selector) {
            await page.click(step.selector);
            results.push(`${stepNum}. Clicked "${step.selector}"`);
          } else throw new Error('Click requires x/y, ref, or selector');
          await waitForPageLoad(page);
          break;
        }
        case 'type': {
          let el: import('playwright').ElementHandle | null = null;
          if (step.ref) {
            el = await selectSnapshotRef(page, step.ref);
            if (!el) throw new Error(`Ref "${step.ref}" not found`);
          } else if (step.selector) {
            el = await page.$(step.selector);
            if (!el) throw new Error(`Selector "${step.selector}" not found`);
          } else throw new Error('Type requires ref or selector');
          await el.click();
          await el.fill(step.text || '');
          if (step.press_enter) {
            await el.press('Enter');
            await waitForPageLoad(page);
          }
          results.push(
            `${stepNum}. Typed "${step.text}" into ${step.ref ? `[ref=${step.ref}]` : `"${step.selector}"`}${step.press_enter ? ' + Enter' : ''}`,
          );
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
      return {
        content: [
          { type: 'text', text: `Sequence stopped at step ${stepNum}:\n${results.join('\n')}` },
        ],
        isError: true,
      };
    }
  }
  return {
    content: [
      {
        type: 'text',
        text: `Sequence completed (${actions.length} actions):\n${results.join('\n')}`,
      },
    ],
  };
}

export { handleBrowserBatchActions, handleBrowserEvaluate } from './handler-batch.js';
export { handleBrowserScript } from './handler-script-multistep.js';
