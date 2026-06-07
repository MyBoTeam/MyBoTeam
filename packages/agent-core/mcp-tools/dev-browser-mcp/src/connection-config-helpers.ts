import type { ConnectionConfig } from './connection-config.js';

export function buildConfigFromEnv(): ConnectionConfig {
  const cdpEndpoint = process.env.CDP_ENDPOINT;
  const taskId = process.env.MYBOTEAM_TASK_ID || 'default';

  if (cdpEndpoint) {
    const headers: Record<string, string> = {};
    if (process.env.CDP_SECRET) {
      headers['X-CDP-Secret'] = process.env.CDP_SECRET;
    }
    return { mode: 'remote', cdpEndpoint, cdpHeaders: headers, taskId };
  }

  let port = parseInt(process.env.DEV_BROWSER_PORT || '9224', 10);
  if (!Number.isFinite(port) || !Number.isInteger(port) || port < 1 || port > 65535) {
    port = 9224;
  }
  return { mode: 'builtin', devBrowserUrl: `http://127.0.0.1:${port}`, taskId };
}

export const BROWSER_CONNECT_MAX_ATTEMPTS = 3;
export const BROWSER_CONNECT_RETRY_BASE_MS = 500;
