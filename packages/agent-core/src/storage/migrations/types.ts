/**
 * Schema Migrations Manager Types
 * Based on data-model.md and contracts/interfaces.md
 */

import type Database from "better-sqlite3";

/**
 * Migration file structure
 * Each migration file exports an object with up and down functions
 */
export interface Migration {
  /** Unique version number (sequential integer) */
  version: number;
  /** Human-readable name */
  name: string;
  /** Apply migration (up) */
  up: (db: Database.Database) => void;
  /** Rollback migration (down) */
  down: (db: Database.Database) => void;
}

/**
 * Migration record in schema_migrations table
 */
export interface MigrationRecord {
  /** Migration version number */
  version: number;
  /** Migration name */
  name: string;
  /** Timestamp when migration was applied (ISO 8601) */
  applied_at: string;
}

/**
 * Migration status
 */
export type MigrationStatus =
  | "pending"
  | "applied"
  | "failed"
  | "rolled_back";

/**
 * Migration result
 */
export interface MigrationResult {
  /** Whether migration was successful */
  success: boolean;
  /** Version that was applied or rolled back */
  version: number;
  /** Migration name */
  name: string;
  /** Error message if failed */
  error?: string;
  /** Duration in milliseconds */
  duration: number;
}

/**
 * Rollback result
 */
export interface RollbackResult {
  /** Whether rollback was successful */
  success: boolean;
  /** Target version */
  targetVersion: number;
  /** Versions that were rolled back */
  rolledBackVersions: number[];
  /** Error message if failed */
  error?: string;
  /** Total duration in milliseconds */
  duration: number;
}

/**
 * Migration manager configuration
 */
export interface MigrationManagerConfig {
  /** Path to migrations directory */
  migrationsPath: string;
  /** Database instance */
  db: Database.Database;
  /** Lock file path (default: .local-data/migration.lock) */
  lockFilePath?: string;
  /** Lock timeout in milliseconds (default: 30000) */
  lockTimeout?: number;
  /** Logger instance */
  logger?: Logger;
}

/**
 * Logger interface for migration events
 */
export interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
}

/**
 * Lock file structure
 */
export interface LockInfo {
  /** Process ID that holds the lock */
  pid: number;
  /** Timestamp when lock was acquired (ISO 8601) */
  acquiredAt: string;
  /** Lock timeout in milliseconds */
  timeout: number;
}

/**
 * Migration file loader interface
 */
export interface MigrationLoader {
  /** Load all migration files from directory */
  loadAll(): Promise<Migration[]>;
  /** Load migration by version */
  load(version: number): Promise<Migration | null>;
}

/**
 * Migration validator interface
 */
export interface MigrationValidator {
  /** Validate migration structure */
  validate(migration: Migration): boolean;
  /** Validate migration sequence */
  validateSequence(migrations: Migration[]): boolean;
}
