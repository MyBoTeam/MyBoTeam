import type { Database } from '../database.js';

export function createSchemaMetaTable(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export function createAppSettingsTable(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      debug_mode INTEGER DEFAULT 0,
      onboarding_complete INTEGER DEFAULT 0,
      selected_model TEXT,
      ollama_config TEXT,
      litellm_config TEXT,
      azure_foundry_config TEXT,
      lmstudio_config TEXT,
      openai_base_url TEXT,
      theme TEXT DEFAULT 'system',
      sandbox_config TEXT,
      cloud_browser_config TEXT,
      notifications_enabled INTEGER DEFAULT 1,
      nim_config TEXT,
      messaging_config TEXT,
      close_behavior TEXT NOT NULL DEFAULT 'keep-daemon',
      huggingface_local_config TEXT,
      language TEXT NOT NULL DEFAULT 'auto'
    );
  `);
}
