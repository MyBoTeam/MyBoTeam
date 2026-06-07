import type { BrowserWindow } from 'electron';
import { createMainWindow } from './app-window';

export let mainWindow: BrowserWindow | null = null;
export let isQuitting = false;
export let isShuttingDown = false;

export const isQuittingRef = {
  get value() {
    return isQuitting;
  },
  set value(v: boolean) {
    isQuitting = v;
  },
};

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function setShuttingDown(v: boolean): void {
  isShuttingDown = v;
}

export function createNewWindow(ROUTER_URL: string | undefined, WEB_DIST: string): BrowserWindow {
  mainWindow = createMainWindow({ ROUTER_URL, WEB_DIST });
  return mainWindow;
}
