/**
 * Migration Validation
 * Validates migration structure and sequence integrity
 */

import type { Logger, Migration } from './types.js';

export class MigrationValidator {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Validate migration structure
   */
  validate(migration: unknown): boolean {
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

  /**
   * Validate migration sequence (no gaps, no duplicates)
   */
  validateSequence(migrations: Migration[]): boolean {
    if (migrations.length === 0) return true;

    const versions = migrations.map((m) => m.version);
    const uniqueVersions = new Set(versions);

    if (uniqueVersions.size !== versions.length) {
      this.logger.error('Duplicate migration versions detected');
      return false;
    }

    const sorted = [...versions].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i] !== i + 1) {
        this.logger.error(`Migration version gap detected: expected ${i + 1}, got ${sorted[i]}`);
        return false;
      }
    }

    return true;
  }
}
