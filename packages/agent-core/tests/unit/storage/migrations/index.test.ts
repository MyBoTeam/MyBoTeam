import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { Database } from 'sql.js';
import initSqlJs from 'sql.js';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FutureSchemaError } from '../../../../src/storage/migrations/errors.js';

describe('Migrations', () => {
  let SQL: Awaited<ReturnType<typeof initSqlJs>>;
  let testDir: string;
  let dbPath: string;
  let db: Database;
  let migrationModule: typeof import('../../../../src/storage/migrations/index.js');

  beforeAll(async () => {
    SQL = await initSqlJs();
    migrationModule = await import('../../../../src/storage/migrations/index.js');
  });

  beforeEach(() => {
    testDir = path.join(
      os.tmpdir(),
      `migrate-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    fs.mkdirSync(testDir, { recursive: true });
    dbPath = path.join(testDir, 'test.db');
    db = new SQL.Database();
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('getStoredVersion', () => {
    it('returns 0 when schema_meta table does not exist', () => {
      const version = migrationModule.getStoredVersion(db);
      expect(version).toBe(0);
    });

    it('returns 0 when schema_meta has no version key', () => {
      db.run('CREATE TABLE schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
      const version = migrationModule.getStoredVersion(db);
      expect(version).toBe(0);
    });

    it('returns the stored version number', () => {
      db.run('CREATE TABLE schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
      db.run('INSERT INTO schema_meta (key, value) VALUES (?, ?)', ['version', '31']);
      const version = migrationModule.getStoredVersion(db);
      expect(version).toBe(31);
    });
  });

  describe('runMigrations', () => {
    it('runs v001Init on a fresh database (version 0) and creates expected tables', () => {
      migrationModule.runMigrations(db);
      const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
      const tableNames = tables[0].values.map((v) => v[0] as string);
      expect(tableNames).toContain('schema_meta');
      expect(tableNames).toContain('app_settings');
      expect(tableNames).toContain('tasks');
      expect(tableNames).toContain('provider_meta');
      expect(tableNames).toContain('providers');
      expect(tableNames).toContain('workspaces');
      expect(tableNames).toContain('google_accounts');
      expect(tableNames).toContain('knowledge_notes');
    });

    it('sets CURRENT_VERSION in schema_meta after migration', () => {
      migrationModule.runMigrations(db);
      const rows = db.exec("SELECT value FROM schema_meta WHERE key = 'version'");
      const version = parseInt(String(rows[0].values[0][0]), 10);
      expect(version).toBe(migrationModule.CURRENT_VERSION);
    });

    it('is idempotent — running twice does not throw', () => {
      migrationModule.runMigrations(db);
      expect(() => migrationModule.runMigrations(db)).not.toThrow();
    });
  });

  describe('legacy version handler (OLD_MAX_VERSION)', () => {
    it('rewrites stored version >= 31 to CURRENT_VERSION', () => {
      db.run('CREATE TABLE schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
      db.run('INSERT INTO schema_meta (key, value) VALUES (?, ?)', ['version', '31']);
      migrationModule.runMigrations(db);
      const rows = db.exec("SELECT value FROM schema_meta WHERE key = 'version'");
      const version = parseInt(String(rows[0].values[0][0]), 10);
      expect(version).toBe(migrationModule.CURRENT_VERSION);
    });

    it('does not throw FutureSchemaError for version 31 (squashed migration)', () => {
      db.run('CREATE TABLE schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
      db.run('INSERT INTO schema_meta (key, value) VALUES (?, ?)', ['version', '31']);
      expect(() => migrationModule.runMigrations(db)).not.toThrow();
    });
  });

  describe('FutureSchemaError', () => {
    it('throws when stored version exceeds CURRENT_VERSION', () => {
      db.run('CREATE TABLE schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
      db.run('INSERT INTO schema_meta (key, value) VALUES (?, ?)', ['version', '5']);
      expect(() => migrationModule.runMigrations(db)).toThrow(FutureSchemaError);
    });

    it('throws when stored version exceeds OLD_MAX_VERSION (future schema)', () => {
      db.run('CREATE TABLE schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
      db.run('INSERT INTO schema_meta (key, value) VALUES (?, ?)', ['version', '32']);
      expect(() => migrationModule.runMigrations(db)).toThrow(FutureSchemaError);
    });
  });
});
