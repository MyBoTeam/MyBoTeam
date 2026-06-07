import path from 'node:path';
import { app } from 'electron';
import { getLogCollector } from '../logging';

export const SPAWN_READY_TIMEOUT_MS = 10_000;
export const POLL_INTERVAL_MS = 200;
export const LOGIN_ITEM_RETRY_DELAY_MS = 500;

export type ConnectionStateHandler = (state: 'connected' | 'disconnected' | 'reconnecting') => void;

export function log(
  level: 'INFO' | 'WARN' | 'ERROR',
  msg: string,
  data?: Record<string, unknown>,
): void {
  try {
    const l = getLogCollector();
    if (l?.log) {
      l.log(level, 'daemon', msg, data);
    }
  } catch {}
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getDataDir(): string {
  return app.getPath('userData');
}

export function getDaemonEntryPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'daemon', 'index.js');
  }
  return path.join(app.getAppPath(), '..', 'daemon', 'dist', 'index.js');
}
