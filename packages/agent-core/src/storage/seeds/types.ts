/**
 * Seed Manager Types
 * Based on data-model.md and contracts/interfaces.md
 */

import type Database from 'better-sqlite3';

/**
 * Seed file structure
 * Each seed file exports an object with seed and rollback functions
 */
export interface Seed {
  /** Unique seed name */
  name: string;
  /** Execution order (lower runs first) */
  order: number;
  /** Apply seed data */
  seed: (db: Database.Database) => void;
  /** Remove seed data */
  rollback: (db: Database.Database) => void;
}

/**
 * Seed record in schema_seeds table
 */
export interface SeedRecord {
  /** Seed name */
  name: string;
  /** Timestamp when seed was applied (ISO 8601) */
  applied_at: string;
}

/**
 * Seed status
 */
export type SeedStatus = 'pending' | 'applied' | 'failed' | 'rolled_back';

/**
 * Seed result
 */
export interface SeedResult {
  /** Whether seed was successful */
  success: boolean;
  /** Seed name */
  name: string;
  /** Error message if failed */
  error?: string;
  /** Duration in milliseconds */
  duration: number;
}

/**
 * Seed manager configuration
 */
export interface SeedManagerConfig {
  /** Path to seeds directory */
  seedsPath: string;
  /** Database instance */
  db: Database.Database;
  /** Logger instance */
  logger?: Logger;
}

/**
 * Logger interface for seed events
 */
export interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
}

/**
 * Seed file loader interface
 */
export interface SeedLoader {
  /** Load all seed files from directory */
  loadAll(): Promise<Seed[]>;
  /** Load seed by name */
  load(name: string): Promise<Seed | null>;
}

/**
 * Seed validator interface
 */
export interface SeedValidator {
  /** Validate seed structure */
  validate(seed: Seed): boolean;
  /** Validate seed sequence */
  validateSequence(seeds: Seed[]): boolean;
}
