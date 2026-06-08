import type { Database as SqlJsDatabase } from 'sql.js';

export type { SqlJsDatabase as Database };

export interface DatabaseOptions {
  databasePath: string;
  runMigrations?: boolean;
}

export function applyPragmas(db: SqlJsDatabase): void {
  db.run('PRAGMA foreign_keys = ON');
}
