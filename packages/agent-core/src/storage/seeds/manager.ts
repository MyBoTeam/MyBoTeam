/**
 * Seed Manager
 * Orchestrates seed apply and rollback operations
 */

import type Database from 'better-sqlite3';
import { SeedLoader } from './loader.js';
import type { Logger, Seed, SeedManagerConfig, SeedRecord, SeedResult } from './types.js';
import { SeedValidator } from './validator.js';

export class SeedManager {
  private db: Database.Database;
  private seedsPath: string;
  private logger: Logger;
  private validator: SeedValidator;
  private loader: SeedLoader;

  constructor(config: SeedManagerConfig) {
    this.db = config.db;
    this.seedsPath = config.seedsPath;
    this.logger = config.logger || console;
    this.validator = new SeedValidator(this.logger);
    this.loader = new SeedLoader(this.logger);
  }

  /**
   * Initialize seed table schema
   */
  async initializeSchema(): Promise<void> {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_seeds (
        name TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    this.logger.info('Seed table schema initialized');
  }

  /**
   * Get applied seeds from database
   */
  async getAppliedSeeds(): Promise<SeedRecord[]> {
    return this.db
      .prepare('SELECT name, applied_at FROM schema_seeds ORDER BY name')
      .all() as SeedRecord[];
  }

  /**
   * Get pending seeds
   */
  async getPendingSeeds(): Promise<Seed[]> {
    const allSeeds = await this.loadSeeds();
    const applied = await this.getAppliedSeeds();
    const appliedNames = new Set(applied.map((s) => s.name));
    return allSeeds.filter((s) => !appliedNames.has(s.name));
  }

  /**
   * Load all seed files
   */
  async loadSeeds(): Promise<Seed[]> {
    return this.loader.loadAll(this.seedsPath);
  }

  /**
   * Load seed from JSON content (for testing)
   */
  loadSeedFromJson(jsonContent: string): Seed | null {
    return this.loader.loadFromJson(jsonContent, true);
  }

  /**
   * Validate seed structure
   */
  validateSeed(seed: unknown): boolean {
    return this.validator.validate(seed);
  }

  /**
   * Execute a single seed
   */
  async executeSeed(seed: Seed): Promise<SeedResult> {
    const startTime = Date.now();

    try {
      this.db.exec('BEGIN IMMEDIATE');
      try {
        seed.seed(this.db);

        this.db
          .prepare("INSERT INTO schema_seeds (name, applied_at) VALUES (?, datetime('now'))")
          .run(seed.name);

        this.db.exec('COMMIT');

        const duration = Date.now() - startTime;
        this.logger.info(`Seed ${seed.name} executed in ${duration}ms`);
        return { success: true, name: seed.name, duration };
      } catch (error) {
        this.db.exec('ROLLBACK');
        throw error;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Seed ${seed.name} failed: ${errorMessage}`);
      return { success: false, name: seed.name, error: errorMessage, duration };
    }
  }

  /**
   * Rollback a single seed
   */
  async rollbackSeed(seed: Seed): Promise<SeedResult> {
    const startTime = Date.now();

    try {
      this.db.exec('BEGIN IMMEDIATE');
      try {
        seed.rollback(this.db);

        this.db.prepare('DELETE FROM schema_seeds WHERE name = ?').run(seed.name);

        this.db.exec('COMMIT');

        const duration = Date.now() - startTime;
        this.logger.info(`Seed ${seed.name} rolled back in ${duration}ms`);
        return { success: true, name: seed.name, duration };
      } catch (error) {
        this.db.exec('ROLLBACK');
        throw error;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Seed ${seed.name} rollback failed: ${errorMessage}`);
      return { success: false, name: seed.name, error: errorMessage, duration };
    }
  }

  /**
   * Apply all pending seeds
   */
  async apply(): Promise<SeedResult[]> {
    const results: SeedResult[] = [];

    try {
      await this.initializeSchema();

      const pending = await this.getPendingSeeds();

      if (pending.length === 0) {
        this.logger.info('No pending seeds');
        return results;
      }

      this.logger.info(`Found ${pending.length} pending seeds`);

      for (const seed of pending) {
        const result = await this.executeSeed(seed);
        results.push(result);

        if (!result.success) {
          this.logger.error(`Seed failed: ${seed.name}. Stopping seed process.`);
          break;
        }
      }
    } catch (error) {
      this.logger.error(`Seed process failed: ${error}`);
      throw error;
    }

    return results;
  }

  /**
   * Rollback all applied seeds
   */
  async rollbackAll(): Promise<SeedResult[]> {
    const results: SeedResult[] = [];

    try {
      await this.initializeSchema();

      const applied = await this.getAppliedSeeds();

      if (applied.length === 0) {
        this.logger.info('No seeds to rollback');
        return results;
      }

      this.logger.info(`Rolling back ${applied.length} seeds`);

      const allSeeds = await this.loadSeeds();
      const seedMap = new Map(allSeeds.map((s) => [s.name, s]));

      for (const record of [...applied].reverse()) {
        const seed = seedMap.get(record.name);
        if (!seed) {
          this.logger.warn(`Seed file not found for: ${record.name}`);
          continue;
        }

        const result = await this.rollbackSeed(seed);
        results.push(result);

        if (!result.success) {
          this.logger.error(`Seed rollback failed: ${record.name}. Stopping rollback process.`);
          break;
        }
      }
    } catch (error) {
      this.logger.error(`Rollback process failed: ${error}`);
      throw error;
    }

    return results;
  }
}
