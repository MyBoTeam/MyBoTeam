import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { DatabaseError } from './errors.js';

export interface DatabaseConfig {
  dataDir?: string;
  mode: 'production' | 'development' | 'test';
}

export function getDatabasePath(config: DatabaseConfig): string {
  if (config.mode === 'test') {
    return ':memory:';
  }

  const dataDir = config.dataDir ?? process.env.MYBOTEAM_DATA_DIR ?? '~/.myboteam/data';
  const expandedDir = dataDir.startsWith('~')
    ? join(process.env.HOME ?? '', dataDir.slice(1))
    : dataDir;

  if (!existsSync(expandedDir)) {
    mkdirSync(expandedDir, { recursive: true });
  }

  const filename = config.mode === 'development' ? 'myboteam_dev.db' : 'myboteam.db';
  return join(expandedDir, filename);
}

export function initializeDatabase(config: DatabaseConfig): Database.Database {
  const dbPath = getDatabasePath(config);

  try {
    const db = config.mode === 'test' ? new Database(':memory:') : new Database(dbPath);

    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = -20000');
    db.pragma('temp_store = MEMORY');

    db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    return db;
  } catch (error) {
    throw new DatabaseError(`Failed to initialize database at ${dbPath}: ${error}`, 'INIT_FAILED');
  }
}

export function verifyWalMode(db: Database.Database): boolean {
  const result = db.pragma('journal_mode', { simple: true });
  return result === 'wal';
}

export function getTableCount(db: Database.Database, table: string): number {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
    throw new DatabaseError(`Invalid table name: ${table}`, 'INVALID_TABLE_NAME');
  }
  const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
  return result.count;
}

export function closeDatabase(db: Database.Database): void {
  db.close();
}
