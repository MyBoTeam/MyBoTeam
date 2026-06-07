import type { Database } from '../database.js';

export function createGoogleAccountsTable(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS google_accounts (
      google_account_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      display_name TEXT NOT NULL,
      picture_url TEXT,
      label TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'connected',
      connected_at TEXT NOT NULL,
      last_refreshed_at TEXT
    );
  `);
}

export function createWorkspacesTables(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      color TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspace_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export function createKnowledgeNotesTable(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_notes (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'context',
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

export function createAllIndexes(db: Database): void {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
    CREATE INDEX IF NOT EXISTS idx_messages_task_id ON task_messages(task_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON tasks(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_task_favorites_favorited_at ON task_favorites(favorited_at);
    CREATE INDEX IF NOT EXISTS idx_connectors_enabled ON connectors(is_enabled);
    CREATE INDEX IF NOT EXISTS idx_connectors_status ON connectors(status);
    CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_enabled ON scheduled_tasks(is_enabled);
    CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_workspace ON scheduled_tasks(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_skills_enabled ON skills(is_enabled);
    CREATE INDEX IF NOT EXISTS idx_knowledge_notes_workspace ON knowledge_notes(workspace_id);
  `);
}
