import type { ElementHandle, Page } from 'playwright';
import { getSnapshotManager } from './snapshot/index.js';
import { SNAPSHOT_SCRIPT } from './snapshot-script.js';
import type { SnapshotOptions } from './types.js';

export async function getAISnapshot(page: Page, options: SnapshotOptions = {}): Promise<string> {
  const isInjected = await page.evaluate(() => {
    return !!(globalThis as any).__devBrowser_getAISnapshot;
  });

  if (!isInjected) {
    await page.evaluate((script: string) => {
      eval(script);
    }, SNAPSHOT_SCRIPT);
  }

  const optsToSend = {
    interactiveOnly: options.interactiveOnly || false,
    maxElements: options.maxElements,
    viewportOnly: options.viewportOnly || false,
    maxTokens: options.maxTokens,
    rawTree: options.rawTree || false,
    includeBoundingBoxes: options.includeBoundingBoxes || false,
    includeAllTextNodes: options.includeAllTextNodes || false,
    preserveSubtrees: options.preserveSubtrees || false,
  };

  const result = await page.evaluate(
    (opts) => (globalThis as any).__devBrowser_getAISnapshot(opts),
    optsToSend,
  );
  return result as string;
}

export async function selectSnapshotRef(page: Page, ref: string): Promise<ElementHandle | null> {
  const elementHandle = await page.evaluateHandle((refId: string) => {
    const w = globalThis as any;
    const refs = w.__devBrowserRefs;
    if (!refs) {
      throw new Error('No snapshot refs found. Call browser_snapshot first.');
    }
    const element = refs[refId];
    if (!element) {
      throw new Error(`Ref "${refId}" not found. Available refs: ${Object.keys(refs).join(', ')}`);
    }
    return element;
  }, ref);

  const element = elementHandle.asElement();
  if (!element) {
    await elementHandle.dispose();
    return null;
  }

  return element;
}

export async function getSnapshotWithHistory(
  page: Page,
  options: SnapshotOptions = {},
): Promise<string> {
  const rawSnapshot = await getAISnapshot(page, options);
  const url = page.url();
  const title = await page.title();

  const manager = getSnapshotManager();
  const result = manager.processSnapshot(rawSnapshot, url, title, {
    fullSnapshot: options.fullSnapshot ?? false,
    interactiveOnly: options.interactiveOnly ?? true,
  });

  let output = '';
  const sessionSummary = manager.getSessionSummary();
  if (sessionSummary.history) {
    output += `# ${sessionSummary.history}\n\n`;
  }

  if (result.type === 'diff') {
    output += `# Changes Since Last Snapshot\n${result.content}`;
  } else {
    output += result.content;
  }

  return output;
}
