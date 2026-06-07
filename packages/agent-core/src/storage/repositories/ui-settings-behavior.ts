import { flushDatabase, getDatabase } from '../database.js';
import { getUiRow } from './ui-settings-common.js';

export function getNotificationsEnabled(): boolean {
  return getUiRow().notifications_enabled === 1;
}

export function setNotificationsEnabled(enabled: boolean): void {
  const db = getDatabase();
  db.run('UPDATE app_settings SET notifications_enabled = ? WHERE id = 1', [enabled ? 1 : 0]);
  flushDatabase();
}

export type CloseBehavior = 'keep-daemon' | 'stop-daemon';

export function getCloseBehavior(): CloseBehavior {
  const row = getUiRow();
  if (row.close_behavior === 'stop-daemon') {
    return 'stop-daemon';
  }
  return 'keep-daemon';
}

export function setCloseBehavior(behavior: CloseBehavior): void {
  if (behavior !== 'keep-daemon' && behavior !== 'stop-daemon') {
    throw new Error(`Invalid close behavior: ${behavior}`);
  }
  const db = getDatabase();
  db.run('UPDATE app_settings SET close_behavior = ? WHERE id = 1', [behavior]);
  flushDatabase();
}
