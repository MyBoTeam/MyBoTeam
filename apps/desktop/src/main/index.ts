import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { app } from 'electron';

const APP_DATA_NAME = 'MyBoTeam';
app.setPath('userData', path.join(app.getPath('appData'), APP_DATA_NAME));

if (process.platform === 'win32') {
  app.setAppUserModelId('ai.myboteam.desktop');
}

import { registerLifecycleHooks, runCleanStart } from './app-lifecycle';
import { startApp } from './app-startup';
import { getLogCollector, initializeLogCollector } from './logging';
import {
  handleProtocolUrlFromArgs,
  handleSecondInstanceProtocolUrl,
  registerAppIpcHandlers,
  registerProtocolEventHandlers,
} from './protocol-handlers';
import { createNewWindow, getMainWindow, isQuittingRef } from './window-manager';

function logMain(level: 'INFO' | 'WARN' | 'ERROR', msg: string, data?: Record<string, unknown>) {
  try {
    const l = getLogCollector();
    if (l?.log) {
      l.log(level, 'main', msg, data);
    }
  } catch (_e) {
    /* best-effort logging */
  }
}

if (process.argv.includes('--e2e-skip-auth')) {
  (global as Record<string, unknown>).E2E_SKIP_AUTH = true;
}
if (process.argv.includes('--e2e-mock-tasks') || process.env.E2E_MOCK_TASK_EVENTS === '1') {
  (global as Record<string, unknown>).E2E_MOCK_TASK_EVENTS = true;
}

registerLifecycleHooks();

await runCleanStart();

app.setName('MyBoTeam');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = app.isPackaged
  ? path.join(process.resourcesPath, '.env')
  : path.join(__dirname, '../../.env');
config({ path: envPath });

process.env.APP_ROOT = path.join(__dirname, '../..');
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');

import { loadBuildConfig } from './config/build-config';

loadBuildConfig();

import { initSentry } from './sentry';

initSentry();

const ROUTER_URL = process.env.MYBOTEAM_ROUTER_URL;
const WEB_DIST = app.isPackaged
  ? path.join(process.resourcesPath, 'web-ui')
  : path.join(process.env.APP_ROOT, '../web/dist/client');

const createWindow = () => {
  createNewWindow(ROUTER_URL, WEB_DIST);
};

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  logMain('INFO', '[Main] Second instance attempted; quitting');
  app.quit();
} else {
  initializeLogCollector();
  getLogCollector().logEnv('INFO', 'App starting', {
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
  });

  app.on('second-instance', (_event, commandLine) => {
    const mw = getMainWindow();
    if (mw) {
      if (mw.isMinimized()) {
        mw.restore();
      }
      mw.focus();
      logMain('INFO', '[Main] Focused existing instance after second-instance event');
      handleSecondInstanceProtocolUrl(mw, commandLine, () => mw);
    }
  });

  app.whenReady().then(async () => {
    await startApp(createWindow, getMainWindow, isQuittingRef);
  });
}

if (process.platform === 'win32' && !app.isPackaged) {
  app.setAsDefaultProtocolClient('myboteam', process.execPath, [path.resolve(process.argv[1])]);
} else {
  app.setAsDefaultProtocolClient('myboteam');
}

handleProtocolUrlFromArgs(getMainWindow);
registerProtocolEventHandlers(getMainWindow);
registerAppIpcHandlers();
