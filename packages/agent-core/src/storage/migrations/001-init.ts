import type Database from 'better-sqlite3';

export interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
}

export const migration: Migration = {
  version: 1,
  name: '001-init',
  up: (db: Database.Database) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS agent (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_agent_slug ON agent(slug);
      CREATE INDEX IF NOT EXISTS idx_agent_status ON agent(status);

      CREATE TABLE IF NOT EXISTS task (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL REFERENCES agent(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'partial', 'completed', 'failed', 'max_retries')),
        verification_status TEXT CHECK (verification_status IN ('pending', 'passed', 'failed')),
        continuation_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_task_agent ON task(agent_id);
      CREATE INDEX IF NOT EXISTS idx_task_status ON task(status);

      CREATE TABLE IF NOT EXISTS task_todo (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES task(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        is_completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_task_todo_task ON task_todo(task_id);

      CREATE TABLE IF NOT EXISTS conversation (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL REFERENCES agent(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_conversation_agent ON conversation(agent_id);

      CREATE TABLE IF NOT EXISTS message (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_message_conversation ON message(conversation_id);

      CREATE TABLE IF NOT EXISTS memory_entry (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL REFERENCES agent(id) ON DELETE CASCADE,
        category TEXT NOT NULL CHECK (category IN ('preference', 'fact', 'pattern', 'instruction')),
        content TEXT NOT NULL,
        confidence REAL NOT NULL DEFAULT 1.0,
        source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('conversation', 'manual', 'extraction')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_memory_entry_agent ON memory_entry(agent_id);
      CREATE INDEX IF NOT EXISTS idx_memory_entry_category ON memory_entry(category);

      CREATE TABLE IF NOT EXISTS mcp_server (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        command TEXT NOT NULL,
        args TEXT NOT NULL DEFAULT '[]',
        env TEXT NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_mcp_server_name ON mcp_server(name);

      CREATE TABLE IF NOT EXISTS agent_mcp_assignment (
        agent_id TEXT NOT NULL REFERENCES agent(id) ON DELETE CASCADE,
        mcp_server_id TEXT NOT NULL REFERENCES mcp_server(id) ON DELETE CASCADE,
        assigned_at TEXT NOT NULL,
        PRIMARY KEY (agent_id, mcp_server_id)
      );

      CREATE TABLE IF NOT EXISTS note (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'checklist')),
        content TEXT NOT NULL DEFAULT '',
        pinned INTEGER NOT NULL DEFAULT 0,
        archived INTEGER NOT NULL DEFAULT 0,
        due_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_note_archived ON note(archived);

      CREATE TABLE IF NOT EXISTS schedule (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('at', 'every', 'cron')),
        expression TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
        agent_id TEXT NOT NULL REFERENCES agent(id) ON DELETE CASCADE,
        task_id TEXT REFERENCES task(id),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_schedule_agent ON schedule(agent_id);
      CREATE INDEX IF NOT EXISTS idx_schedule_status ON schedule(status);

      CREATE TABLE IF NOT EXISTS document_version (
        id TEXT PRIMARY KEY,
        file_path TEXT NOT NULL,
        content TEXT NOT NULL,
        model TEXT NOT NULL,
        version INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (file_path, version)
      );

      CREATE INDEX IF NOT EXISTS idx_document_version_path ON document_version(file_path);
    `);
  },
};

export const initMigration = migration;
export const MIGRATION_VERSION = migration.version;
export const MIGRATION_NAME = migration.name;
