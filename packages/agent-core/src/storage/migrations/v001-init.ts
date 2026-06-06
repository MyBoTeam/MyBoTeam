import type { Database } from '../database.js';

// WHY: Squashed migration replacing v001-initial through v031.
// Corrects schema mismatches found during the sql.js migration (PR #187):
// providers.custom_base_url, connectors columns, task_todos PK/columns,
// myboteam_ai_credits schema, google_accounts defaults, app_settings defaults,
// workspaces.name UNIQUE, knowledge_notes.type default, restored indexes.
export function v001Init(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

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

    CREATE TABLE IF NOT EXISTS provider_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      active_provider_id TEXT,
      debug_mode INTEGER DEFAULT 0
    );

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

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      summary TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      session_id TEXT,
      created_at TEXT NOT NULL,
      started_at TEXT,
      completed_at TEXT,
      workspace_id TEXT
    );

    CREATE TABLE IF NOT EXISTS task_messages (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      content TEXT,
      tool_name TEXT,
      tool_input TEXT,
      timestamp TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      tool_status TEXT,
      model_id TEXT,
      provider_id TEXT
    );

    CREATE TABLE IF NOT EXISTS task_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT NOT NULL REFERENCES task_messages(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      label TEXT
    );

    CREATE TABLE IF NOT EXISTS task_todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      todo_id TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT NOT NULL DEFAULT 'medium',
      sort_order INTEGER NOT NULL,
      UNIQUE(task_id, todo_id)
    );

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

    CREATE TABLE IF NOT EXISTS task_favorites (
      task_id TEXT NOT NULL PRIMARY KEY,
      prompt TEXT NOT NULL,
      summary TEXT,
      favorited_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scheduled_tasks (
      id TEXT PRIMARY KEY,
      cron TEXT NOT NULL,
      prompt TEXT NOT NULL,
      workspace_id TEXT,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      last_run_at TEXT,
      next_run_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS myboteam_ai_credits (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      credits_json TEXT NOT NULL
    );

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

    CREATE TABLE IF NOT EXISTS knowledge_notes (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'context',
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

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
  db.run(
    'INSERT OR IGNORE INTO app_settings (id, debug_mode, onboarding_complete) VALUES (?, ?, ?)',
    [1, 0, 0],
  );
  db.run('INSERT OR IGNORE INTO provider_meta (id, debug_mode) VALUES (?, ?)', [1, 0]);
}
