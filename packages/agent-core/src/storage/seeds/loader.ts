/**
 * Seed File Loader
 * Loads seed files from disk and parses JSON content
 */

import type { Seed, SeedLogger } from './types.js';

export class SeedLoader {
  private logger: SeedLogger;

  constructor(logger: SeedLogger) {
    this.logger = logger;
  }

  /**
   * Load all seed files from seeds directory
   */
  async loadAll(seedsPath: string): Promise<Seed[]> {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const seeds: Seed[] = [];

    try {
      const files = await fs.readdir(seedsPath);

      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.json')) {
          const filePath = path.join(seedsPath, file);
          const seed = await this.loadFile(filePath);
          if (seed) {
            seeds.push(seed);
          }
        }
      }

      seeds.sort((a, b) => a.order - b.order);

      this.logger.debug(`Loaded ${seeds.length} seeds`);
      return seeds;
    } catch (error) {
      this.logger.error(`Failed to load seeds: ${error}`);
      throw error;
    }
  }

  /**
   * Load a single seed file
   */
  private async loadFile(filePath: string): Promise<Seed | null> {
    try {
      const module = await import(filePath);
      const seed = module.default || module;

      if (!this.isValidSeed(seed)) {
        this.logger.warn(`Invalid seed file: ${filePath}`);
        return null;
      }

      return seed as Seed;
    } catch (error) {
      this.logger.error(`Failed to load seed ${filePath}: ${error}`);
      return null;
    }
  }

  /**
   * Load seed from JSON content
   */
  loadFromJson(jsonContent: string, validate = true): Seed | null {
    try {
      const seed = JSON.parse(jsonContent);

      if (validate && !this.isValidSeed(seed)) {
        this.logger.warn('Invalid seed JSON content');
        return null;
      }

      return {
        name: seed.name,
        order: seed.order,
        seed: (db) => {
          if (seed.seedSql) {
            db.exec(seed.seedSql);
          }
        },
        rollback: (db) => {
          if (seed.rollbackSql) {
            db.exec(seed.rollbackSql);
          }
        },
      };
    } catch (error) {
      this.logger.error(`Failed to parse seed JSON: ${error}`);
      return null;
    }
  }

  /**
   * Validate seed structure
   */
  private isValidSeed(seed: unknown): boolean {
    const s = seed as Partial<Seed> & { seedSql?: string; rollbackSql?: string };
    return (
      typeof s === 'object' &&
      s !== null &&
      typeof s.name === 'string' &&
      typeof s.order === 'number' &&
      ((typeof s.seed === 'function' && typeof s.rollback === 'function') ||
        (typeof s.seedSql === 'string' && typeof s.rollbackSql === 'string'))
    );
  }
}
