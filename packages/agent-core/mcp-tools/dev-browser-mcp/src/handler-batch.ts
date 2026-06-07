import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getPage } from './session-manager.js';
import { resetSnapshotManager } from './snapshot/index.js';
import type { BrowserEvaluateInput } from './types.js';

export async function handleBrowserEvaluate(args: unknown): Promise<CallToolResult> {
  const { script, page_name } = args as BrowserEvaluateInput;
  const page = await getPage(page_name);
  const wrappedScript = `(async () => { ${script} })()`;
  const result = await page.evaluate(wrappedScript);
  return {
    content: [
      {
        type: 'text',
        text:
          result !== undefined
            ? JSON.stringify(result, null, 2)
            : 'Script executed (no return value)',
      },
    ],
  };
}

export async function handleBrowserBatchActions(args: unknown): Promise<CallToolResult> {
  const { urls, extractScript, waitForSelector, page_name } = args as unknown as {
    urls: string[];
    extractScript: string;
    waitForSelector?: string;
    page_name?: string;
  };
  if (!urls || urls.length === 0)
    return {
      content: [{ type: 'text', text: 'Error: urls array is required and must not be empty' }],
      isError: true,
    };
  if (urls.length > 20)
    return {
      content: [{ type: 'text', text: 'Error: Maximum 20 URLs per batch call' }],
      isError: true,
    };
  if (!extractScript)
    return { content: [{ type: 'text', text: 'Error: extractScript is required' }], isError: true };
  const BATCH_TIMEOUT_MS = 120_000;
  const MAX_RESULT_SIZE_BYTES = 1_048_576;
  const page = await getPage(page_name);
  const batchResults: Array<{
    url: string;
    status: 'success' | 'failed';
    data?: Record<string, unknown>;
    error?: string;
  }> = [];
  const batchStart = Date.now();
  for (const url of urls) {
    if (Date.now() - batchStart > BATCH_TIMEOUT_MS) {
      batchResults.push({ url, status: 'failed', error: 'Batch timeout exceeded (2 min limit)' });
      continue;
    }
    let fullUrl = url;
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://'))
      fullUrl = `https://${fullUrl}`;
    const remainingTime = BATCH_TIMEOUT_MS - (Date.now() - batchStart);
    try {
      await page.goto(fullUrl, {
        waitUntil: 'domcontentloaded',
        timeout: Math.min(30000, remainingTime),
      });
      if (waitForSelector)
        await page
          .waitForSelector(waitForSelector, { timeout: Math.min(10000, remainingTime) })
          .catch(() => {});
      const data = await page.evaluate((script: string) => {
        const fn = new Function(script);
        return fn();
      }, extractScript);
      const serialized = JSON.stringify(data);
      if (serialized.length > MAX_RESULT_SIZE_BYTES) {
        batchResults.push({
          url: fullUrl,
          status: 'failed',
          error: `Result too large: ${serialized.length} bytes (max ${MAX_RESULT_SIZE_BYTES})`,
        });
        continue;
      }
      batchResults.push({ url: fullUrl, status: 'success', data });
    } catch (err) {
      batchResults.push({
        url: fullUrl,
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  resetSnapshotManager();
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            results: batchResults,
            summary: {
              total: urls.length,
              succeeded: batchResults.filter((r) => r.status === 'success').length,
              failed: batchResults.filter((r) => r.status === 'failed').length,
            },
          },
          null,
          2,
        ),
      },
    ],
  };
}
