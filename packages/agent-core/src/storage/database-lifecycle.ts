import { existsSync, renameSync } from 'node:fs';
import { cleanupWalShm, flushDbToDisk } from './database-queries.js';
import { _db, _dbPath, _flushTimer, setDb, setDbPath, setFlushTimer } from './database-state.js';

export function closeDatabase(): void {
  if (!_db) {
    return;
  }
  if (_flushTimer) {
    clearTimeout(_flushTimer);
    setFlushTimer(null);
  }
  if (_dbPath && _dbPath !== ':memory:') {
    flushDbToDisk(_db, _dbPath);
  }
  _db.close();
  setDb(null);
  setDbPath(null);
}

export function resetDatabase(databasePath: string): void {
  if (_db) {
    flushDbToDisk(_db, _dbPath!);
    _db.close();
    setDb(null);
  }
  setDbPath(null);
  if (existsSync(databasePath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    renameSync(databasePath, `${databasePath}.corrupt.${timestamp}`);
  }
  cleanupWalShm(databasePath);
}

export function resetDatabaseInstance(): void {
  closeDatabase();
}
