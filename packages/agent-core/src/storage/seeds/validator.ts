/**
 * Seed Validation
 * Validates seed structure and sequence integrity
 */

import type { Seed, SeedLogger } from './types.js';

export class SeedValidator {
  private logger: SeedLogger;

  constructor(logger: SeedLogger) {
    this.logger = logger;
  }

  /**
   * Validate seed structure
   */
  validate(seed: unknown): boolean {
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

  /**
   * Validate seed sequence (no duplicates)
   */
  validateSequence(seeds: Seed[]): boolean {
    if (seeds.length === 0) return true;

    const names = seeds.map((s) => s.name);
    const uniqueNames = new Set(names);

    if (uniqueNames.size !== names.length) {
      this.logger.error('Duplicate seed names detected');
      return false;
    }

    return true;
  }
}
