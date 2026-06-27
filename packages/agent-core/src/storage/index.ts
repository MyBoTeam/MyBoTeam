/**
 * Storage Module
 * Exports for database, migrations, and seeds
 */

export {
  closeDatabase,
  getDatabasePath,
  getTableCount,
  initializeDatabase,
  verifyWalMode,
} from './database.js';
export { DatabaseError, NotFoundError, ValidationError } from './errors.js';
export { createChildLogger, logOperation } from './logger.js';
export { initMigration, MIGRATION_NAME, MIGRATION_VERSION } from './migrations/001-init.js';
export { runMigrations } from './runner.js';
export {
  seedDevAgents,
  seedProduction,
  seedTest,
  seedTestAgentAssignments,
  seedTestMcpServers,
} from './seeder.js';

// New migrations and seeds exports
export * from './migrations/index.js';
export * from './seeds/index.js';
