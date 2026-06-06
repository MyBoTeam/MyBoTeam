import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Database', () => {
  let testDir: string;
  let dbPath: string;
  let databaseModule: typeof import('../../../src/storage/database.js') | null = null;

  beforeAll(async () => {
    databaseModule = await import('../../../src/storage/database.js');
  });

  beforeEach(() => {
    if (databaseModule) {
      databaseModule.resetDatabaseInstance();
    }
    testDir = path.join(
      os.tmpdir(),
      `db-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    fs.mkdirSync(testDir, { recursive: true });
    dbPath = path.join(testDir, 'test.db');

    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    if (databaseModule) {
      databaseModule.resetDatabaseInstance();
    }

    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('initializeDatabase', () => {
    it('should initialize database with migrations', async () => {
      const db = await databaseModule!.initializeDatabase({ databasePath: dbPath });

      expect(db).toBeDefined();
      expect(databaseModule!.isDatabaseInitialized()).toBe(true);
      expect(databaseModule!.getDatabasePath()).toBe(dbPath);
    });

    it('should create database file', async () => {
      await databaseModule!.initializeDatabase({ databasePath: dbPath });
      databaseModule!.closeDatabase();
      databaseModule!.resetDatabaseInstance();
      expect(fs.existsSync(dbPath)).toBe(true);
    });

    it('should return existing connection when called with same path', async () => {
      const db1 = await databaseModule!.initializeDatabase({ databasePath: dbPath });
      const db2 = await databaseModule!.initializeDatabase({ databasePath: dbPath });

      expect(db1).toBe(db2);
    });

    it('should close and reinitialize with different path', async () => {
      const path1 = path.join(testDir, 'test1.db');
      const path2 = path.join(testDir, 'test2.db');

      const db1 = await databaseModule!.initializeDatabase({ databasePath: path1 });
      const db2 = await databaseModule!.initializeDatabase({ databasePath: path2 });

      expect(db1).not.toBe(db2);
      expect(databaseModule!.getDatabasePath()).toBe(path2);
    });

    it('should skip migrations when runMigrations is false', async () => {
      const db = await databaseModule!.initializeDatabase({
        databasePath: dbPath,
        runMigrations: false,
      });

      expect(db).toBeDefined();

      const tables = db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_meta'",
      );
      expect(tables.length).toBe(0);
    });
  });

  describe('journal mode', () => {
    it('should default to delete journal mode (sql.js limitation)', async () => {
      const db = await databaseModule!.initializeDatabase({ databasePath: dbPath });

      const [pragmaResult] = db.exec('PRAGMA journal_mode');
      expect(pragmaResult.values[0][0]).toBe('delete');
    });
  });

  describe('foreign keys', () => {
    it('should enforce foreign keys', async () => {
      const db = await databaseModule!.initializeDatabase({ databasePath: dbPath });

      const [pragmaResult] = db.exec('PRAGMA foreign_keys');
      expect(pragmaResult.values[0][0]).toBe(1);
    });
  });

  describe('getDatabase', () => {
    it('should throw error if database not initialized', () => {
      expect(() => databaseModule!.getDatabase()).toThrow('Database not initialized');
    });

    it('should return database after initialization', async () => {
      await databaseModule!.initializeDatabase({ databasePath: dbPath });
      const db = databaseModule!.getDatabase();
      expect(db).toBeDefined();
    });
  });

  describe('closeDatabase', () => {
    it('should close database properly', async () => {
      await databaseModule!.initializeDatabase({ databasePath: dbPath });
      expect(databaseModule!.isDatabaseInitialized()).toBe(true);

      databaseModule!.closeDatabase();

      expect(databaseModule!.isDatabaseInitialized()).toBe(false);
      expect(databaseModule!.getDatabasePath()).toBeNull();
    });

    it('should not throw when closing already closed database', () => {
      expect(() => databaseModule!.closeDatabase()).not.toThrow();
    });
  });

  describe('resetDatabaseInstance', () => {
    it('should reset database instance', async () => {
      await databaseModule!.initializeDatabase({ databasePath: dbPath });
      expect(databaseModule!.isDatabaseInitialized()).toBe(true);

      databaseModule!.resetDatabaseInstance();

      expect(databaseModule!.isDatabaseInitialized()).toBe(false);
    });
  });

  describe('databaseExists', () => {
    it('should return false for non-existent database', () => {
      expect(databaseModule!.databaseExists(dbPath)).toBe(false);
    });

    it('should return true for existing database', async () => {
      await databaseModule!.initializeDatabase({ databasePath: dbPath });
      databaseModule!.closeDatabase();
      expect(databaseModule!.databaseExists(dbPath)).toBe(true);
    });
  });

  describe('resetDatabase', () => {
    it('should backup and remove corrupt database', async () => {
      await databaseModule!.initializeDatabase({ databasePath: dbPath });
      databaseModule!.closeDatabase();

      expect(fs.existsSync(dbPath)).toBe(true);

      databaseModule!.resetDatabase(dbPath);

      expect(fs.existsSync(dbPath)).toBe(false);

      const files = fs.readdirSync(testDir);
      const backupFile = files.find((f) => f.includes('.corrupt.'));
      expect(backupFile).toBeDefined();
    });

    it('should remove WAL and SHM files', async () => {
      await databaseModule!.initializeDatabase({ databasePath: dbPath });

      const walPath = `${dbPath}-wal`;
      const shmPath = `${dbPath}-shm`;

      databaseModule!.closeDatabase();

      fs.writeFileSync(walPath, 'dummy wal');
      fs.writeFileSync(shmPath, 'dummy shm');

      databaseModule!.resetDatabase(dbPath);

      expect(fs.existsSync(walPath)).toBe(false);
      expect(fs.existsSync(shmPath)).toBe(false);
    });

    it('should handle non-existent database gracefully', () => {
      expect(() => databaseModule!.resetDatabase(dbPath)).not.toThrow();
    });
  });

  describe('migration schema', () => {
    it('should create schema_meta table', async () => {
      const db = await databaseModule!.initializeDatabase({ databasePath: dbPath });

      const tables = db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_meta'",
      );
      expect(tables.length).toBeGreaterThan(0);
      expect(tables[0].values[0][0]).toBe('schema_meta');
    });

    it('should set version in schema_meta', async () => {
      const db = await databaseModule!.initializeDatabase({ databasePath: dbPath });

      const rows = db.exec("SELECT value FROM schema_meta WHERE key = 'version'");
      const value = rows[0].values[0][0] as string;
      expect(value).toBeDefined();
      expect(parseInt(value, 10)).toBeGreaterThan(0);
    });

    it('should create expected tables from migrations', async () => {
      const db = await databaseModule!.initializeDatabase({ databasePath: dbPath });

      const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
      const tableNames = tablesResult[0].values.map((v) => v[0] as string);

      expect(tableNames).toContain('app_settings');
      expect(tableNames).toContain('provider_meta');
      expect(tableNames).toContain('providers');
      expect(tableNames).toContain('tasks');
    });
  });

  describe('flushDatabase', () => {
    it('should not throw when database is not initialized', () => {
      expect(() => databaseModule!.flushDatabase()).not.toThrow();
    });

    it('should not throw when database is initialized', async () => {
      await databaseModule!.initializeDatabase({ databasePath: dbPath });
      expect(() => databaseModule!.flushDatabase()).not.toThrow();
    });

    it('should persist data to disk', async () => {
      const db = await databaseModule!.initializeDatabase({ databasePath: dbPath });
      db.run('INSERT INTO schema_meta (key, value) VALUES (?, ?)', ['test_key', 'test_value']);
      databaseModule!.flushDatabase();
      databaseModule!.closeDatabase();
      databaseModule!.resetDatabaseInstance();

      const db2 = await databaseModule!.initializeDatabase({ databasePath: dbPath });
      const rows = db2.exec("SELECT value FROM schema_meta WHERE key = 'test_key'");
      expect(rows[0].values[0][0]).toBe('test_value');
    });
  });

  describe('withTransaction', () => {
    it('should commit successful transactions', async () => {
      const db = await databaseModule!.initializeDatabase({ databasePath: dbPath });
      databaseModule!.withTransaction(db, () => {
        db.run('INSERT INTO schema_meta (key, value) VALUES (?, ?)', ['tx_key', 'tx_val']);
      });
      const rows = db.exec("SELECT value FROM schema_meta WHERE key = 'tx_key'");
      expect(rows[0].values[0][0]).toBe('tx_val');
    });

    it('should rollback on error', async () => {
      const db = await databaseModule!.initializeDatabase({ databasePath: dbPath });
      expect(() =>
        databaseModule!.withTransaction(db, () => {
          db.run('INSERT INTO schema_meta (key, value) VALUES (?, ?)', [
            'rollback_key',
            'rollback_val',
          ]);
          throw new Error('rollback');
        }),
      ).toThrow('rollback');
      const rows = db.exec("SELECT value FROM schema_meta WHERE key = 'rollback_key'");
      expect(rows.length).toBe(0);
    });
  });
});
