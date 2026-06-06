import type { Browser, CDPSession, Page } from 'playwright';
import { BrowserManager, isRecoverableConnectionError } from './browser-manager.js';
import type { ConnectionConfig, ConnectionMode } from './connection-config.js';
import { buildConfigFromEnv } from './connection-config-helpers.js';
import { connectBrowser, getBuiltinPage, getRemotePage } from './connection-internal.js';

export { isRecoverableConnectionError };

let _config: ConnectionConfig = buildConfigFromEnv();
const _manager = new BrowserManager();
const _cdpSessionCache = new WeakMap<Page, Promise<CDPSession>>();

async function clearCachedBrowser(): Promise<void> {
  await _manager.clearCachedBrowser();
}

export function configureFromEnv(): ConnectionConfig {
  const newConfig = buildConfigFromEnv();
  void clearCachedBrowser();
  _config = newConfig;
  return _config;
}

export function configure(config: ConnectionConfig): void {
  void clearCachedBrowser();
  _config = config;
}

export async function resetConnection(): Promise<void> {
  _config = buildConfigFromEnv();
  await _manager.resetConnection();
}

export function getFullPageName(pageName?: string): string {
  return `${_config.taskId}-${pageName || 'main'}`;
}

export function getConnectionMode(): ConnectionMode {
  return _config.mode;
}

export async function ensureConnected(): Promise<Browser> {
  return _manager.ensureConnected(() => connectBrowser(_config));
}

export async function getPage(pageName?: string): Promise<Page> {
  const fullName = getFullPageName(pageName);
  return _config.mode === 'builtin'
    ? getBuiltinPage(_config, ensureConnected, fullName)
    : getRemotePage(_config, ensureConnected, () => _manager.getLocalPageRegistry(), fullName);
}

export async function listPages(): Promise<string[]> {
  const prefix = `${_config.taskId}-`;
  if (_config.mode === 'builtin') {
    const url = `${_config.devBrowserUrl}/pages`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to list pages: HTTP ${res.status} at ${url}`);
      const data = (await res.json()) as { pages: string[] };
      return data.pages.filter((n) => n.startsWith(prefix)).map((n) => n.slice(prefix.length));
    } catch (err) {
      throw new Error(
        `Error listing pages from dev-browser at ${url}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  return Array.from(_manager.getLocalPageRegistry().keys())
    .filter((n) => n.startsWith(prefix))
    .map((n) => n.slice(prefix.length));
}

export async function closePage(pageName?: string): Promise<boolean> {
  const fullName = getFullPageName(pageName);
  if (_config.mode === 'builtin') {
    const url = `${_config.devBrowserUrl}/pages/${encodeURIComponent(fullName)}`;
    try {
      const res = await fetch(url, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  }
  const registry = _manager.getLocalPageRegistry();
  const page = registry.get(fullName);
  if (!page) return false;
  try {
    await page.close();
    registry.delete(fullName);
    return true;
  } catch {
    return false;
  }
}

export async function focusPageWindow(pageName?: string): Promise<void> {
  if (_config.mode !== 'builtin') return;
  const fullName = getFullPageName(pageName);
  await fetch(`${_config.devBrowserUrl}/pages/${encodeURIComponent(fullName)}/focus`, {
    method: 'POST',
  }).catch(() => {});
}

export async function backgroundPageWindow(pageName?: string): Promise<void> {
  if (_config.mode !== 'builtin') return;
  const fullName = getFullPageName(pageName);
  await fetch(`${_config.devBrowserUrl}/pages/${encodeURIComponent(fullName)}/background`, {
    method: 'POST',
  }).catch(() => {});
}

export async function getCDPSession(pageName?: string): Promise<CDPSession> {
  const page = await getPage(pageName);
  const cached = _cdpSessionCache.get(page);
  if (cached) return cached;

  const context = page.context();
  if (!context) throw new Error('No browser context available for page');

  const sessionPromise = context.newCDPSession(page).then(
    (session) => {
      page.once('close', () => _cdpSessionCache.delete(page));
      return session;
    },
    (error) => {
      _cdpSessionCache.delete(page);
      throw error;
    },
  );
  _cdpSessionCache.set(page, sessionPromise);
  return sessionPromise;
}
