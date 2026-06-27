/**
 * Seed Manager Unit Tests
 * Tests for User Story 5: Seeding Mechanism
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SeedManager } from '../../../../src/storage/seeds/manager.js';
import type { Seed } from '../../../../src/storage/seeds/types.js';

describe('SeedManager', () => {
  let db: Database.Database;
  let manager: SeedManager;
  let tempDir: string;

  beforeEach(async () => {
    // Create in-memory database
    db = new Database(':memory:');

    // Create temporary directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'seed-test-'));

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

  describe('T045: Seed manager initialization', () => {
    it('should initialize seed manager', async () => {
      // Act: Initialize seed manager
      await manager.initializeSchema();

      // Assert: Schema table exists
      const tableExists = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_seeds'")
        .get();
      expect(tableExists).toBeDefined();
    });
  });

  describe('T046: Empty seed list', () => {
    it('should return empty array when no seeds are applied', async () => {
      // Arrange: Initialize schema
      await manager.initializeSchema();

      // Act: Get applied seeds
      const applied = await manager.getAppliedSeeds();

      // Assert: No applied seeds
      expect(applied).toHaveLength(0);
    });
  });

  describe('T047: Seed execution order', () => {
    it('should execute seeds in order', async () => {
      // Arrange: Create seed JSONs
      const seed1Json = {
        name: 'first_seed',
        order: 1,
        seedSql: "INSERT INTO test (name) VALUES ('first')",
        rollbackSql: "DELETE FROM test WHERE name = 'first'",
      };

      const seed2Json = {
        name: 'second_seed',
        order: 2,
        seedSql: "INSERT INTO test (name) VALUES ('second')",
        rollbackSql: "DELETE FROM test WHERE name = 'second'",
      };

      // Initialize schema
      await manager.initializeSchema();

      // Create test table
      db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');

      // Load seeds from JSON
      const seed1 = manager.loadSeedFromJson(JSON.stringify(seed1Json));
      const seed2 = manager.loadSeedFromJson(JSON.stringify(seed2Json));

      expect(seed1).not.toBeNull();
      expect(seed2).not.toBeNull();

      // Act: Execute seeds in order
      await manager.executeSeed(seed1!);
      await manager.executeSeed(seed2!);

      // Assert: Seeds executed in order
      const records = db.prepare('SELECT * FROM test ORDER BY id').all();
      expect(records).toHaveLength(2);
      expect((records[0] as any).name).toBe('first');
      expect((records[1] as any).name).toBe('second');
    });
  });

  describe('T048a: Seed execution order (after migrations)', () => {
    it('should execute seeds after migrations', async () => {
      // Arrange: Create seed JSON
      const seedJson = {
        name: 'test_seed',
        order: 1,
        seedSql: "INSERT INTO users (name, email) VALUES ('John', 'john@example.com')",
        rollbackSql: "DELETE FROM users WHERE name = 'John'",
      };

      // Initialize schema
      await manager.initializeSchema();

      // Create users table (simulating migration)
      db.exec(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL
        )
      `);

      // Load seed from JSON
      const seed = manager.loadSeedFromJson(JSON.stringify(seedJson));
      expect(seed).not.toBeNull();

      // Act: Execute seed
      const result = await manager.executeSeed(seed!);

      // Assert: Seed executed successfully
      expect(result.success).toBe(true);

      // Verify data was inserted
      const records = db.prepare('SELECT * FROM users').all();
      expect(records).toHaveLength(1);
      expect((records[0] as any).name).toBe('John');
      expect((records[0] as any).email).toBe('john@example.com');
    });
  });

  describe('Seed validation', () => {
    it('should validate correct seed structure', () => {
      // Arrange: Valid seed
      const validSeed = {
        name: 'test',
        order: 1,
        seedSql: 'INSERT INTO test VALUES (1)',
        rollbackSql: 'DELETE FROM test WHERE id = 1',
      };

      // Act: Load seed from JSON
      const seed = manager.loadSeedFromJson(JSON.stringify(validSeed));

      // Assert: Valid
      expect(seed).not.toBeNull();
    });

    it('should reject invalid seed structure', () => {
      // Arrange: Invalid seed (missing name)
      const invalidSeed = {
        order: 1,
        seedSql: 'INSERT INTO test VALUES (1)',
        rollbackSql: 'DELETE FROM test WHERE id = 1',
      };

      // Act: Load seed from JSON
      const seed = manager.loadSeedFromJson(JSON.stringify(invalidSeed));

      // Assert: Invalid
      expect(seed).toBeNull();
    });
  });
});
