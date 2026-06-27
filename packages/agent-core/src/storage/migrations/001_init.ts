/**
 * Init Migration (001_init)
 * Consolidates base schema for new deployments.
 * Existing databases should skip this migration.
 */

import type Database from 'better-sqlite3';

export default {
  version: 1,
  name: '001_init',
  up: (db: Database.Database) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_seeds (
        name TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  },
  down: (db: Database.Database) => {
    db.exec('DROP TABLE IF EXISTS schema_seeds');
    db.exec('DROP TABLE IF EXISTS schema_migrations');
  },
};
