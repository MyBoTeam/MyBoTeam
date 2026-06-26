# Quickstart: SQLite Storage Layer

**Date**: 2026-06-25
**Feature**: M2-1 SQLite Storage Layer
**Source Reference**: v0.2.0 `packages/daemon/src/database-service.ts`

## Migration from v0.2.0

If you're migrating from the v0.2.0 `DatabaseService`:

```typescript
// v0.2.0 (sql.js, async)
const db = new DatabaseService();
await db.initialize(dataDir);
const sqlDb = db.getDb();
sqlDb.run('INSERT INTO ...');

// v0.5.0 (better-sqlite3, sync)
const storage = new AgentStorage({ dataDir, mode: 'production' });
storage.createAgent({ slug: 'secretary', ... });
```

**Key differences**:
- No `await` — better-sqlite3 is synchronous
- No `getDb()` — methods directly on storage instance
- No checkpoint timer — WAL mode handles persistence
- No `saveToDisk()` — better-sqlite3 writes directly

## Prerequisites

- Node.js 24+
- pnpm 8+
- better-sqlite3 native dependencies (auto-installed)

## Installation

```bash
# From monorepo root
cd packages/agent-core
pnpm install
```

## Basic Usage

### 1. Import and Initialize

```typescript
import { AgentStorage } from '@myboteam/agent-core/storage';

// Production mode (default)
const storage = new AgentStorage();

// Development mode
const storage = new AgentStorage({ mode: 'development' });

// Test mode (in-memory)
const storage = new AgentStorage({ mode: 'test' });
```

### 2. Create an Agent

```typescript
const agent = storage.createAgent({
  slug: 'secretary',
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  status: 'active'
});

console.log(agent.id); // UUID
```

### 3. Create a Task

```typescript
const task = storage.createTask({
  agent_id: agent.id,
  title: 'Summarize today\'s emails'
});

console.log(task.status); // 'pending'
```

### 4. Add Todo Items

```typescript
const todo = storage.createTaskTodo({
  task_id: task.id,
  description: 'Check inbox for urgent emails'
});

console.log(todo.is_completed); // 0 (number, not boolean)
```

### 5. Update Task Status

```typescript
storage.updateTask(task.id, {
  status: 'running'
});
```

### 6. Query Tasks

```typescript
// List all tasks for an agent
const tasks = storage.listTasks({ agent_id: agent.id });

// List tasks by status
const pendingTasks = storage.listTasks({ status: 'pending' });

// List pinned notes only
const pinnedNotes = storage.listNotes({ pinned: 1 });

// List notes by type
const todos = storage.listNotes({ type: 'checklist' });
```

### 7. Close Connection

```typescript
storage.close();
```

## Test Mode

Test mode uses `:memory:` for zero-disk, zero-cleanup testing:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AgentStorage } from '@myboteam/agent-core/storage';

describe('AgentStorage', () => {
  let storage: AgentStorage;

  beforeEach(() => {
    storage = new AgentStorage({ mode: 'test' });
  });

  afterEach(() => {
    storage.close();
  });

  it('creates and retrieves an agent', () => {
    const agent = storage.createAgent({
      slug: 'test-agent',
      provider: 'openai',
      model: 'gpt-4',
      status: 'active'
    });

    const retrieved = storage.getAgent(agent.id);
    expect(retrieved).toEqual(agent);
  });
});
```

## Development Mode

Development mode uses `myboteam_dev.db` in the data directory:

```bash
# Set custom data directory
export MYBOTEAM_DATA_DIR=/path/to/data

# Run in development mode
const storage = new AgentStorage({ mode: 'development' });
```

## Error Handling

```typescript
import { DatabaseError, NotFoundError, ValidationError } from '@myboteam/agent-core/storage';

try {
  storage.createAgent({
    slug: 'duplicate-slug',  // Will throw ValidationError
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    status: 'active'
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Validation failed: ${error.field}`);
  } else if (error instanceof DatabaseError) {
    console.error(`Database error: ${error.message}`);
  }
}
```

## Document Versioning

```typescript
// Create a document version
const v1 = storage.createDocumentVersion({
  file_path: '/docs/api-design.md',
  content: '## Overview\n...',
  model: 'claude-sonnet-4-20250514',
  version: 1
});

// Update to version 2
const v2 = storage.createDocumentVersion({
  file_path: '/docs/api-design.md',
  content: '## Overview (revised)\n...',
  model: 'claude-sonnet-4-20250514',
  version: 2
});

// List all versions for a file path
const versions = storage.listDocumentVersions({ file_path: '/docs/api-design.md' });
```

## Atomic Operations

Individual CRUD operations are atomic. For multi-operation sequences, better-sqlite3's synchronous API ensures sequential consistency:

```typescript
const agent = storage.createAgent({
  slug: 'accountant',
  provider: 'openai',
  model: 'gpt-4',
  status: 'active'
});

storage.createTask({
  agent_id: agent.id,
  title: 'Reconcile expenses'
});
```

## Seed Data

Production seeding (secretary + accountant agents) runs automatically in non-test mode. To seed manually:

```typescript
// Seed production agents (secretary, accountant)
// Runs automatically in production/development mode constructor
storage.seedProductionData();
```

## Next Steps

- See `specs/003-sqlite-storage-layer/data-model.md` for entity details
- See `specs/003-sqlite-storage-layer/contracts/agent-storage.md` for full API reference
- See `specs/003-sqlite-storage-layer/plan.md` for implementation tasks
