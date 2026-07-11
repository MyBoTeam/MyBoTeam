# Interface Contract: Agent Configuration System

**Date**: 2026-07-11
**Feature**: 012-agent-configuration

## TypeScript Interfaces

### AgentConfigSchema (Zod)

```typescript
const AgentConfigSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string()
    .min(1)
    .max(128)
    .regex(/^[a-zA-Z0-9 _-]+$/, 'Name must be alphanumeric with hyphens, underscores, spaces'),
  description: z.string().max(512).optional(),
  role: z.string().max(256).optional(),
  model: z.string().min(1),
  provider: z.string().min(1),
  params: InferenceParamsSchema.optional(),
  secrets: z.array(z.string().min(1)).max(50).optional().default([]),
  skills: z.array(z.string().min(1)).max(50).optional().default([]),
  mcps: z.array(z.string().min(1)).max(10).optional().default([]),
}).strict();
```

### InferenceParamsSchema (Zod)

```typescript
const InferenceParamsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  extras: z.record(z.string(), z.unknown()).optional(),
});
```

### AgentStatus (Enum)

```typescript
type AgentStatus = 'idle' | 'materialized' | 'starting' | 'running' | 'stopped' | 'error';

const VALID_TRANSITIONS: Record<AgentStatus, AgentStatus[]> = {
  idle: ['materialized'],
  materialized: ['starting'],
  starting: ['running'],
  running: ['stopped', 'error'],
  stopped: [],
  error: ['idle'],
};
```

### AgentRegistry (Class Interface)

```typescript
class AgentRegistry {
  constructor(db: DatabaseService);

  // CRUD Operations
  register(
    name: string,
    capabilities: string[],
    metadata?: Record<string, unknown>,
    role?: AgentRecord['role'],
    description?: string,
    secrets?: string[],
    skills?: string[],
    mcpServers?: string[],
    provider?: { id: string; model: string },
    resourceLimits?: { maxTokens: number; timeoutMs: number; maxMemoryEntries: number },
  ): AgentRecord;

  list(status?: AgentStatus): AgentRecord[];
  getById(id: string): AgentRecord | undefined;
  update(id: string, updates: Partial<Pick<AgentRecord, 'name' | 'description' | 'capabilities' | 'secrets' | 'skills' | 'mcpServers' | 'provider' | 'resourceLimits' | 'metadata'>>): AgentRecord;
  delete(id: string): void;

  // Status Management
  setStatus(agentId: string, newStatus: AgentStatus): void;

  // Capacity
  getCount(): number;
  MAX_AGENTS: 20;
}
```

## Error Types

| Error | Condition | Message |
|-------|-----------|---------|
| `AgentNotFound` | ID doesn't exist in registry | `AgentNotFound` |
| `InvalidStatus` | Status value not in enum | `Invalid status: {status}` |
| `InvalidTransition` | Transition not in VALID_TRANSITIONS | `Invalid transition: {from} -> {to}` |
| `DuplicateName` | Name already exists | `Agent name already exists: {name}` |
| `CapacityReached` | 20 agents already registered | `Agent capacity reached (20 maximum)` |
| `ValidationError` | Zod validation failed | ZodError with issues array |

## Audit Log Format

```typescript
interface AuditEntry {
  id: string;        // Agent config ID
  operation: 'create' | 'update' | 'delete';
  timestamp: string; // ISO 8601
}
```

## SQLite Schema (Expected)

```sql
CREATE TABLE agent_registry (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  capabilities TEXT,  -- JSON array
  status TEXT NOT NULL DEFAULT 'idle',
  role TEXT,
  config_json TEXT,   -- JSON object
  metadata TEXT,      -- JSON object
  secrets TEXT,       -- JSON array
  skills TEXT,        -- JSON array
  mcp_servers TEXT,   -- JSON array
  provider TEXT,      -- JSON object
  resource_limits TEXT, -- JSON object
  last_seen_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```
