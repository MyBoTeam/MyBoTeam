import { existsSync, readFileSync, renameSync } from 'node:fs';
import type { Database as SqlJsDatabase } from 'sql.js';
import initSqlJs from 'sql.js';
import {
  cleanupWalShm,
  databaseExists,
  flushDbToDisk,
  locateSqlJsFile,
} from './database-queries.js';
import { applyPragmas, type DatabaseOptions } from './database-schema.js';

export { databaseExists, withTransaction } from './database-queries.js';
export type { Database, DatabaseOptions } from './database-schema.js';

let _db: SqlJsDatabase | null = null;
let _dbPath: string | null = null;
let _flushTimer: NodeJS.Timeout | null = null;
let _initPromise: Promise<void> | null = null;

export async function initializeDatabase(options: DatabaseOptions): Promise<SqlJsDatabase> {
  const { databasePath, runMigrations = true } = options;

  if (_db && _dbPath === databasePath) {
    return _db;
  }

  if (_initPromise) {
    await _initPromise;
    if (_db && _dbPath === databasePath) {
      return _db;
    }
  }

  if (_db) {
    closeDatabase();
  }

  _initPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: locateSqlJsFile,
    });

    let db: SqlJsDatabase;
    if (databasePath !== ':memory:' && existsSync(databasePath)) {
      const buffer = readFileSync(databasePath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    applyPragmas(db);

    if (runMigrations) {
      const { runMigrations: runMigs } = await import('./migrations/index.js');
      runMigs(db);
      if (databasePath !== ':memory:') {
        flushDbToDisk(db, databasePath);
        applyPragmas(db);
      }
    }

    _db = db;
    _dbPath = databasePath;
  })();

  try {
    await _initPromise;
  } catch (err) {
    _initPromise = null;
    throw err;
  }

  _initPromise = null;
  return _db!;
}

export function getDatabase(): SqlJsDatabase {
  if (!_db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return _db;
}

export function closeDatabase(): void {
  if (!_db) {
    return;
  }
  if (_flushTimer) {
    clearTimeout(_flushTimer);
    _flushTimer = null;
  }
  if (_dbPath && _dbPath !== ':memory:') {
    flushDbToDisk(_db, _dbPath);
  }
  _db.close();
  _db = null;
  _dbPath = null;
}

export function resetDatabase(databasePath: string): void {
  if (_db) {
    flushDbToDisk(_db, _dbPath!);
    _db.close();
    _db = null;
  }
  _dbPath = null;
  if (existsSync(databasePath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    renameSync(databasePath, `${databasePath}.corrupt.${timestamp}`);
  }
  cleanupWalShm(databasePath);
}

export function isDatabaseInitialized(): boolean {
  return _db !== null;
}

export function getDatabasePath(): string | null {
  return _dbPath;
}

export function resetDatabaseInstance(): void {
  closeDatabase();
}

export function flushDatabase(): void {
  if (!_db || !_dbPath) {
    return;
  }
  if (_dbPath === ':memory:') {
    return;
  }
  if (_flushTimer) clearTimeout(_flushTimer);
  _flushTimer = setTimeout(() => {
    if (!_db || !_dbPath) return;
    try {
      flushDbToDisk(_db, _dbPath);
    } catch (err) {
      _flushTimer = null;
      console.error('[database] Failed to flush database to disk:', err);
    }
  }, 50);
}
