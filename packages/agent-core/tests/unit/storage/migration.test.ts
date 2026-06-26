import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { createChildLogger } from '../../../src/storage/logger.js';
import { migrations } from '../../../src/storage/migrations/index.js';
import { runMigrations } from '../../../src/storage/runner.js';

describe('Migration Runner', () => {
  let db: Database.Database;
  const log = createChildLogger({ module: 'migration-test' });

  afterEach(() => {
    if (db && db.open) {
      db.close();
    }
  });

  it('should create _migrations table', () => {
    db = new Database(':memory:');
    runMigrations(db, migrations, log);

    const table = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'")
      .get();
    expect(table).toBeDefined();
  });

  it('should record applied migrations', () => {
    db = new Database(':memory:');
    runMigrations(db, migrations, log);

    const count = db.prepare('SELECT COUNT(*) as count FROM _migrations').get() as {
      count: number;
    };
    expect(count.count).toBeGreaterThan(0);
  });

  it('should not re-apply already applied migrations', () => {
    db = new Database(':memory:');
    runMigrations(db, migrations, log);

    const count1 = db.prepare('SELECT COUNT(*) as count FROM _migrations').get() as {
      count: number;
    };

    db.prepare('DELETE FROM _migrations').run();
    for (const m of migrations) {
      db.prepare('INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
        String(m.version),
        m.name,
        new Date().toISOString(),
      );
    }

    runMigrations(db, migrations, log);
    const count2 = db.prepare('SELECT COUNT(*) as count FROM _migrations').get() as {
      count: number;
    };

    expect(count2.count).toBe(count1.count);
  });

  it('should apply migrations in version order', () => {
    db = new Database(':memory:');

    const reversed = [...migrations].reverse();
    runMigrations(db, reversed, log);

    const applied = db.prepare('SELECT version FROM _migrations ORDER BY version').all() as {
      version: number;
    }[];
    const versions = applied.map((r) => r.version);
    const sorted = [...versions].sort((a, b) => a - b);
    expect(versions).toEqual(sorted);
  });

  it('should handle empty migration list', () => {
    db = new Database(':memory:');
    expect(() => runMigrations(db, [], log)).not.toThrow();
  });
});
