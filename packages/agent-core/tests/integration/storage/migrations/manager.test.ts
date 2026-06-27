/**
 * Migration Manager Integration Tests
 * Tests for User Story 1: Automatic Migration on Startup
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MigrationManager } from '../../../../src/storage/migrations/manager.js';
import type { Migration } from '../../../../src/storage/migrations/types.js';

describe('MigrationManager Integration', () => {
  let db: Database.Database;
  let manager: MigrationManager;
  let tempDir: string;

  beforeEach(async () => {
    // Create in-memory database
    db = new Database(':memory:');

    // Create temporary directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'migration-integration-'));

    // Create manager with test configuration
    manager = new MigrationManager({
      migrationsPath: path.join(tempDir, 'migrations'),
      db,
      lockFilePath: path.join(tempDir, '.local-data', 'migration.lock'),
      lockTimeout: 5000,
    });
  });

  afterEach(async () => {
    // Close database
    db.close();

    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('T031: Full rollback flow', () => {
    it('should rollback multiple migrations in correct order', async () => {
      // Arrange: Create multiple migrations
      const migration1Json = {
        version: 1,
        name: 'create_users_table',
        upSql: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)',
        downSql: 'DROP TABLE IF EXISTS users',
      };

      const migration2Json = {
        version: 2,
        name: 'add_email_column',
        upSql: 'ALTER TABLE users ADD COLUMN email TEXT',
        downSql: "-- Rollback: SQLite doesn't support DROP COLUMN, so we do nothing",
      };

      const migration3Json = {
        version: 3,
        name: 'create_posts_table',
        upSql: 'CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER)',
        downSql: 'DROP TABLE IF EXISTS posts',
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
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .all()
        .map((t: any) => t.name);
      expect(tables).toContain('users');
      expect(tables).toContain('posts');

      // Act: Rollback migration 3 and 2 manually
      await manager.rollbackMigration(migration3!);
      await manager.rollbackMigration(migration2!);

      // Verify only users table exists (posts should be dropped)
      const tablesAfterRollback = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .all()
        .map((t: any) => t.name);
      expect(tablesAfterRollback).toContain('users');
      expect(tablesAfterRollback).not.toContain('posts');

      // Verify migration records
      const records = db.prepare('SELECT * FROM schema_migrations ORDER BY version').all();
      expect(records).toHaveLength(1);
      expect((records[0] as any).version).toBe(1);
    });
  });

  describe('T040: Init migration flow', () => {
    it('should apply init migration on fresh database', async () => {
      // Arrange: Create init migration JSON
      const initMigrationJson = {
        version: 1,
        name: '001_init',
        upSql: `
          CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL
          )
        `,
        downSql: 'DROP TABLE IF EXISTS users',
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
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        .get();
      expect(tableExists).toBeDefined();

      // Verify migration record exists
      const records = db.prepare('SELECT * FROM schema_migrations').all();
      expect(records).toHaveLength(1);
      expect((records[0] as any).name).toBe('001_init');
    });

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

  describe('T031a: Rollback failure when down migration missing', () => {
    it('should handle rollback failure gracefully', async () => {
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

  describe('T024: Idempotent apply flow', () => {
    it('should handle multiple apply calls gracefully', async () => {
      // Arrange: Create a migration JSON
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

      // Act: Apply migration multiple times
      const result1 = await manager.applyMigration(migration!);
      const result2 = await manager.applyMigration(migration!);
      const result3 = await manager.applyMigration(migration!);

      // Assert: First succeeds, others fail (table already exists)
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
      expect(result3.success).toBe(false);

      // Verify only one migration record exists
      const records = db.prepare('SELECT * FROM schema_migrations').all();
      expect(records).toHaveLength(1);
    });
  });

  describe('T015: Full migration apply flow', () => {
    it('should apply multiple migrations in correct order', async () => {
      // Arrange: Create multiple migration JSONs
      const migration1Json = {
        version: 1,
        name: 'create_users_table',
        upSql: `
          CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
          )
        `,
        downSql: 'DROP TABLE IF EXISTS users',
      };

      const migration2Json = {
        version: 2,
        name: 'add_age_column',
        upSql: 'ALTER TABLE users ADD COLUMN age INTEGER',
        downSql: 'ALTER TABLE users DROP COLUMN age',
      };

      const migration3Json = {
        version: 3,
        name: 'create_posts_table',
        upSql: `
          CREATE TABLE posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `,
        downSql: 'DROP TABLE IF EXISTS posts',
      };

      // Initialize schema
      await manager.initializeSchema();

      // Load migrations from JSON
      const migration1 = manager.loadMigrationFromJson(JSON.stringify(migration1Json));
      const migration2 = manager.loadMigrationFromJson(JSON.stringify(migration2Json));
      const migration3 = manager.loadMigrationFromJson(JSON.stringify(migration3Json));

      expect(migration1).not.toBeNull();
      expect(migration2).not.toBeNull();
      expect(migration3).not.toBeNull();

      // Act: Apply migrations manually
      const results = [];
      results.push(await manager.applyMigration(migration1!));
      results.push(await manager.applyMigration(migration2!));
      results.push(await manager.applyMigration(migration3!));

      // Assert: All migrations applied successfully
      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);

      // Verify database schema
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .all()
        .map((t: any) => t.name);

      expect(tables).toContain('users');
      expect(tables).toContain('posts');
      expect(tables).toContain('schema_migrations');

      // Verify migration records
      const records = db.prepare('SELECT * FROM schema_migrations ORDER BY version').all();
      expect(records).toHaveLength(3);

      const versions = records.map((r: any) => r.version);
      expect(versions).toEqual([1, 2, 3]);
    });

    it('should be idempotent - running apply twice should not duplicate migrations', async () => {
      // Arrange: Create a migration JSON
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

      // Act: Apply migration twice
      const result1 = await manager.applyMigration(migration!);
      const result2 = await manager.applyMigration(migration!);

      // Assert: First run succeeds, second run fails (table already exists)
      // Note: True idempotency is handled at the apply() level by checking schema_migrations
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false); // Fails because table already exists

      // Verify only one migration record exists
      const records = db.prepare('SELECT * FROM schema_migrations').all();
      expect(records).toHaveLength(1);
    });

    it('should handle rollback correctly', async () => {
      // Arrange: Create migrations with table creation
      const migration1Json = {
        version: 1,
        name: 'create_users_table',
        upSql: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)',
        downSql: 'DROP TABLE IF EXISTS users',
      };

      const migration2Json = {
        version: 2,
        name: 'add_email_column',
        upSql: 'ALTER TABLE users ADD COLUMN email TEXT',
        downSql: 'DROP TABLE IF EXISTS users',
      };

      // Initialize schema
      await manager.initializeSchema();

      // Load migrations from JSON
      const migration1 = manager.loadMigrationFromJson(JSON.stringify(migration1Json));
      const migration2 = manager.loadMigrationFromJson(JSON.stringify(migration2Json));

      expect(migration1).not.toBeNull();
      expect(migration2).not.toBeNull();

      // Apply migrations
      await manager.applyMigration(migration1!);
      await manager.applyMigration(migration2!);

      // Verify tables exist
      const tablesAfterApply = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        .all();
      expect(tablesAfterApply).toHaveLength(1);

      // Act: Rollback migration 2 manually
      const rollbackResult = await manager.rollbackMigration(migration2!);

      // Assert: Rollback successful
      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.version).toBe(2);

      // Verify migration records
      const records = db.prepare('SELECT * FROM schema_migrations ORDER BY version').all();
      expect(records).toHaveLength(1);
      expect((records[0] as any).version).toBe(1);
    });

    it('should handle lock mechanism correctly', async () => {
      // Arrange: Create a migration JSON
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

      // Act: Apply migration
      const result = await manager.applyMigration(migration!);

      // Assert: Migration applied successfully
      expect(result.success).toBe(true);

      // Verify lock file does not exist after completion
      const lockExists = await fs
        .access(path.join(tempDir, '.local-data', 'migration.lock'))
        .then(() => true)
        .catch(() => false);
      expect(lockExists).toBe(false);
    });

    it('should log migration events', async () => {
      // Arrange: Create a migration JSON and mock logger
      const migrationJson = {
        version: 1,
        name: 'test_migration',
        upSql: 'CREATE TABLE test (id INTEGER PRIMARY KEY)',
        downSql: 'DROP TABLE IF EXISTS test',
      };

      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      const managerWithLogger = new MigrationManager({
        migrationsPath: path.join(tempDir, 'migrations'),
        db,
        lockFilePath: path.join(tempDir, '.local-data', 'migration.lock'),
        lockTimeout: 5000,
        logger,
      });

      // Initialize schema
      await managerWithLogger.initializeSchema();

      // Load migration from JSON
      const migration = managerWithLogger.loadMigrationFromJson(JSON.stringify(migrationJson));
      expect(migration).not.toBeNull();

      // Act: Apply migration
      await managerWithLogger.applyMigration(migration!);

      // Assert: Logger was called
      expect(logger.info).toHaveBeenCalled();
    });
  });
});
