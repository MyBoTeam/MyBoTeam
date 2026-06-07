import type { Database } from '../database.js';

export function createTasksTables(db: Database): void {
  db.exec(`
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
  `);
}

export function createTaskFavoritesTable(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_favorites (
      task_id TEXT NOT NULL PRIMARY KEY,
      prompt TEXT NOT NULL,
      summary TEXT,
      favorited_at TEXT NOT NULL
    );
  `);
}

export function createScheduledTasksTable(db: Database): void {
  db.exec(`
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
  `);
}

export function createMyboteamAiCreditsTable(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS myboteam_ai_credits (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      credits_json TEXT NOT NULL
    );
  `);
}
