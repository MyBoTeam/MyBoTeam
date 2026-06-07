import type { Database } from '../database.js';

export function createSkillsTable(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      command TEXT,
      description TEXT,
      source TEXT NOT NULL DEFAULT 'custom',
      is_enabled INTEGER NOT NULL DEFAULT 1,
      is_verified INTEGER NOT NULL DEFAULT 0,
      is_hidden INTEGER NOT NULL DEFAULT 0,
      file_path TEXT,
      github_url TEXT,
      updated_at TEXT NOT NULL
    );
  `);
}

export function createConnectorsTable(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS connectors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'disconnected',
      is_enabled INTEGER NOT NULL DEFAULT 1,
      oauth_metadata_json TEXT,
      client_registration_json TEXT,
      last_connected_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}
