import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createConsoleLogger } from '../utils/logging.js';
import { isPlaywrightInstalled, isSystemChromeInstalled } from './detection.js';
import {
  buildNodeEnvironment,
  getNodeExecutable,
  installPlaywrightChromium,
  isDevBrowserServerReady,
  waitForDevBrowserServer,
} from './server-utils.js';

export type { BrowserServerConfig } from './server-utils.js';
export {
  installPlaywrightChromium,
  isDevBrowserServerReady,
  waitForDevBrowserServer,
} from './server-utils.js';

import {
  DEV_BROWSER_WAIT_MS_DEFAULT,
  DEV_BROWSER_WAIT_MS_WIN,
  type ServerStartResult,
} from './server-config.js';
import type { BrowserServerConfig } from './server-utils.js';

export { shutdownDevBrowserServer } from './server-config.js';

const log = createConsoleLogger({ prefix: 'Browser' });

export async function startDevBrowserServer(
  config: BrowserServerConfig,
): Promise<ServerStartResult> {
  const serverScript = path.join(config.mcpToolsPath, 'dev-browser', 'server.mjs');
  const serverCwd = path.join(config.mcpToolsPath, 'dev-browser');
  if (!fs.existsSync(serverScript)) {
    throw new Error(
      `[Browser] Missing dev-browser launcher script: ${serverScript}. ` +
        'Run "pnpm -F @myboteam/desktop build:mcp-tools:dev" before starting the app.',
    );
  }
  const spawnEnv = buildNodeEnvironment(config.bundledNodeBinPath);
  const nodeExe = getNodeExecutable(config.bundledNodeBinPath);

  const serverLogs: string[] = [];

  log.info('[Browser] ========== DEV-BROWSER SERVER STARTUP ==========');
  log.info(`[Browser] Node executable: ${nodeExe}`);
  log.info(`[Browser] Server script: ${serverScript}`);
  log.info(`[Browser] Working directory: ${serverCwd}`);
  log.info(`[Browser] Script exists: ${fs.existsSync(serverScript)}`);
  log.info(`[Browser] CWD exists: ${fs.existsSync(serverCwd)}`);

  const child = spawn(nodeExe, [serverScript], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: serverCwd,
    env: spawnEnv,
    windowsHide: true,
  });

  child.stdout?.on('data', (data: Buffer) => {
    const lines = data
      .toString()
      .split('\n')
      .filter((l) => l.trim());
    for (const line of lines) {
      serverLogs.push(`[stdout] ${line}`);
      log.info(`[DevBrowser stdout] ${line}`);
    }
  });

  child.stderr?.on('data', (data: Buffer) => {
    const lines = data
      .toString()
      .split('\n')
      .filter((l) => l.trim());
    for (const line of lines) {
      serverLogs.push(`[stderr] ${line}`);
      log.info(`[DevBrowser stderr] ${line}`);
    }
  });

  child.on('error', (err) => {
    const errorMsg = `Spawn error: ${err.message} (code: ${(err as NodeJS.ErrnoException).code})`;
    serverLogs.push(`[error] ${errorMsg}`);
    log.error('[Browser] Dev-browser spawn error:', { error: String(err) });
  });

  child.on('exit', (code, signal) => {
    const exitMsg = `Process exited with code ${code}, signal ${signal}`;
    serverLogs.push(`[exit] ${exitMsg}`);
    log.info(`[Browser] Dev-browser ${exitMsg}`);
    if (code !== 0 && code !== null) {
      log.error('[Browser] Dev-browser server failed. Logs:', { logs: serverLogs.join('\n') });
    }
  });

  child.unref();

  log.info(`[Browser] Dev-browser server spawn initiated (PID: ${child.pid})`);

  const maxWaitMs =
    process.platform === 'win32' ? DEV_BROWSER_WAIT_MS_WIN : DEV_BROWSER_WAIT_MS_DEFAULT;
  log.info(`[Browser] Waiting for dev-browser server to be ready (max ${maxWaitMs}ms)...`);

  const serverReady = await waitForDevBrowserServer(config.devBrowserPort, maxWaitMs);

  log.info('[Browser] ========== END DEV-BROWSER SERVER STARTUP ==========');

  return { ready: serverReady, pid: child.pid, logs: serverLogs };
}

export async function ensureDevBrowserServer(
  config: BrowserServerConfig,
  onProgress?: (progress: { stage: string; message?: string }) => void,
): Promise<ServerStartResult> {
  const hasChrome = isSystemChromeInstalled();
  const hasPlaywright = isPlaywrightInstalled();

  log.info(`[Browser] Browser check: Chrome=${hasChrome}, Playwright=${hasPlaywright}`);

  if (!hasChrome && !hasPlaywright) {
    log.info('[Browser] No browser available, installing Playwright Chromium...');
    onProgress?.({
      stage: 'setup',
      message: 'Chrome not found. Downloading browser (one-time setup, ~2 min)...',
    });

    try {
      await installPlaywrightChromium(config, (msg) => {
        onProgress?.({ stage: 'setup', message: msg });
      });
    } catch (error) {
      log.error('[Browser] Failed to install Playwright:', { error: String(error) });
    }
  }

  if (await isDevBrowserServerReady(config.devBrowserPort)) {
    log.info('[Browser] Dev-browser server already running');
    return { ready: true, logs: [] };
  }

  return startDevBrowserServer(config);
}
