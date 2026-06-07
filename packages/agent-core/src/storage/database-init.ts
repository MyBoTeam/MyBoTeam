import { existsSync, readFileSync } from 'node:fs';
import type { Database as SqlJsDatabase } from 'sql.js';
import initSqlJs from 'sql.js';
import { closeDatabase } from './database-lifecycle.js';
import { flushDbToDisk, locateSqlJsFile } from './database-queries.js';
import { applyPragmas, type DatabaseOptions } from './database-schema.js';
import { _db, _dbPath, _initPromise, setDb, setDbPath, setInitPromise } from './database-state.js';

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

  setInitPromise(
    (async () => {
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

      setDb(db);
      setDbPath(databasePath);
    })(),
  );

  try {
    await _initPromise;
  } catch (err) {
    setInitPromise(null);
    throw err;
  }

  setInitPromise(null);
  return _db!;
}
