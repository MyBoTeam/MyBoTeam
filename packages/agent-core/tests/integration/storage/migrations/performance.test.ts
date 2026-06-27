/**
 * Migration Performance Tests
 * Tests for performance validation scenarios
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { MigrationManager } from "../../../../src/storage/migrations/manager.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

describe("Migration Performance Tests", () => {
  let db: Database.Database;
  let manager: MigrationManager;
  let tempDir: string;

  beforeEach(async () => {
    // Create in-memory database
    db = new Database(":memory:");

    // Create temporary directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "migration-performance-"));

    // Create manager with test configuration
    manager = new MigrationManager({
      migrationsPath: path.join(tempDir, "migrations"),
      db,
      lockFilePath: path.join(tempDir, ".local-data", "migration.lock"),
      lockTimeout: 5000,
    });
  });

  afterEach(async () => {
    // Close database
    db.close();

    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("T057a: Performance test for SC-001 (50 migrations under 5s)", () => {
    it("should apply 50 migrations under 5 seconds", async () => {
      // Arrange: Create 50 migrations
      const migrations = [];
      for (let i = 1; i <= 50; i++) {
        migrations.push({
          version: i,
          name: `migration_${i}`,
          upSql: `CREATE TABLE table_${i} (id INTEGER PRIMARY KEY, data TEXT)`,
          downSql: `DROP TABLE IF EXISTS table_${i}`,
        });
      }

      // Initialize schema
      await manager.initializeSchema();

      // Load all migrations
      const loadedMigrations = migrations.map((m) =>
        manager.loadMigrationFromJson(JSON.stringify(m))
      );

      // Act: Apply all migrations and measure time
      const startTime = Date.now();
      for (const migration of loadedMigrations) {
        await manager.applyMigration(migration!);
      }
      const duration = Date.now() - startTime;

      // Assert: All migrations applied successfully
      expect(duration).toBeLessThan(5000); // Under 5 seconds

      // Verify all tables exist
      const tables = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )
        .all()
        .map((t: any) => t.name);

      for (let i = 1; i <= 50; i++) {
        expect(tables).toContain(`table_${i}`);
      }

      // Verify migration records
      const records = db
        .prepare("SELECT COUNT(*) as count FROM schema_migrations")
        .get();
      expect((records as any).count).toBe(50);
    });
  });

  describe("T057b: Performance test for SC-004 (single migration rollback under 10s)", () => {
    it("should rollback single migration under 10 seconds", async () => {
      // Arrange: Create a migration
      const migrationJson = {
        version: 1,
        name: "create_users_table",
        upSql: `
          CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
          )
        `,
        downSql: "DROP TABLE IF EXISTS users",
      };

      // Initialize schema
      await manager.initializeSchema();

      // Load and apply migration
      const migration = manager.loadMigrationFromJson(JSON.stringify(migrationJson));
      await manager.applyMigration(migration!);

      // Act: Rollback migration and measure time
      const startTime = Date.now();
      const rollbackResult = await manager.rollbackMigration(migration!);
      const duration = Date.now() - startTime;

      // Assert: Rollback successful and under 10 seconds
      expect(rollbackResult.success).toBe(true);
      expect(duration).toBeLessThan(10000); // Under 10 seconds

      // Verify table was dropped
      const tableExists = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        )
        .get();
      expect(tableExists).toBeUndefined();

      // Verify migration record was deleted
      const records = db
        .prepare("SELECT COUNT(*) as count FROM schema_migrations")
        .get();
      expect((records as any).count).toBe(0);
    });
  });

  describe("T057c: Idempotency test for SC-006 (100 runs without side effects)", () => {
    it("should apply same migration 100 times without side effects", async () => {
      // Arrange: Create a migration
      const migrationJson = {
        version: 1,
        name: "create_users_table",
        upSql: `
          CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
          )
        `,
        downSql: "DROP TABLE IF EXISTS users",
      };

      // Initialize schema
      await manager.initializeSchema();

      // Load migration
      const migration = manager.loadMigrationFromJson(JSON.stringify(migrationJson));

      // Act: Apply migration 100 times
      const results = [];
      for (let i = 0; i < 100; i++) {
        const result = await manager.applyMigration(migration!);
        results.push(result);
      }

      // Assert: First succeeds, rest fail (idempotent)
      expect(results[0].success).toBe(true);
      for (let i = 1; i < 100; i++) {
        expect(results[i].success).toBe(false);
      }

      // Verify only one migration record exists
      const records = db
        .prepare("SELECT COUNT(*) as count FROM schema_migrations")
        .get();
      expect((records as any).count).toBe(1);

      // Verify table still exists and is correct
      const tableExists = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        )
        .get();
      expect(tableExists).toBeDefined();

      // Verify table structure is correct
      const columns = db.prepare("PRAGMA table_info(users)").all();
      expect(columns).toHaveLength(4);
      expect((columns[0] as any).name).toBe("id");
      expect((columns[1] as any).name).toBe("name");
      expect((columns[2] as any).name).toBe("email");
      expect((columns[3] as any).name).toBe("created_at");
    });
  });
});
