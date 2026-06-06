import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';

declare const __dirname: string | undefined;

let _db: SqlJsDatabase | null = null;
let _dbPath: string | null = null;
let _flushTimer: NodeJS.Timeout | null = null;
let _initPromise: Promise<void> | null = null;

export interface DatabaseOptions {
  databasePath: string;
  runMigrations?: boolean;
}

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
      locateFile: (file: string) => {
        const candidates: string[] = [];

        // 1. ESM: resolve relative to the current module file
        try {
          const moduleDir = dirname(fileURLToPath(import.meta.url));
          candidates.push(join(moduleDir, '..', '..', 'node_modules', 'sql.js', 'dist', file));
        } catch {
          // import.meta.url unavailable (CJS bundle) — skip
        }

        // 2. CJS: resolve relative to __dirname (available in daemon's tsup CJS bundle)
        if (typeof __dirname !== 'undefined') {
          candidates.push(join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file));
          candidates.push(join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', file));
        }

        // 3. Fallback: cwd-based paths (for dev/CLI usage where cwd is the project root)
        candidates.push(
          join(process.cwd(), 'packages', 'agent-core', 'node_modules', 'sql.js', 'dist', file),
          join(
            process.cwd(),
            '..',
            'packages',
            'agent-core',
            'node_modules',
            'sql.js',
            'dist',
            file,
          ),
          join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
          join(process.cwd(), '..', 'node_modules', 'sql.js', 'dist', file),
        );

        for (const candidate of candidates) {
          if (existsSync(candidate)) {
            return candidate;
          }
        }

        return join(process.cwd(), 'node_modules', 'sql.js', 'dist', file);
      },
    });

    let db: SqlJsDatabase;
    if (databasePath !== ':memory:' && existsSync(databasePath)) {
      const buffer = readFileSync(databasePath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    db.run('PRAGMA foreign_keys = ON');

    if (runMigrations) {
      const { runMigrations: runMigs } = await import('./migrations/index.js');
      runMigs(db);
      if (databasePath !== ':memory:') {
        const data = db.export();
        const tmpPath = `${databasePath}.tmp`;
        writeFileSync(tmpPath, Buffer.from(data));
        renameSync(tmpPath, databasePath);
        db.run('PRAGMA foreign_keys = ON');
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
    const data = _db.export();
    // sql.js export() resets PRAGMA foreign_keys to OFF; re-apply before close
    _db.run('PRAGMA foreign_keys = ON');
    const tmpPath = `${_dbPath}.tmp`;
    writeFileSync(tmpPath, Buffer.from(data));
    renameSync(tmpPath, _dbPath);
  }
  _db.close();
  _db = null;
  _dbPath = null;
}

export function resetDatabase(databasePath: string): void {
  if (_db) {
    flushDatabaseSync();
    _db.close();
    _db = null;
  }
  _dbPath = null;
  if (existsSync(databasePath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    renameSync(databasePath, `${databasePath}.corrupt.${timestamp}`);
  }
  // Clean up old WAL/SHM sidecar files (legacy from pre-sql.js era)
  for (const ext of ['-wal', '-shm', '-tmp']) {
    const p = databasePath + ext;
    if (existsSync(p)) unlinkSync(p);
  }
}

export function isDatabaseInitialized(): boolean {
  return _db !== null;
}

export function getDatabasePath(): string | null {
  return _dbPath;
}

export function databaseExists(databasePath: string): boolean {
  return existsSync(databasePath);
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
      const data = _db.export();
      _db.run('PRAGMA foreign_keys = ON');
      const tmpPath = `${_dbPath}.tmp`;
      writeFileSync(tmpPath, Buffer.from(data));
      renameSync(tmpPath, _dbPath);
    } catch (err) {
      _flushTimer = null;
      console.error('[database] Failed to flush database to disk:', err);
    }
  }, 50);
}

function flushDatabaseSync(): void {
  if (!_db || !_dbPath) {
    return;
  }
  if (_dbPath === ':memory:') {
    return;
  }
  if (_flushTimer) {
    clearTimeout(_flushTimer);
    _flushTimer = null;
  }
  const data = _db.export();
  const tmpPath = `${_dbPath}.tmp`;
  writeFileSync(tmpPath, Buffer.from(data));
  renameSync(tmpPath, _dbPath);
  // sql.js export() resets PRAGMA foreign_keys to OFF; re-apply
  _db.run('PRAGMA foreign_keys = ON');
}

export function withTransaction<T>(db: SqlJsDatabase, fn: () => T): T {
  db.run('BEGIN');
  try {
    const result = fn();
    db.run('COMMIT');
    return result;
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
}

export type { SqlJsDatabase as Database };
