import type { CloudBrowserConfig } from '../../common/types/cloud-browser.js';
import { flushDatabase, getDatabase } from '../database.js';
import { getRow } from './app-settings-common.js';

export function getCloudBrowserConfig(): CloudBrowserConfig | null {
  const row = getRow();
  if (!row.cloud_browser_config) return null;
  try {
    return JSON.parse(row.cloud_browser_config) as CloudBrowserConfig;
  } catch {
    return null;
  }
}

export function setCloudBrowserConfig(config: CloudBrowserConfig | null): void {
  const db = getDatabase();
  db.run('UPDATE app_settings SET cloud_browser_config = ? WHERE id = 1', [
    config ? JSON.stringify(config) : null,
  ]);
  flushDatabase();
}
