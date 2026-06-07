import {
  DEV_BROWSER_CDP_PORT,
  DEV_BROWSER_PORT,
  shutdownDevBrowserServer,
} from '@myboteam/agent-core/desktop-main';
import { getLogCollector } from '../logging';

function logOC(level: 'INFO' | 'WARN' | 'ERROR', msg: string, data?: Record<string, unknown>) {
  try {
    const l = getLogCollector();
    if (l?.log) {
      l.log(level, 'opencode', msg, data);
    }
  } catch (_e) {}
}

export async function stopDevBrowserServer(): Promise<void> {
  logOC('INFO', '[Browser] Sending shutdown request to dev-browser server...');
  await shutdownDevBrowserServer({
    devBrowserPort: DEV_BROWSER_PORT,
    devBrowserCdpPort: DEV_BROWSER_CDP_PORT,
  });
}
