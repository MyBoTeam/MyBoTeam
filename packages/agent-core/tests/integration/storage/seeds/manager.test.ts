/**
 * Seed Manager Integration Tests
 * Tests for User Story 5: Seeding Mechanism
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SeedManager } from '../../../../src/storage/seeds/manager.js';

describe('SeedManager Integration', () => {
  let db: Database.Database;
  let manager: SeedManager;
  let tempDir: string;

  beforeEach(async () => {
    // Create in-memory database
    db = new Database(':memory:');

    // Create temporary directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'seed-integration-'));

    // Create manager with test configuration
    manager = new SeedManager({
      seedsPath: path.join(tempDir, 'seeds'),
      db,
    });
  });

  afterEach(async () => {
    // Close database
    db.close();

    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('T048: Full seed flow', () => {
    it('should apply multiple seeds in correct order', async () => {
      // Arrange: Create table for seeding
      db.exec(
        'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL)',
      );

      // Create seeds
      const seed1Json = {
        name: 'seed_users',
        order: 1,
        seedSql: "INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com')",
        rollbackSql: "DELETE FROM users WHERE name = 'Alice'",
      };

      const seed2Json = {
        name: 'seed_admins',
        order: 2,
        seedSql: "INSERT INTO users (name, email) VALUES ('Admin', 'admin@example.com')",
        rollbackSql: "DELETE FROM users WHERE name = 'Admin'",
      };

      // Initialize schema
      await manager.initializeSchema();

      // Load seeds from JSON
      const seed1 = manager.loadSeedFromJson(JSON.stringify(seed1Json));
      const seed2 = manager.loadSeedFromJson(JSON.stringify(seed2Json));

      expect(seed1).not.toBeNull();
      expect(seed2).not.toBeNull();

      // Act: Execute seeds
      const result1 = await manager.executeSeed(seed1!);
      const result2 = await manager.executeSeed(seed2!);

      // Assert: Both seeds executed successfully
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Verify data was inserted
      const users = db.prepare('SELECT * FROM users ORDER BY name').all();
      expect(users).toHaveLength(2);
      expect((users[0] as any).name).toBe('Admin');
      expect((users[1] as any).name).toBe('Alice');

      // Verify seed records
      const records = db.prepare('SELECT * FROM schema_seeds ORDER BY name').all();
      expect(records).toHaveLength(2);
      expect((records[0] as any).name).toBe('seed_admins');
      expect((records[1] as any).name).toBe('seed_users');
    });

    it('should be idempotent - running same seed twice should not duplicate data', async () => {
      // Arrange: Create table for seeding
      db.exec(
        'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL)',
      );

      // Create seed
      const seedJson = {
        name: 'seed_users',
        order: 1,
        seedSql: "INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com')",
        rollbackSql: "DELETE FROM users WHERE name = 'Alice'",
      };

      // Initialize schema
      await manager.initializeSchema();

      // Load seed from JSON
      const seed = manager.loadSeedFromJson(JSON.stringify(seedJson));
      expect(seed).not.toBeNull();

      // Act: Execute seed twice
      const result1 = await manager.executeSeed(seed!);
      const result2 = await manager.executeSeed(seed!);

      // Assert: First succeeds, second fails (unique constraint violation)
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);

      // Verify only one record exists
      const users = db.prepare('SELECT * FROM users').all();
      expect(users).toHaveLength(1);

      // Verify only one seed record exists
      const records = db.prepare('SELECT * FROM schema_seeds').all();
      expect(records).toHaveLength(1);
    });

    it('should handle rollback correctly', async () => {
      // Arrange: Create table for seeding
      db.exec(
        'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL)',
      );

      // Create seed
      const seedJson = {
        name: 'seed_users',
        order: 1,
        seedSql: "INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com')",
        rollbackSql: "DELETE FROM users WHERE name = 'Alice'",
      };

      // Initialize schema
      await manager.initializeSchema();

      // Load seed from JSON
      const seed = manager.loadSeedFromJson(JSON.stringify(seedJson));
      expect(seed).not.toBeNull();

      // Act: Execute seed then rollback
      await manager.executeSeed(seed!);
      const rollbackResult = await manager.rollbackSeed(seed!);

      // Assert: Rollback successful
      expect(rollbackResult.success).toBe(true);

      // Verify data was removed
      const users = db.prepare('SELECT * FROM users').all();
      expect(users).toHaveLength(0);

      // Verify seed record was removed
      const records = db.prepare('SELECT * FROM schema_seeds').all();
      expect(records).toHaveLength(0);
    });

    it('should log seed events', async () => {
      // Arrange: Create table for seeding
      db.exec(
        'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL)',
      );

      // Create seed
      const seedJson = {
        name: 'seed_users',
        order: 1,
        seedSql: "INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com')",
        rollbackSql: "DELETE FROM users WHERE name = 'Alice'",
      };

      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      const managerWithLogger = new SeedManager({
        seedsPath: path.join(tempDir, 'seeds'),
        db,
        logger,
      });

      // Initialize schema
      await managerWithLogger.initializeSchema();

      // Load seed from JSON
      const seed = managerWithLogger.loadSeedFromJson(JSON.stringify(seedJson));
      expect(seed).not.toBeNull();

      // Act: Execute seed
      await managerWithLogger.executeSeed(seed!);

      // Assert: Logger was called
      expect(logger.info).toHaveBeenCalled();
    });
  });
});
