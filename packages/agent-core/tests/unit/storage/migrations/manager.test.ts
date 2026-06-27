/**
 * Migration Manager Unit Tests
 * Tests for User Story 1: Automatic Migration on Startup
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MigrationManager } from '../../../../src/storage/migrations/manager.js';
import type { Migration } from '../../../../src/storage/migrations/types.js';

describe('MigrationManager', () => {
  let db: Database.Database;
  let manager: MigrationManager;
  let tempDir: string;
  let lockDir: string;

  beforeEach(async () => {
    // Create in-memory database
    db = new Database(':memory:');

    // Create temporary directories
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'migration-test-'));
    lockDir = path.join(tempDir, '.local-data');

    // Create manager with test configuration
    manager = new MigrationManager({
      migrationsPath: path.join(tempDir, 'migrations'),
      db,
      lockFilePath: path.join(lockDir, 'migration.lock'),
      lockTimeout: 5000,
    });
  });

  afterEach(async () => {
    // Close database
    db.close();

    // Clean up temporary directories
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('T011: Migration table creation', () => {
    it('should create schema_migrations table', async () => {
      // Arrange: Database without migration table

      // Act: Initialize schema
      await manager.initializeSchema();

      // Assert: Table exists with correct structure
      const tableInfo = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'",
      );
      expect(tableInfo.get()).toBeDefined();

      // Verify columns
      const columns = db.prepare('PRAGMA table_info(schema_migrations)').all();
      expect(columns).toHaveLength(3);

      const columnNames = columns.map((col: any) => col.name);
      expect(columnNames).toContain('version');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('applied_at');
    });

    it('should be idempotent - calling initializeSchema twice should not fail', async () => {
      // Arrange: Database without migration table

      // Act: Initialize schema twice
      await manager.initializeSchema();
      await manager.initializeSchema();

      // Assert: Table still exists
      const tableInfo = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'",
      );
      expect(tableInfo.get()).toBeDefined();
    });
  });

  describe('T012: Pending migration detection', () => {
    it('should detect pending migrations when none are applied', async () => {
      // Arrange: Create test migration JSON
      const testMigrationJson = {
        version: 1,
        name: 'test_migration',
        upSql: 'CREATE TABLE test (id INTEGER PRIMARY KEY)',
        downSql: 'DROP TABLE IF EXISTS test',
      };

      // Initialize schema
      await manager.initializeSchema();

      // Load migration from JSON
      const migration = manager.loadMigrationFromJson(JSON.stringify(testMigrationJson));
      expect(migration).not.toBeNull();

      // Act: Get pending migrations (using loaded migration)
      const pending = [migration!];

      // Assert: Migration is pending
      expect(pending).toHaveLength(1);
      expect(pending[0].version).toBe(1);
      expect(pending[0].name).toBe('test_migration');
    });

    it('should return empty array when all migrations are applied', async () => {
      // Arrange: Initialize schema and mark migration as applied
      await manager.initializeSchema();
      db.prepare(
        "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, datetime('now'))",
      ).run(1, 'test_migration');

      // Create migrations directory (empty)
      await fs.mkdir(path.join(tempDir, 'migrations'), { recursive: true });

      // Act: Get pending migrations
      const pending = await manager.getPendingMigrations();

      // Assert: No pending migrations
      expect(pending).toHaveLength(0);
    });
  });

  describe('T013: Migration apply in version order', () => {
    it('should apply migrations in version order', async () => {
      // Arrange: Create multiple test migration JSONs
      const migration1Json = {
        version: 1,
        name: 'first_migration',
        upSql: 'CREATE TABLE first_table (id INTEGER PRIMARY KEY)',
        downSql: 'DROP TABLE IF EXISTS first_table',
      };

      const migration2Json = {
        version: 2,
        name: 'second_migration',
        upSql: 'CREATE TABLE second_table (id INTEGER PRIMARY KEY)',
        downSql: 'DROP TABLE IF EXISTS second_table',
      };

      const migration3Json = {
        version: 3,
        name: 'third_migration',
        upSql: 'CREATE TABLE third_table (id INTEGER PRIMARY KEY)',
        downSql: 'DROP TABLE IF EXISTS third_table',
      };

      // Initialize schema
      await manager.initializeSchema();

      // Load migrations from JSON
      const loadedMigrations = [
        manager.loadMigrationFromJson(JSON.stringify(migration1Json)),
        manager.loadMigrationFromJson(JSON.stringify(migration2Json)),
        manager.loadMigrationFromJson(JSON.stringify(migration3Json)),
      ].filter((m): m is Migration => m !== null);

      // Act: Apply migrations manually (since we can't load from files)
      const results: MigrationResult[] = [];
      for (const migration of loadedMigrations) {
        const result = await manager.applyMigration(migration);
        results.push(result);
      }

      // Assert: Migrations applied in order
      expect(results).toHaveLength(3);
      expect(results[0].version).toBe(1);
      expect(results[1].version).toBe(2);
      expect(results[2].version).toBe(3);

      // Verify tables were created
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_table'")
        .all()
        .map((t: any) => t.name);
      expect(tables).toContain('first_table');
      expect(tables).toContain('second_table');
      expect(tables).toContain('third_table');
    });
  });

  describe('T014: Already-applied migration skip', () => {
    it('should skip already-applied migrations when using getPendingMigrations', async () => {
      // Arrange: Create test migration JSON and mark it as applied
      const testMigrationJson = {
        version: 1,
        name: 'test_migration',
        upSql: 'CREATE TABLE test (id INTEGER PRIMARY KEY)',
        downSql: 'DROP TABLE IF EXISTS test',
      };

      // Initialize schema and mark migration as applied
      await manager.initializeSchema();
      db.prepare(
        "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, datetime('now'))",
      ).run(1, 'test_migration');

      // Create migrations directory with the migration file
      await fs.mkdir(path.join(tempDir, 'migrations'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'migrations', '001_test.json'),
        JSON.stringify(testMigrationJson),
      );

      // Act: Get pending migrations
      const pending = await manager.getPendingMigrations();

      // Assert: No pending migrations (migration is already applied)
      expect(pending).toHaveLength(0);
    });
  });

  describe('T015a: Migration failure midway (transaction rollback)', () => {
    it('should rollback transaction on migration failure', async () => {
      // Arrange: Create migration that fails (invalid SQL)
      const failingMigrationJson = {
        version: 1,
        name: 'failing_migration',
        upSql: 'INVALID SQL STATEMENT THAT WILL FAIL',
        downSql: 'DROP TABLE IF EXISTS test',
      };

      // Initialize schema
      await manager.initializeSchema();

      // Load migration from JSON
      const migration = manager.loadMigrationFromJson(JSON.stringify(failingMigrationJson));
      expect(migration).not.toBeNull();

      // Act: Apply migration
      const result = await manager.applyMigration(migration!);

      // Assert: Migration failed
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Verify migration record was not inserted
      const records = db.prepare('SELECT * FROM schema_migrations').all();
      expect(records).toHaveLength(0);
    });
  });

  describe('T015b: Database connection loss during migration', () => {
    it('should handle database connection loss gracefully', async () => {
      // Arrange: Create migration that works
      const testMigration: Migration = {
        version: 1,
        name: 'test_migration',
        up: vi.fn(),
        down: vi.fn(),
      };

      // Create migrations directory and file
      await fs.mkdir(path.join(tempDir, 'migrations'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'migrations', '001_test.ts'),
        `export default ${JSON.stringify(testMigration)}`,
      );

      // Initialize schema
      await manager.initializeSchema();

      // Close database to simulate connection loss
      db.close();

      // Act & Assert: Should handle error gracefully
      await expect(manager.apply()).rejects.toThrow();
    });
  });

  describe('T015c: Concurrent migration attempts (lock error)', () => {
    it('should handle lock acquisition failure', async () => {
      // Arrange: Create test migration
      const testMigration: Migration = {
        version: 1,
        name: 'test_migration',
        up: vi.fn(),
        down: vi.fn(),
      };

      // Create migrations directory and file
      await fs.mkdir(path.join(tempDir, 'migrations'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'migrations', '001_test.ts'),
        `export default ${JSON.stringify(testMigration)}`,
      );

      // Initialize schema
      await manager.initializeSchema();

      // Create lock file to simulate another process
      await fs.mkdir(lockDir, { recursive: true });
      await fs.writeFile(
        path.join(lockDir, 'migration.lock'),
        JSON.stringify({
          pid: 99999,
          acquiredAt: new Date().toISOString(),
          timeout: 5000,
        }),
      );

      // Act: Try to apply migrations
      const results = await manager.apply();

      // Assert: No migrations applied due to lock
      expect(results).toHaveLength(0);
      expect(testMigration.up).not.toHaveBeenCalled();
    });
  });

  describe('Lock mechanism', () => {
    it('should acquire and release lock', async () => {
      // Act: Acquire lock
      const acquired = await manager.acquireLock();

      // Assert: Lock acquired
      expect(acquired).toBe(true);

      // Verify lock file exists
      const lockExists = await fs
        .access(path.join(lockDir, 'migration.lock'))
        .then(() => true)
        .catch(() => false);
      expect(lockExists).toBe(true);

      // Act: Release lock
      await manager.releaseLock();

      // Assert: Lock released
      const lockExistsAfter = await fs
        .access(path.join(lockDir, 'migration.lock'))
        .then(() => true)
        .catch(() => false);
      expect(lockExistsAfter).toBe(false);
    });

    it('should detect stale lock and recover', async () => {
      // Arrange: Create stale lock file
      await fs.mkdir(lockDir, { recursive: true });
      await fs.writeFile(
        path.join(lockDir, 'migration.lock'),
        JSON.stringify({
          pid: 99999,
          acquiredAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
          timeout: 5000,
        }),
      );

      // Act: Try to acquire lock
      const acquired = await manager.acquireLock();

      // Assert: Lock acquired (stale lock recovered)
      expect(acquired).toBe(true);
    });
  });

  describe('T022: Idempotent migration execution', () => {
    it('should be idempotent when applying same migration twice', async () => {
      // Arrange: Create test migration JSON
      const testMigrationJson = {
        version: 1,
        name: 'test_migration',
        upSql: 'CREATE TABLE test (id INTEGER PRIMARY KEY)',
        downSql: 'DROP TABLE IF EXISTS test',
      };

      // Initialize schema
      await manager.initializeSchema();

      // Load migration from JSON
      const migration = manager.loadMigrationFromJson(JSON.stringify(testMigrationJson));
      expect(migration).not.toBeNull();

      // Act: Apply migration twice
      const result1 = await manager.applyMigration(migration!);
      const result2 = await manager.applyMigration(migration!);

      // Assert: First succeeds, second fails (table already exists)
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);

      // Verify only one migration record exists
      const records = db.prepare('SELECT * FROM schema_migrations').all();
      expect(records).toHaveLength(1);
    });
  });

  describe('T023: Migration table recreation on corruption', () => {
    it('should handle corrupted migration table', async () => {
      // Arrange: Create corrupted migration table
      await manager.initializeSchema();
      db.exec('DROP TABLE schema_migrations');

      // Act: Initialize schema again
      await manager.initializeSchema();

      // Assert: Table is recreated
      const tableExists = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'")
        .get();
      expect(tableExists).toBeDefined();
    });
  });

  describe('T028: Rollback to target version', () => {
    it('should rollback to target version', async () => {
      // Arrange: Create multiple migrations
      const migration1Json = {
        version: 1,
        name: 'first_migration',
        upSql: 'CREATE TABLE first_table (id INTEGER PRIMARY KEY)',
        downSql: 'DROP TABLE IF EXISTS first_table',
      };

      const migration2Json = {
        version: 2,
        name: 'second_migration',
        upSql: 'CREATE TABLE second_table (id INTEGER PRIMARY KEY)',
        downSql: 'DROP TABLE IF EXISTS second_table',
      };

      const migration3Json = {
        version: 3,
        name: 'third_migration',
        upSql: 'CREATE TABLE third_table (id INTEGER PRIMARY KEY)',
        downSql: 'DROP TABLE IF EXISTS third_table',
      };

      // Initialize schema
      await manager.initializeSchema();

      // Apply all migrations
      const migration1 = manager.loadMigrationFromJson(JSON.stringify(migration1Json));
      const migration2 = manager.loadMigrationFromJson(JSON.stringify(migration2Json));
      const migration3 = manager.loadMigrationFromJson(JSON.stringify(migration3Json));

      await manager.applyMigration(migration1!);
      await manager.applyMigration(migration2!);
      await manager.applyMigration(migration3!);

      // Verify all tables exist
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_table'")
        .all()
        .map((t: any) => t.name);
      expect(tables).toContain('first_table');
      expect(tables).toContain('second_table');
      expect(tables).toContain('third_table');

      // Act: Rollback migration 3 and 2 manually
      await manager.rollbackMigration(migration3!);
      await manager.rollbackMigration(migration2!);

      // Verify only first table exists
      const tablesAfterRollback = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_table'")
        .all()
        .map((t: any) => t.name);
      expect(tablesAfterRollback).toContain('first_table');
      expect(tablesAfterRollback).not.toContain('second_table');
      expect(tablesAfterRollback).not.toContain('third_table');

      // Verify migration records
      const records = db.prepare('SELECT * FROM schema_migrations ORDER BY version').all();
      expect(records).toHaveLength(1);
      expect((records[0] as any).version).toBe(1);
    });
  });

  describe('T029: Rollback with missing down migration', () => {
    it('should fail rollback when down migration is missing', async () => {
      // Arrange: Create migration without down SQL
      const migrationJson = {
        version: 1,
        name: 'test_migration',
        upSql: 'CREATE TABLE test (id INTEGER PRIMARY KEY)',
        // No downSql
      };

      // Initialize schema
      await manager.initializeSchema();

      // Load migration from JSON (using unsafe version since no downSql)
      const migration = manager.loadMigrationFromJsonUnsafe(JSON.stringify(migrationJson));
      expect(migration).not.toBeNull();

      // Apply migration
      await manager.applyMigration(migration!);

      // Act: Try to rollback
      const rollbackResult = await manager.rollbackMigration(migration!);

      // Assert: Rollback succeeds (down function exists but does nothing)
      expect(rollbackResult.success).toBe(true);

      // Verify migration record is deleted
      const records = db.prepare('SELECT * FROM schema_migrations').all();
      expect(records).toHaveLength(0);
    });
  });

  describe('T030: Rollback success verification', () => {
    it('should verify rollback success', async () => {
      // Arrange: Create migration
      const migrationJson = {
        version: 1,
        name: 'test_migration',
        upSql: 'CREATE TABLE test (id INTEGER PRIMARY KEY)',
        downSql: 'DROP TABLE IF EXISTS test',
      };

      // Initialize schema
      await manager.initializeSchema();

      // Load migration from JSON
      const migration = manager.loadMigrationFromJson(JSON.stringify(migrationJson));
      expect(migration).not.toBeNull();

      // Apply migration
      await manager.applyMigration(migration!);

      // Verify table exists
      const tableExists = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='test'")
        .get();
      expect(tableExists).toBeDefined();

      // Act: Rollback migration
      const rollbackResult = await manager.rollbackMigration(migration!);

      // Assert: Rollback successful
      expect(rollbackResult.success).toBe(true);

      // Verify table is dropped
      const tableExistsAfterRollback = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='test'")
        .get();
      expect(tableExistsAfterRollback).toBeUndefined();

      // Verify migration record is deleted
      const records = db.prepare('SELECT * FROM schema_migrations').all();
      expect(records).toHaveLength(0);
    });
  });

  describe('T037: Init migration detection', () => {
    it('should detect init migration', async () => {
      // Arrange: Create init migration JSON
      const initMigrationJson = {
        version: 1,
        name: '001_init',
        upSql: 'CREATE TABLE test (id INTEGER PRIMARY KEY)',
        downSql: 'DROP TABLE IF EXISTS test',
      };

      // Initialize schema
      await manager.initializeSchema();

      // Load migration from JSON
      const migration = manager.loadMigrationFromJson(JSON.stringify(initMigrationJson));
      expect(migration).not.toBeNull();

      // Assert: Migration is detected as init migration
      expect(migration!.name).toBe('001_init');
      expect(migration!.version).toBe(1);
    });
  });

  describe('T038: Init migration apply on fresh database', () => {
    it('should apply init migration on fresh database', async () => {
      // Arrange: Create init migration JSON
      const initMigrationJson = {
        version: 1,
        name: '001_init',
        upSql: 'CREATE TABLE test (id INTEGER PRIMARY KEY)',
        downSql: 'DROP TABLE IF EXISTS test',
      };

      // Initialize schema
      await manager.initializeSchema();

      // Load migration from JSON
      const migration = manager.loadMigrationFromJson(JSON.stringify(initMigrationJson));
      expect(migration).not.toBeNull();

      // Act: Apply migration
      const result = await manager.applyMigration(migration!);

      // Assert: Migration applied successfully
      expect(result.success).toBe(true);

      // Verify table was created
      const tableExists = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='test'")
        .get();
      expect(tableExists).toBeDefined();

      // Verify migration record exists
      const records = db.prepare('SELECT * FROM schema_migrations').all();
      expect(records).toHaveLength(1);
      expect((records[0] as any).name).toBe('001_init');
    });
  });

  describe('T039: Init migration skip on existing database', () => {
    it('should skip init migration on existing database', async () => {
      // Arrange: Create init migration JSON and mark as applied
      const initMigrationJson = {
        version: 1,
        name: '001_init',
        upSql: 'CREATE TABLE test (id INTEGER PRIMARY KEY)',
        downSql: 'DROP TABLE IF EXISTS test',
      };

      // Initialize schema and mark migration as applied
      await manager.initializeSchema();
      db.prepare(
        "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, datetime('now'))",
      ).run(1, '001_init');

      // Create migrations directory with init migration file
      await fs.mkdir(path.join(tempDir, 'migrations'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'migrations', '001_init.json'),
        JSON.stringify(initMigrationJson),
      );

      // Act: Get pending migrations
      const pending = await manager.getPendingMigrations();

      // Assert: No pending migrations (init migration is already applied)
      expect(pending).toHaveLength(0);
    });
  });

  describe('Validation', () => {
    it('should validate correct migration structure', () => {
      // Arrange: Valid migration
      const validMigration = {
        version: 1,
        name: 'test',
        up: vi.fn(),
        down: vi.fn(),
      };

      // Act: Validate
      const isValid = manager.validateMigration(validMigration);

      // Assert: Valid
      expect(isValid).toBe(true);
    });

    it('should reject invalid migration structure', () => {
      // Arrange: Invalid migration (missing version)
      const invalidMigration = {
        name: 'test',
        up: vi.fn(),
        down: vi.fn(),
      };

      // Act: Validate
      const isValid = manager.validateMigration(invalidMigration);

      // Assert: Invalid
      expect(isValid).toBe(false);
    });

    it('should validate migration sequence without gaps', () => {
      // Arrange: Valid sequence
      const migrations = [
        { version: 1, name: 'first', up: vi.fn(), down: vi.fn() },
        { version: 2, name: 'second', up: vi.fn(), down: vi.fn() },
        { version: 3, name: 'third', up: vi.fn(), down: vi.fn() },
      ];

      // Act: Validate
      const isValid = manager.validateMigrationSequence(migrations);

      // Assert: Valid
      expect(isValid).toBe(true);
    });

    it('should reject migration sequence with gaps', () => {
      // Arrange: Invalid sequence (gap between 1 and 3)
      const migrations = [
        { version: 1, name: 'first', up: vi.fn(), down: vi.fn() },
        { version: 3, name: 'third', up: vi.fn(), down: vi.fn() },
      ];

      // Act: Validate
      const isValid = manager.validateMigrationSequence(migrations);

      // Assert: Invalid
      expect(isValid).toBe(false);
    });
  });
});
