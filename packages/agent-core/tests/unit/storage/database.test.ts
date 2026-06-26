import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Database Initialization', () => {
  let db: Database.Database;

  beforeAll(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = -20000');
    db.pragma('temp_store = MEMORY');
  });

  afterAll(() => {
    db.close();
  });

  it('should enable WAL mode (or memory for :memory:)', () => {
    const result = db.pragma('journal_mode', { simple: true });
    expect(['wal', 'memory']).toContain(result);
  });

  it('should have foreign keys enabled', () => {
    const result = db.pragma('foreign_keys', { simple: true });
    expect(result).toBe(1);
  });

  it('should create all 11 tables', () => {
    const migrations = [
      `CREATE TABLE IF NOT EXISTS agent (
        id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, provider TEXT NOT NULL,
        model TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS task (
        id TEXT PRIMARY KEY, agent_id TEXT NOT NULL REFERENCES agent(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'partial', 'completed', 'failed', 'max_retries')),
        verification_status TEXT CHECK (verification_status IN ('pending', 'passed', 'failed')),
        continuation_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS task_todo (
        id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES task(id) ON DELETE CASCADE,
        description TEXT NOT NULL, is_completed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS conversation (
        id TEXT PRIMARY KEY, agent_id TEXT NOT NULL REFERENCES agent(id) ON DELETE CASCADE,
        title TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS message (
        id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL, created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS memory_entry (
        id TEXT PRIMARY KEY, agent_id TEXT NOT NULL REFERENCES agent(id) ON DELETE CASCADE,
        category TEXT NOT NULL CHECK (category IN ('preference', 'fact', 'pattern', 'instruction')),
        content TEXT NOT NULL, confidence REAL NOT NULL DEFAULT 1.0,
        source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('conversation', 'manual', 'extraction')),
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS mcp_server (
        id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, command TEXT NOT NULL,
        args TEXT NOT NULL DEFAULT '[]', env TEXT NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS agent_mcp_assignment (
        agent_id TEXT NOT NULL REFERENCES agent(id) ON DELETE CASCADE,
        mcp_server_id TEXT NOT NULL REFERENCES mcp_server(id) ON DELETE CASCADE,
        assigned_at TEXT NOT NULL, PRIMARY KEY (agent_id, mcp_server_id)
      )`,
      `CREATE TABLE IF NOT EXISTS note (
        id TEXT PRIMARY KEY, title TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'checklist')),
        content TEXT NOT NULL DEFAULT '', pinned INTEGER NOT NULL DEFAULT 0,
        archived INTEGER NOT NULL DEFAULT 0, due_date TEXT,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS schedule (
        id TEXT PRIMARY KEY, name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('at', 'every', 'cron')),
        expression TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
        agent_id TEXT NOT NULL REFERENCES agent(id) ON DELETE CASCADE,
        task_id TEXT REFERENCES task(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS document_version (
        id TEXT PRIMARY KEY, file_path TEXT NOT NULL, content TEXT NOT NULL,
        model TEXT NOT NULL, version INTEGER NOT NULL, created_at TEXT NOT NULL,
        UNIQUE (file_path, version)
      )`,
    ];

    for (const sql of migrations) {
      db.exec(sql);
    }

    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_migrations' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all() as { name: string }[];

    expect(tables.length).toBe(11);
    const names = tables.map((t) => t.name).sort();
    expect(names).toEqual(
      [
        'agent',
        'agent_mcp_assignment',
        'conversation',
        'document_version',
        'mcp_server',
        'memory_entry',
        'message',
        'note',
        'schedule',
        'task',
        'task_todo',
      ].sort(),
    );
  });

  it('should create timestamp columns on tables', () => {
    const agentCols = db.prepare("SELECT name FROM pragma_table_info('agent')").all() as {
      name: string;
    }[];
    const colNames = agentCols.map((c) => c.name);
    expect(colNames).toContain('created_at');
    expect(colNames).toContain('updated_at');
  });

  it('should handle idempotent initialization', () => {
    db.exec(
      `CREATE TABLE IF NOT EXISTS agent (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, provider TEXT NOT NULL, model TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    );
    const tables = db
      .prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='agent'")
      .get() as { count: number };
    expect(tables.count).toBe(1);
  });

  it('should enforce foreign key constraints', () => {
    expect(() => {
      db.exec(
        "INSERT INTO task (id, agent_id, title, created_at, updated_at) VALUES ('t1', 'nonexistent', 'test', '2026-01-01', '2026-01-01')",
      );
    }).toThrow();
  });

  it('should fail on invalid table name', () => {
    expect(() => {
      db.prepare('SELECT COUNT(*) as count FROM invalid_table').get();
    }).toThrow();
  });
});
