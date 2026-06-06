/**
 * storage.ts — path-derivation helpers for Electron main.
 */

import path from 'node:path';
import { app } from 'electron';

export function getDatabasePath(): string {
  const dbName = app.isPackaged ? 'myboteam.db' : 'myboteam-dev.db';
  return path.join(app.getPath('userData'), dbName);
}
