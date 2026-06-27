/**
 * Migration File Loader
 * Loads migration files from disk and parses JSON content
 */

import type { Logger, Migration } from './types.js';

export class MigrationLoader {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Load all migration files from migrations directory
   */
  async loadAll(migrationsPath: string): Promise<Migration[]> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const migrations: Migration[] = [];

    try {
      const files = await fs.readdir(migrationsPath);

      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.json')) {
          const filePath = path.join(migrationsPath, file);
          const migration = await this.loadFile(filePath);
          if (migration) {
            migrations.push(migration);
          }
        }
      }

      migrations.sort((a, b) => a.version - b.version);

      this.logger.debug(`Loaded ${migrations.length} migrations`);
      return migrations;
    } catch (error) {
      this.logger.error(`Failed to load migrations: ${error}`);
      throw error;
    }
  }

  /**
   * Load a single migration file
   */
  private async loadFile(filePath: string): Promise<Migration | null> {
    try {
      const module = await import(filePath);
      const migration = module.default || module;

      if (!this.isValidMigration(migration)) {
        this.logger.warn(`Invalid migration file: ${filePath}`);
        return null;
      }

      return migration as Migration;
    } catch (error) {
      this.logger.error(`Failed to load migration ${filePath}: ${error}`);
      return null;
    }
  }

  /**
   * Load migration from JSON content
   */
  loadFromJson(jsonContent: string, validate = true): Migration | null {
    try {
      const migration = JSON.parse(jsonContent);

      if (validate && !this.isValidMigration(migration)) {
        this.logger.warn('Invalid migration JSON content');
        return null;
      }

      return {
        version: migration.version,
        name: migration.name,
        up: (db) => {
          if (migration.upSql) {
            db.exec(migration.upSql);
          }
        },
        down: (db) => {
          if (migration.downSql) {
            db.exec(migration.downSql);
          }
        },
      };
    } catch (error) {
      this.logger.error(`Failed to parse migration JSON: ${error}`);
      return null;
    }
  }

  /**
   * Validate migration structure
   */
  private isValidMigration(migration: unknown): boolean {
    const m = migration as Partial<Migration> & { upSql?: string; downSql?: string };
    return (
      typeof m === 'object' &&
      m !== null &&
      typeof m.version === 'number' &&
      typeof m.name === 'string' &&
      ((typeof m.up === 'function' && typeof m.down === 'function') ||
        (typeof m.upSql === 'string' && typeof m.downSql === 'string'))
    );
  }
}
