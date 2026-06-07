import type { BrowserWindow } from 'electron';
import { app, ipcMain } from 'electron';

type WindowGetter = () => BrowserWindow | null;

const protocolUrlQueue: string[] = [];

function dispatchProtocolUrl(win: BrowserWindow, url: string): void {
  if (url.startsWith('myboteam://callback/mcp')) {
    win.webContents.send('auth:mcp-callback', url);
  } else if (url.startsWith('myboteam://callback')) {
    win.webContents.send('auth:callback', url);
  }
}

function isRendererReady(win: BrowserWindow): boolean {
  return !win.webContents.isLoadingMainFrame() && !win.isDestroyed();
}

export function drainProtocolUrlQueue(win: BrowserWindow): void {
  if (!isRendererReady(win)) {
    win.webContents.once('did-finish-load', () => drainProtocolUrlQueue(win));
    return;
  }

  while (protocolUrlQueue.length > 0) {
    const url = protocolUrlQueue.shift();
    if (url) {
      dispatchProtocolUrl(win, url);
    }
  }
}

function enqueueProtocolUrl(url: string, getMainWindow: WindowGetter): void {
  protocolUrlQueue.push(url);
  const win = getMainWindow();

  if (win && !win.isDestroyed()) {
    if (isRendererReady(win)) {
      drainProtocolUrlQueue(win);
    } else {
      win.webContents.once('did-finish-load', () => drainProtocolUrlQueue(win));
    }
  }
}

export function handleProtocolUrlFromArgs(getMainWindow: WindowGetter): void {
  if (process.platform !== 'win32') {
    return;
  }

  const protocolUrl = process.argv.find((arg) => arg.startsWith('myboteam://'));
  if (!protocolUrl) {
    return;
  }

  app.whenReady().then(() => {
    enqueueProtocolUrl(protocolUrl, getMainWindow);
  });
}

export function registerProtocolEventHandlers(getMainWindow: WindowGetter): void {
  app.on('open-url', (event, url) => {
    event.preventDefault();
    enqueueProtocolUrl(url, getMainWindow);
  });
}

export function handleSecondInstanceProtocolUrl(
  _win: BrowserWindow,
  commandLine: string[],
  getMainWindow: WindowGetter,
): void {
  if (process.platform !== 'win32') {
    return;
  }

  const protocolUrl = commandLine.find((arg) => arg.startsWith('myboteam://'));
  if (protocolUrl) {
    enqueueProtocolUrl(protocolUrl, getMainWindow);
  }
}

export function registerAppIpcHandlers(): void {
  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.handle('app:platform', () => process.platform);
  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
  }));
  ipcMain.handle('app:is-e2e-mode', () => {
    return (
      (global as Record<string, unknown>).E2E_MOCK_TASK_EVENTS === true ||
      process.env.E2E_MOCK_TASK_EVENTS === '1'
    );
  });
}
