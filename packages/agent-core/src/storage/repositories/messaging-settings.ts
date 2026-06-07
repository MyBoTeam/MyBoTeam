import type { MessagingConfig } from '../../common/types/messaging.js';
import { flushDatabase, getDatabase } from '../database.js';
import { getRow } from './app-settings-common.js';

export function getMessagingConfig(): MessagingConfig | null {
  const row = getRow();
  if (!row.messaging_config) return null;
  try {
    return JSON.parse(row.messaging_config) as MessagingConfig;
  } catch {
    return null;
  }
}

export function setMessagingConfig(config: MessagingConfig | null): void {
  const db = getDatabase();
  db.run('UPDATE app_settings SET messaging_config = ? WHERE id = 1', [
    config ? JSON.stringify(config) : null,
  ]);
  flushDatabase();
}
