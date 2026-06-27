/**
 * Schema Migrations Manager
 * Export all types and interfaces
 */

import { migration } from './001-init.js';

export const migrations = [migration];

export { MigrationLoader as MigrationLoaderImpl } from './loader.js';
export { MigrationLock } from './lock.js';
export { MigrationManager } from './manager.js';
// New migration manager exports
export type {
  LockInfo,
  Logger,
  Migration,
  MigrationLoader,
  MigrationManagerConfig,
  MigrationRecord,
  MigrationResult,
  MigrationStatus,
  MigrationValidator,
  RollbackResult,
} from './types.js';
export { MigrationValidator as MigrationValidatorImpl } from './validator.js';
