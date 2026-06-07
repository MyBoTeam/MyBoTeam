import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createConsoleLogger } from '../utils/logging.js';
import type { BrowserServerConfig } from './browser-env.js';
import {
  buildNodeEnvironment,
  getNodeExecutable,
  resolvePlaywrightCliPath,
} from './browser-env.js';

const log = createConsoleLogger({ prefix: 'Browser' });

export async function installPlaywrightChromium(
  config: BrowserServerConfig,
  onProgress?: (message: string) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const devBrowserDir = path.join(config.mcpToolsPath, 'dev-browser');
    if (!fs.existsSync(devBrowserDir)) {
      const message =
        `[Browser] Missing dev-browser directory: ${devBrowserDir}. ` +
        'Run "pnpm -F @myboteam/desktop build:mcp-tools:dev" and rebuild artifacts.';
      onProgress?.(message);
      reject(new Error(message));
      return;
    }

    const nodeExe = getNodeExecutable(config.bundledNodeBinPath);
    const playwrightCliPath = resolvePlaywrightCliPath(config.mcpToolsPath);
    const spawnEnv = buildNodeEnvironment(config.bundledNodeBinPath);

    onProgress?.('Downloading browser...');

    const child = spawn(nodeExe, [playwrightCliPath, 'install', 'chromium'], {
      cwd: devBrowserDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: spawnEnv,
      shell: false,
    });

    child.stdout?.on('data', (data: Buffer) => {
      const line = data.toString().trim();
      if (line) {
        log.info(`[Playwright Install] ${line}`);
        if (line.includes('%') || line.toLowerCase().startsWith('downloading')) {
          onProgress?.(line);
        }
      }
    });

    child.stderr?.on('data', (data: Buffer) => {
      const line = data.toString().trim();
      if (line) {
        log.info(`[Playwright Install] ${line}`);
      }
    });

    child.on('close', (code) => {
      if (code === 0) {
        log.info('[Browser] Playwright Chromium installed successfully');
        onProgress?.('Browser installed successfully!');
        resolve();
      } else {
        reject(new Error(`Playwright install failed with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}
