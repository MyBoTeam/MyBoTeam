import { existsSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Database as SqlJsDatabase } from 'sql.js';

declare const __dirname: string | undefined;

export function locateSqlJsFile(file: string): string {
  const candidates: string[] = [];

  try {
    const moduleDir = dirname(fileURLToPath(import.meta.url));
    candidates.push(join(moduleDir, '..', '..', 'node_modules', 'sql.js', 'dist', file));
  } catch {}

  if (typeof __dirname !== 'undefined') {
    candidates.push(join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file));
    candidates.push(join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', file));
  }

  candidates.push(
    join(process.cwd(), 'packages', 'agent-core', 'node_modules', 'sql.js', 'dist', file),
    join(process.cwd(), '..', 'packages', 'agent-core', 'node_modules', 'sql.js', 'dist', file),
    join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
    join(process.cwd(), '..', 'node_modules', 'sql.js', 'dist', file),
  );

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return join(process.cwd(), 'node_modules', 'sql.js', 'dist', file);
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

export function databaseExists(databasePath: string): boolean {
  return existsSync(databasePath);
}

export function flushDbToDisk(db: SqlJsDatabase, dbPath: string): void {
  const data = db.export();
  db.run('PRAGMA foreign_keys = ON');
  const tmpPath = `${dbPath}.tmp`;
  writeFileSync(tmpPath, Buffer.from(data));
  renameSync(tmpPath, dbPath);
}

export function cleanupWalShm(databasePath: string): void {
  for (const ext of ['-wal', '-shm', '-tmp']) {
    const p = databasePath + ext;
    if (existsSync(p)) {
      unlinkSync(p);
    }
  }
}
