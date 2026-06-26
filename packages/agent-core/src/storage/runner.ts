import type Database from 'better-sqlite3';
import { DatabaseError } from './errors.js';
import { type createChildLogger, logOperation } from './logger.js';

export interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
}

export function runMigrations(
  db: Database.Database,
  migrations: Migration[],
  log: ReturnType<typeof createChildLogger>,
): void {
  logOperation(log, 'runMigrations', () => {
    db.prepare(
      'CREATE TABLE IF NOT EXISTS _migrations (version TEXT PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)',
    ).run();

    const count = db.prepare('SELECT COUNT(*) as count FROM _migrations').get() as {
      count: number;
    };
    if (count.count === 0) {
      db.prepare('INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
        '000',
        'initial',
        new Date().toISOString(),
      );
    }

    const applied = db.prepare('SELECT version FROM _migrations').all() as { version: number }[];
    const appliedVersions = new Set(applied.map((r) => r.version));

    const sorted = [...migrations].sort((a, b) => a.version - b.version);
    const pending = sorted.filter((m) => !appliedVersions.has(m.version));

    if (pending.length === 0) return;

    const runAll = db.transaction(() => {
      for (const migration of pending) {
        try {
          migration.up(db);
          db.prepare('INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
            migration.version,
            migration.name,
            new Date().toISOString(),
          );
        } catch (err) {
          throw new DatabaseError(
            `Migration ${migration.version} (${migration.name}) failed: ${err}`,
            'MIGRATION_FAILED',
          );
        }
      }
    });
    runAll();
  });
}
