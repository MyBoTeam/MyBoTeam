import type { Database } from '../database.js';
import { withTransaction } from '../database.js';
import { FutureSchemaError } from './errors.js';
import { v001Init } from './v001-init.js';
import { v002ThemeColor } from './v002-theme-color.js';

export const CURRENT_VERSION = 2;

export interface Migration {
  version: number;
  up: (db: Database) => void;
}

const migrations: Migration[] = [
  { version: 1, up: v001Init },
  { version: 2, up: v002ThemeColor },
];

export function getStoredVersion(db: Database): number {
  const result = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_meta'",
  );
  if (!result.length || !result[0].values.length) {
    return 0;
  }
  const versionResult = db.exec("SELECT value FROM schema_meta WHERE key = 'version'");
  if (!versionResult.length || !versionResult[0].values.length) {
    return 0;
  }
  return parseInt(String(versionResult[0].values[0][0]), 10);
}

function setStoredVersion(db: Database, version: number): void {
  db.run('INSERT OR REPLACE INTO schema_meta (key, value) VALUES (?, ?)', [
    'version',
    String(version),
  ]);
}

const OLD_MAX_VERSION = 31;

export function runMigrations(db: Database): void {
  let storedVersion = getStoredVersion(db);

  if (storedVersion > OLD_MAX_VERSION) {
    throw new FutureSchemaError(storedVersion, CURRENT_VERSION);
  }

  if (storedVersion === OLD_MAX_VERSION) {
    setStoredVersion(db, CURRENT_VERSION);
    storedVersion = CURRENT_VERSION;
  }

  if (storedVersion > CURRENT_VERSION) {
    throw new FutureSchemaError(storedVersion, CURRENT_VERSION);
  }
  for (const migration of migrations) {
    if (migration.version > storedVersion) {
      withTransaction(db, () => {
        migration.up(db);
        setStoredVersion(db, migration.version);
      });
    }
  }
}
