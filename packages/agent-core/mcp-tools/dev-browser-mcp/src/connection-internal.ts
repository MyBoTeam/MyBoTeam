import { type Browser, type CDPSession, chromium } from 'playwright';
import { isRecoverableConnectionError } from './browser-manager.js';
import type { ConnectionConfig } from './connection-config.js';
import {
  BROWSER_CONNECT_MAX_ATTEMPTS,
  BROWSER_CONNECT_RETRY_BASE_MS,
} from './connection-config-helpers.js';

export async function connectBrowser(config: ConnectionConfig): Promise<Browser> {
  if (config.mode === 'remote') {
    return chromium.connectOverCDP(config.cdpEndpoint, { headers: config.cdpHeaders });
  }

  const infoUrl = `${config.devBrowserUrl}/`;
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < BROWSER_CONNECT_MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(infoUrl, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`dev-browser health check failed: ${res.status}`);
      const info = (await res.json()) as { wsEndpoint: string };
      if (!info.wsEndpoint) {
        throw new Error('fetch failed: dev-browser wsEndpoint is empty (browser not ready)');
      }
      const normalizedEndpoint = info.wsEndpoint.replace(
        /^(wss?:\/\/)localhost(:\d+)/,
        '$1127.0.0.1$2',
      );
      return chromium.connectOverCDP(normalizedEndpoint);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < BROWSER_CONNECT_MAX_ATTEMPTS - 1 && isRecoverableConnectionError(lastError)) {
        const delayMs = BROWSER_CONNECT_RETRY_BASE_MS * 2 ** attempt;
        console.error(
          `[connection] dev-browser server not ready (attempt ${attempt + 1}/${BROWSER_CONNECT_MAX_ATTEMPTS}), retrying in ${delayMs}ms...`,
        );
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      } else {
        break;
      }
    }
  }
  throw lastError ?? new Error('Failed to connect to dev-browser server');
}

export async function getBuiltinPage(
  config: ConnectionConfig,
  ensureConnected: () => Promise<Browser>,
  fullName: string,
): Promise<import('playwright').Page> {
  const url = `${config.devBrowserUrl}/pages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: fullName, launchIntent: 'background-normal' }),
  });
  if (!res.ok) throw new Error(`Failed to get page "${fullName}": ${res.status}`);
  const data = (await res.json()) as { wsEndpoint: string; targetId: string };

  const browser = await ensureConnected();
  const contexts = browser.contexts();
  const context = contexts[0];
  if (!context) throw new Error('No browser context available');

  const pages = context.pages();
  for (const page of pages) {
    if (page.isClosed()) continue;
    let session: CDPSession | undefined;
    try {
      session = await context.newCDPSession(page);
      const { targetInfo } = (await session.send('Target.getTargetInfo')) as {
        targetInfo: { targetId: string };
      };
      if (targetInfo.targetId === data.targetId) return page;
    } catch {
    } finally {
      if (session) await session.detach().catch(() => {});
    }
  }
  throw new Error(
    `Page "${fullName}" with targetId "${data.targetId}" not found in browser context`,
  );
}

export async function getRemotePage(
  config: ConnectionConfig,
  ensureConnected: () => Promise<Browser>,
  getLocalPageRegistry: () => Map<string, import('playwright').Page>,
  fullName: string,
): Promise<import('playwright').Page> {
  const registry = getLocalPageRegistry();
  const existing = registry.get(fullName);
  if (existing && !existing.isClosed()) return existing;

  const browser = await ensureConnected();
  const context = browser.contexts()[0] ?? (await browser.newContext());
  const page = await context.newPage();
  registry.set(fullName, page);
  page.on('close', () => {
    if (registry.get(fullName) === page) registry.delete(fullName);
  });
  return page;
}
