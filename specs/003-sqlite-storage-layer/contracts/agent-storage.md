# AgentStorage API Contract

**Date**: 2026-06-25
**Feature**: M2-1 SQLite Storage Layer
**Source Reference**: v0.2.0 `packages/daemon/src/database-service.ts`

## Overview

`AgentStorage` is the public API facade for all database operations in `packages/agent-core`. It wraps better-sqlite3 with a synchronous API (single-user desktop app), providing typed CRUD operations for all 11 entities.

**Migration from v0.2.0**: Replaces `DatabaseService` class from `packages/daemon/src/database-service.ts`. Key changes:
- Async `initialize()` → Sync constructor
- sql.js API → better-sqlite3 API
- Checkpoint timer → WAL mode (automatic)
- `getDb()` → Direct method calls on AgentStorage

## Constructor

```typescript
import AgentStorage from '@myboteam/agent-core/agent-storage';

const storage = new AgentStorage({
  dataDir: '~/.myboteam/data',  // Optional, default from MYBOTEAM_DATA_DIR env
  mode: 'production'            // 'production' | 'development' | 'test'
});
```

**Behavior**:
- `mode: 'test'` → uses `:memory:` database
- `mode: 'development'` → uses `myboteam_dev.db`
- `mode: 'production'` → uses `myboteam.db`

## Agent CRUD

```typescript
// Create
storage.createAgent({
  slug: 'secretary',
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  status: 'active'
}): Agent

// Read
storage.getAgent(id: string): Agent | null
storage.getAgentBySlug(slug: string): Agent | null
storage.listAgents(): Agent[]

// Update
storage.updateAgent(id: string, data: Partial<Omit<Agent, 'id' | 'created_at'>>): Agent

// Delete
storage.deleteAgent(id: string): void  // CASCADE: tasks, conversations, memory, assignments
```

## Task CRUD

```typescript
// Create
storage.createTask(data: {
  agent_id: string;
  title: string;
  status?: string;  // Default: 'pending'
}): Task

// Read
storage.getTask(id: string): Task | null
storage.listTasks(filters?: {
  agent_id?: string;
  status?: string;
}): Task[]

// Update
storage.updateTask(id: string, data: Partial<Omit<Task, 'id' | 'created_at'>>): Task

// Delete
storage.deleteTask(id: string): void  // CASCADE: todos
```

## TaskTodo CRUD

```typescript
// Create
storage.createTaskTodo(data: {
  task_id: string;
  description: string;
}): TaskTodo

// Read
storage.listTaskTodos(taskId: string): TaskTodo[]

// Update
storage.updateTaskTodo(id: string, data: Partial<Omit<TaskTodo, 'id' | 'task_id'>>): TaskTodo

// Delete
storage.deleteTaskTodo(id: string): void
```

## Conversation CRUD

```typescript
// Create
storage.createConversation(data: {
  agent_id: string;
  title?: string;
}): Conversation

// Read
storage.getConversation(id: string): Conversation | null
storage.listConversations(agentId: string): Conversation[]

// Update
storage.updateConversation(id: string, data: Partial<Omit<Conversation, 'id' | 'created_at'>>): Conversation

// Delete
storage.deleteConversation(id: string): void  // CASCADE: messages
```

## Message CRUD

```typescript
// Create
storage.createMessage(data: {
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}): Message

// Read
storage.listMessages(conversationId: string): Message[]

// Delete
storage.deleteMessage(id: string): void
```

## MemoryEntry CRUD

```typescript
// Create
storage.createMemoryEntry(data: {
  agent_id: string;
  category: 'preference' | 'fact' | 'pattern' | 'instruction';
  content: string;
  confidence?: number;
  source?: string;
}): MemoryEntry

// Read
storage.getMemoryEntry(id: string): MemoryEntry | null
storage.listMemoryEntries(agentId: string, filters?: {
  category?: string;
}): MemoryEntry[]

// Update
storage.updateMemoryEntry(id: string, data: Partial<Omit<MemoryEntry, 'id' | 'created_at'>>): MemoryEntry

// Delete
storage.deleteMemoryEntry(id: string): void
```

## McpServer CRUD

```typescript
// Create
storage.createMcpServer(data: {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}): McpServer

// Read
storage.getMcpServer(id: string): McpServer | null
storage.getMcpServerByName(name: string): McpServer | null
storage.listMcpServers(): McpServer[]

// Update
storage.updateMcpServer(id: string, data: Partial<Omit<McpServer, 'id' | 'created_at'>>): McpServer

// Delete
storage.deleteMcpServer(id: string): void  // CASCADE: assignments
```

## AgentMcpAssignment CRUD

```typescript
// Assign
storage.assignMcpServer(agentId: string, mcpServerId: string): AgentMcpAssignment

// List
storage.listAgentMcpServers(agentId: string): McpServer[]
storage.listMcpServerAgents(mcpServerId: string): Agent[]

// Unassign
storage.unassignMcpServer(agentId: string, mcpServerId: string): void
```

## Note CRUD

```typescript
// Create
storage.createNote(data: {
  title: string;
  type?: 'text' | 'checklist';
  content?: string;
  pinned?: boolean;
  due_date?: string | null;
}): Note

// Read
storage.getNote(id: string): Note | null
storage.listNotes(filters?: {
  archived?: boolean;
  type?: string;
}): Note[]

// Update
storage.updateNote(id: string, data: Partial<Omit<Note, 'id' | 'created_at'>>): Note

// Delete
storage.deleteNote(id: string): void
```

## Schedule CRUD

```typescript
// Create
storage.createSchedule(data: {
  name: string;
  type: 'at' | 'every' | 'cron';
  expression: string;
  agent_id: string;
  task_id?: string;
}): Schedule

// Read
storage.getSchedule(id: string): Schedule | null
storage.listSchedules(filters?: {
  agent_id?: string;
  status?: string;
}): Schedule[]

// Update
storage.updateSchedule(id: string, data: Partial<Omit<Schedule, 'id' | 'created_at'>>): Schedule

// Delete
storage.deleteSchedule(id: string): void
```

## DocumentVersion CRUD

```typescript
// Create
storage.createDocumentVersion(data: {
  file_path: string;
  content: string;
  model: string;
}): DocumentVersion

// Read
storage.getDocumentVersion(id: string): DocumentVersion | null
storage.listDocumentVersions(filePath: string): DocumentVersion[]
storage.getLatestDocumentVersion(filePath: string): DocumentVersion | null

// Delete
storage.deleteDocumentVersion(id: string): void
```

## Utility Methods

```typescript
// Database lifecycle
storage.close(): void
storage.vacuum(): void

// Transaction support
storage.transaction<T>(fn: () => T): T
```

## Error Handling

All methods throw typed errors on failure:

```typescript
// Database errors (connection, write failures)
class DatabaseError extends Error {
  code: string;
  query?: string;
}

// Not found errors
class NotFoundError extends Error {
  entity: string;
  id: string;
}

// Validation errors (constraint violations)
class ValidationError extends Error {
  field: string;
  value: unknown;
}
```

## Logging

All database operations are logged with Pino:

```typescript
// Correlation ID passed via child logger
const log = storage.childLogger({ correlationId: '123' });

// Operations automatically logged:
// - DEBUG: query duration, parameters
// - INFO: operation success
// - WARN: slow queries (>100ms)
// - ERROR: database errors
```
