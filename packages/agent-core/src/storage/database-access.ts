import type { Database as SqlJsDatabase } from 'sql.js';
import { flushDbToDisk } from './database-queries.js';
import { _db, _dbPath, _flushTimer, setFlushTimer } from './database-state.js';

export function getDatabase(): SqlJsDatabase {
  if (!_db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return _db;
}

export function isDatabaseInitialized(): boolean {
  return _db !== null;
}

export function getDatabasePath(): string | null {
  return _dbPath;
}

export function flushDatabase(): void {
  if (!_db || !_dbPath) {
    return;
  }
  if (_dbPath === ':memory:') {
    return;
  }
  if (_flushTimer) clearTimeout(_flushTimer);
  setFlushTimer(
    setTimeout(() => {
      if (!_db || !_dbPath) return;
      try {
        flushDbToDisk(_db, _dbPath);
      } catch (err) {
        setFlushTimer(null);
        console.error('[database] Failed to flush database to disk:', err);
      }
    }, 50),
  );
}
