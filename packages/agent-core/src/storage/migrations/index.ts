/**
 * Schema Migrations Manager
 * Export all types and interfaces
 */

import { migration } from './001-init.js';

export const migrations = [migration];

// New migration manager exports
export type {
  Migration,
  MigrationRecord,
  MigrationStatus,
  MigrationResult,
  RollbackResult,
  MigrationManagerConfig,
  Logger,
  LockInfo,
  MigrationLoader,
  MigrationValidator,
} from "./types.js";

export { MigrationManager } from "./manager.js";
export { MigrationLock } from "./lock.js";
export { MigrationValidator as MigrationValidatorImpl } from "./validator.js";
export { MigrationLoader as MigrationLoaderImpl } from "./loader.js";
