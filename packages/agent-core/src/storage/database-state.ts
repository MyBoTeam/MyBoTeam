import type { Database as SqlJsDatabase } from 'sql.js';

export let _db: SqlJsDatabase | null = null;
export let _dbPath: string | null = null;
export let _flushTimer: NodeJS.Timeout | null = null;
export let _initPromise: Promise<void> | null = null;

export function setDb(db: SqlJsDatabase | null): void {
  _db = db;
}

export function setDbPath(dbPath: string | null): void {
  _dbPath = dbPath;
}

export function setFlushTimer(timer: NodeJS.Timeout | null): void {
  _flushTimer = timer;
}

export function setInitPromise(promise: Promise<void> | null): void {
  _initPromise = promise;
}
