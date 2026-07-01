/**
 * Schema Migrations Manager
 * Orchestrates migration apply, rollback, and status operations
 */

import type Database from 'better-sqlite3';
import { MigrationLoader } from './loader.js';
import { MigrationLock } from './lock.js';
import type {
  Logger,
  Migration,
  MigrationManagerConfig,
  MigrationRecord,
  MigrationResult,
  RollbackResult,
} from './types.js';
import { MigrationValidator } from './validator.js';

const DEFAULT_LOCK_PATH = '.local-data/migration.lock';
const DEFAULT_LOCK_TIMEOUT = 30000;

export class MigrationManager {
  private db: Database.Database;
  private migrationsPath: string;
  private logger: Logger;
  private lock: MigrationLock;
  private validator: MigrationValidator;
  private loader: MigrationLoader;

  constructor(config: MigrationManagerConfig) {
    this.db = config.db;
    this.migrationsPath = config.migrationsPath;
    this.logger = config.logger || console;
    this.lock = new MigrationLock(
      config.lockFilePath || DEFAULT_LOCK_PATH,
      config.lockTimeout || DEFAULT_LOCK_TIMEOUT,
      this.logger,
    );
    this.validator = new MigrationValidator(this.logger);
    this.loader = new MigrationLoader(this.logger);
  }

  /**
   * Initialize migration table schema
   */
  async initializeSchema(): Promise<void> {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    this.logger.info('Migration table schema initialized');
  }

  /**
   * Acquire lock for migration execution
   */
  async acquireLock(): Promise<boolean> {
    return this.lock.acquire();
  }

  /**
   * Release migration lock
   */
  async releaseLock(): Promise<void> {
    return this.lock.release();
  }

  /**
   * Load all migration files
   */
  async loadMigrations(): Promise<Migration[]> {
    return this.loader.loadAll(this.migrationsPath);
  }

  /**
   * Load migration from JSON content (for testing)
   */
  loadMigrationFromJson(jsonContent: string): Migration | null {
    return this.loader.loadFromJson(jsonContent, true);
  }

  /**
   * Load migration from JSON content without validation (for testing)
   */
  loadMigrationFromJsonUnsafe(jsonContent: string): Migration | null {
    return this.loader.loadFromJson(jsonContent, false);
  }

  /**
   * Validate migration structure
   */
  validateMigration(migration: unknown): boolean {
    return this.validator.validate(migration);
  }

  /**
   * Validate migration sequence
   */
  validateMigrationSequence(migrations: Migration[]): boolean {
    return this.validator.validateSequence(migrations);
  }

  /**
   * Get applied migrations from database
   */
  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    return this.db
      .prepare('SELECT version, name, applied_at FROM schema_migrations ORDER BY version')
      .all() as MigrationRecord[];
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<Migration[]> {
    const allMigrations = await this.loadMigrations();
    const applied = await this.getAppliedMigrations();
    const appliedVersions = new Set(applied.map((m) => m.version));
    return allMigrations.filter((m) => !appliedVersions.has(m.version));
  }

  /**
   * Get migration status
   */
  async status(): Promise<{
    currentVersion: number | null;
    applied: MigrationRecord[];
    pending: Migration[];
  }> {
    const applied = await this.getAppliedMigrations();
    const pending = await this.getPendingMigrations();
    const lastApplied = applied.length > 0 ? applied[applied.length - 1] : undefined;
    const currentVersion = lastApplied?.version ?? null;
    return { currentVersion, applied, pending };
  }

  /**
   * Execute a database operation within an IMMEDIATE transaction.
   * Returns structured result with timing and error info.
   */
  private executeInTransaction(
    migration: Migration,
    operation: () => void,
    action: 'applied' | 'rolled back',
  ): MigrationResult {
    const startTime = Date.now();

    try {
      this.db.exec('BEGIN IMMEDIATE');
      try {
        operation();
        this.db.exec('COMMIT');

        const duration = Date.now() - startTime;
        this.logger.info(
          `Migration ${migration.name} (v${migration.version}) ${action} in ${duration}ms`,
        );
        return { success: true, version: migration.version, name: migration.name, duration };
      } catch (error) {
        this.db.exec('ROLLBACK');
        throw error;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Migration ${migration.name} (v${migration.version}) ${action} failed: ${errorMessage}`,
      );
      return {
        success: false,
        version: migration.version,
        name: migration.name,
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Apply a single migration
   */
  async applyMigration(migration: Migration): Promise<MigrationResult> {
    return this.executeInTransaction(
      migration,
      () => {
        migration.up(this.db);
        this.db
          .prepare(
            "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, datetime('now'))",
          )
          .run(migration.version, migration.name);
      },
      'applied',
    );
  }

  /**
   * Rollback a single migration
   */
  async rollbackMigration(migration: Migration): Promise<MigrationResult> {
    return this.executeInTransaction(
      migration,
      () => {
        migration.down(this.db);
        this.db.prepare('DELETE FROM schema_migrations WHERE version = ?').run(migration.version);
      },
      'rolled back',
    );
  }

  /**
   * Apply all pending migrations
   */
  async apply(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];

    try {
      await this.initializeSchema();

      const lockAcquired = await this.lock.acquire();
      if (!lockAcquired) {
        this.logger.warn('Could not acquire lock. Another process may be running migrations.');
        return results;
      }

      try {
        const pending = await this.getPendingMigrations();

        if (pending.length === 0) {
          this.logger.info('No pending migrations');
          return results;
        }

        this.logger.info(`Found ${pending.length} pending migrations`);

        for (const migration of pending) {
          const result = await this.applyMigration(migration);
          results.push(result);

          if (!result.success) {
            this.logger.error(`Migration failed: ${migration.name}. Stopping migration process.`);
            break;
          }
        }
      } finally {
        await this.lock.release();
      }
    } catch (error) {
      this.logger.error(`Migration process failed: ${error}`);
      throw error;
    }

    return results;
  }

  /**
   * Rollback to target version
   */
  async rollback(targetVersion: number): Promise<RollbackResult> {
    const startTime = Date.now();
    const rolledBackVersions: number[] = [];

    try {
      await this.initializeSchema();

      const lockAcquired = await this.lock.acquire();
      if (!lockAcquired) {
        return {
          success: false,
          targetVersion,
          rolledBackVersions: [],
          error: 'Could not acquire lock',
          duration: Date.now() - startTime,
        };
      }

      try {
        const applied = await this.getAppliedMigrations();
        const toRollback = applied
          .filter((m) => m.version > targetVersion)
          .sort((a, b) => b.version - a.version);

        if (toRollback.length === 0) {
          this.logger.info('No migrations to rollback');
          return {
            success: true,
            targetVersion,
            rolledBackVersions: [],
            duration: Date.now() - startTime,
          };
        }

        this.logger.info(
          `Rolling back ${toRollback.length} migrations to version ${targetVersion}`,
        );

        const allMigrations = await this.loadMigrations();
        const migrationMap = new Map(allMigrations.map((m) => [m.version, m]));

        for (const record of toRollback) {
          const migration = migrationMap.get(record.version);
          if (!migration) {
            return {
              success: false,
              targetVersion,
              rolledBackVersions,
              error: `Migration file not found for version ${record.version}`,
              duration: Date.now() - startTime,
            };
          }

          const result = await this.rollbackMigration(migration);
          rolledBackVersions.push(record.version);

          if (!result.success) {
            return {
              success: false,
              targetVersion,
              rolledBackVersions,
              error: result.error,
              duration: Date.now() - startTime,
            };
          }
        }

        return {
          success: true,
          targetVersion,
          rolledBackVersions,
          duration: Date.now() - startTime,
        };
      } finally {
        await this.lock.release();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Rollback process failed: ${errorMessage}`);
      return {
        success: false,
        targetVersion,
        rolledBackVersions,
        error: errorMessage,
        duration: Date.now() - startTime,
      };
    }
  }
}
