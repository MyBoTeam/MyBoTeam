# Data Model: SQLite Storage Layer

**Date**: 2026-06-25
**Feature**: M2-1 SQLite Storage Layer
**Source**: v0.2.0 `packages/daemon/src/migrations/*.ts`

## Schema Comparison

### v0.2.0 Tables (sql.js)

| Table | v0.2.0 Name | Notes |
|-------|-------------|-------|
| Agent | `agent_registry` | Renamed to `agent` in v0.5.0 |
| Task | `tasks` | Status enum: pending, running, completed, failed |
| Conversation | `conversations` | Includes status, is_archived |
| Message | `messages` | FK to conversations |
| McpServer | `mcps` | Renamed to `mcp_server` |
| Vault | `vault` | Secrets (separate from structured data) |
| Skills | `skills` | Skill definitions |
| Settings | `settings` | Key-value config |
| MemoryEntry | — | New in v0.5.0 |
| Note | — | New in v0.5.0 |
| Schedule | — | New in v0.5.0 |
| DocumentVersion | — | New in v0.5.0 |

### v0.5.0 Tables (better-sqlite3)

| Table | Source | Status |
|-------|--------|--------|
| `agent` | AD.md ER diagram | New schema (slug, provider, model) |
| `task` | AD.md ER diagram | Extended (verification_status, continuation_count) |
| `task_todo` | AD.md ER diagram | New |
| `conversation` | AD.md ER diagram | Simplified (no status, is_archived) |
| `message` | AD.md ER diagram | Same structure |
| `memory_entry` | AD.md ER diagram | New |
| `mcp_server` | AD.md ER diagram | Renamed from mcps |
| `agent_mcp_assignment` | AD.md ER diagram | New join table |
| `note` | AD.md ER diagram | New |
| `schedule` | AD.md ER diagram | New |
| `document_version` | AD.md ER diagram | New |

## Entity Definitions

### 1. Agent

```typescript
interface Agent {
  id: string;          // UUID, primary key
  slug: string;        // Unique, e.g. "secretary", "accountant"
  provider: string;    // LLM provider, e.g. "anthropic", "openai", "ollama"
  model: string;       // Model name, e.g. "claude-sonnet-4-20250514"
  status: string;      // "active" | "inactive" | "error"
  created_at: string;  // ISO 8601
  updated_at: string;  // ISO 8601
}
```

**SQL**:
```sql
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
```

---

### 2. Task

```typescript
interface Task {
  id: string;                   // UUID, primary key
  agent_id: string;             // FK → Agent.id
  title: string;                // Task description
  status: string;               // pending|running|partial|completed|failed|max_retries
  verification_status: string;  // null|pending|passed|failed
  continuation_count: number;   // Default 0, incremented on continuation
  created_at: string;
  updated_at: string;
}
```

**SQL**:
```sql
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
```

---

### 3. TaskTodo

```typescript
interface TaskTodo {
  id: string;          // UUID, primary key
  task_id: string;     // FK → Task.id
  description: string; // Todo text
  is_completed: boolean; // Default false
  created_at: string;
}
```

**SQL**:
```sql
CREATE TABLE IF NOT EXISTS task_todo (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_task_todo_task ON task_todo(task_id);
```

---

### 4. Conversation

```typescript
interface Conversation {
  id: string;          // UUID, primary key
  agent_id: string;    // FK → Agent.id
  title: string;       // Auto-generated or user-provided
  created_at: string;
  updated_at: string;
}
```

**SQL**:
```sql
CREATE TABLE IF NOT EXISTS conversation (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agent(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_conversation_agent ON conversation(agent_id);
```

---

### 5. Message

```typescript
interface Message {
  id: string;             // UUID, primary key
  conversation_id: string; // FK → Conversation.id
  role: string;           // "user" | "assistant" | "system"
  content: string;        // Message text
  created_at: string;
}
```

**SQL**:
```sql
CREATE TABLE IF NOT EXISTS message (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_message_conversation ON message(conversation_id);
```

---

### 6. MemoryEntry

```typescript
interface MemoryEntry {
  id: string;          // UUID, primary key
  agent_id: string;    // FK → Agent.id
  category: string;    // "preference" | "fact" | "pattern" | "instruction"
  content: string;     // Memory text
  confidence: number;  // 0.0 - 1.0, default 1.0
  source: string;      // "conversation" | "manual" | "extraction"
  created_at: string;
  updated_at: string;
}
```

**SQL**:
```sql
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
```

---

### 7. McpServer

```typescript
interface McpServer {
  id: string;          // UUID, primary key
  name: string;        // Display name
  command: string;     // Executable command
  args: string[];      // Command arguments (JSON array)
  env: Record<string, string>; // Environment variables (JSON object)
  status: string;      // "active" | "inactive" | "error"
  created_at: string;
}
```

**SQL**:
```sql
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
```

---

### 8. AgentMcpAssignment

```typescript
interface AgentMcpAssignment {
  agent_id: string;       // FK → Agent.id
  mcp_server_id: string;  // FK → McpServer.id
  assigned_at: string;
}
```

**SQL**:
```sql
CREATE TABLE IF NOT EXISTS agent_mcp_assignment (
  agent_id TEXT NOT NULL REFERENCES agent(id) ON DELETE CASCADE,
  mcp_server_id TEXT NOT NULL REFERENCES mcp_server(id) ON DELETE CASCADE,
  assigned_at TEXT NOT NULL,
  PRIMARY KEY (agent_id, mcp_server_id)
);
```

---

### 9. Note

```typescript
interface Note {
  id: string;          // UUID, primary key
  title: string;       // Note title
  type: string;        // "text" | "checklist"
  content: string;     // Text content or JSON checklist items
  pinned: number;      // 0 or 1 (SQLite INTEGER), default 0
  archived: number;    // 0 or 1 (SQLite INTEGER), default 0
  due_date: string | null; // ISO 8601 or null
  created_at: string;
  updated_at: string;
}
```

**SQL**:
```sql
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
```

---

### 10. Schedule

```typescript
interface Schedule {
  id: string;          // UUID, primary key
  name: string;        // Schedule display name
  type: string;        // "at" | "every" | "cron"
  expression: string;  // ISO date (at), interval (every), or cron expression
  status: string;      // "active" | "paused" | "completed"
  agent_id: string;    // FK → Agent.id
  task_id: string | null; // FK → Task.id, nullable for one-off schedules
  created_at: string;
  updated_at: string;
}
```

**SQL**:
```sql
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
```

---

### 11. DocumentVersion

```typescript
interface DocumentVersion {
  id: string;          // UUID, primary key
  file_path: string;   // Relative path from workspace root
  content: string;     // Document content
  model: string;       // Model used to generate/edit
  version: number;     // Incrementing version number
  created_at: string;
}
```

**SQL**:
```sql
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
```

## Relationships

| Relationship | Type | Delete Rule |
|-------------|------|-------------|
| Agent → Task | One-to-many | CASCADE |
| Agent → Conversation | One-to-many | CASCADE |
| Agent → MemoryEntry | One-to-many | CASCADE |
| Agent → Schedule | One-to-many | CASCADE |
| Agent ↔ McpServer | Many-to-many | CASCADE |
| Task → TaskTodo | One-to-many | CASCADE |
| Conversation → Message | One-to-many | CASCADE |

## Migration Strategy

Consolidate all v0.2.0 migrations into single init migration:

```typescript
// 001-init.ts
export const migration: Migration = {
  version: 1,
  name: '001-init',
  up: (db: Database) => {
    // All CREATE TABLE statements above
    // Track in _migrations table
  }
};
```

## Performance Considerations

1. **WAL Mode**: Enables concurrent reads during writes
2. **Indexes**: Add indexes on foreign keys for JOIN performance
3. **FTS5**: Full-text search on Message.content, Note.content, MemoryEntry.content
4. **JSON Storage**: Use SQLite JSON functions for TaskTodo, Note.items, McpServer.args/env
