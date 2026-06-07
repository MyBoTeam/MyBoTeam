import type { Database } from '../database.js';

export function createProviderMetaTable(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS provider_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      active_provider_id TEXT,
      debug_mode INTEGER DEFAULT 0
    );
  `);
}

export function createProvidersTable(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS providers (
      provider_id TEXT PRIMARY KEY,
      connection_status TEXT DEFAULT 'disconnected',
      selected_model_id TEXT,
      credentials_type TEXT,
      credentials_data TEXT,
      last_connected_at TEXT,
      available_models TEXT,
      custom_base_url TEXT
    );
  `);
}
