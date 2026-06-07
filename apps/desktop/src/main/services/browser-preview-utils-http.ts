import { DEV_BROWSER_CDP_PORT, DEV_BROWSER_PORT } from '@myboteam/agent-core/desktop-main';

export const DEV_BROWSER_HOST = '127.0.0.1';
export const DEFAULT_VIEWPORT = { width: 1280, height: 720 };
export const COMMAND_TIMEOUT_MS = 10_000;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), COMMAND_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${url}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveTargetId(taskId: string, pageName: string): Promise<string> {
  const fullPageName = `${taskId}-${pageName}`;
  const result = await fetchJson<{ targetId: string }>(
    `http://${DEV_BROWSER_HOST}:${DEV_BROWSER_PORT}/pages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fullPageName, viewport: DEFAULT_VIEWPORT }),
    },
  );
  if (!result.targetId) {
    throw new Error(`No targetId for page ${fullPageName}`);
  }
  return result.targetId;
}

export async function resolveBrowserWsEndpoint(): Promise<string> {
  const info = await fetchJson<{ webSocketDebuggerUrl: string }>(
    `http://${DEV_BROWSER_HOST}:${DEV_BROWSER_CDP_PORT}/json/version`,
  );
  if (!info.webSocketDebuggerUrl) {
    throw new Error('CDP endpoint missing webSocketDebuggerUrl');
  }
  return info.webSocketDebuggerUrl;
}

export async function autoStartScreencast(
  taskId: string,
  startBrowserPreviewStream: (taskId: string, pageName: string) => Promise<void>,
): Promise<void> {
  try {
    const data = await fetchJson<{ pages: string[] }>(
      `http://${DEV_BROWSER_HOST}:${DEV_BROWSER_PORT}/pages`,
    ).catch(() => null);

    if (!data?.pages) {
      return;
    }
    const taskPrefix = `${taskId}-`;
    const taskPages = data.pages.filter((p: string) => p.startsWith(taskPrefix));

    if (taskPages.length > 0) {
      const pageName = taskPages[0].substring(taskPrefix.length);
      await startBrowserPreviewStream(taskId, pageName);
    }
  } catch {}
}
