# Quickstart: Agent Configuration System

**Date**: 2026-07-11
**Feature**: 012-agent-configuration

## Overview

The Agent Configuration System provides type definitions, validation, persistence, and lifecycle management for agent configurations in the MyBotTeam daemon.

## Prerequisites

- Node.js 18+ installed
- pnpm installed
- SQLite database initialized (M1-4/M2-1)
- Zod dependency available

## Setup

```bash
# Install dependencies
pnpm install

# Verify Zod is available
pnpm list zod
```

## Key Files

| File | Purpose |
|------|---------|
| `packages/types/src/agent-config.ts` | AgentConfigSchema, InferenceParamsSchema |
| `packages/types/src/agent-status.ts` | AgentStatus enum, VALID_TRANSITIONS |
| `packages/agent-core/src/agent-registry.ts` | AgentRegistry CRUD class |
| `packages/agent-core/src/agent-defaults.ts` | Default agent configurations |

## Usage

### Create an Agent Configuration

```typescript
import { AgentConfigSchema } from '@myboteam/types';

const config = AgentConfigSchema.parse({
  name: 'my-agent',
  model: 'gpt-4',
  provider: 'openai',
  role: 'General assistant',
  params: { temperature: 0.7 },
});
```

### Register an Agent

```typescript
import { AgentRegistry } from '@myboteam/agent-core';

const registry = new AgentRegistry(db);
const agent = registry.register({
  name: 'my-agent',
  model: 'gpt-4',
  provider: 'openai',
  role: 'worker',
});
```

### Update Agent Status

```typescript
// Valid: idle → materialized
registry.setStatus(agent.id, 'materialized');

// Invalid: idle → running (rejected)
registry.setStatus(agent.id, 'running'); // throws Error
```

### Load Default Agents

```typescript
import { DEFAULT_AGENTS } from '@myboteam/agent-core';

// Returns orchestrator, secretary, accountant configs
for (const config of DEFAULT_AGENTS) {
  registry.register(config);
}
```

## Validation

All configurations are validated via Zod before persistence:

```typescript
import { AgentConfigSchema } from '@myboteam/types';

// Throws ZodError if invalid
const result = AgentConfigSchema.safeParse(invalidConfig);
if (!result.success) {
  console.error(result.error.issues);
}
```

## Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm vitest run packages/agent-core/tests/unit/agent-config.test.ts

# Run with coverage
pnpm vitest run --coverage
```

## Common Patterns

### Capacity Check

```typescript
const count = registry.list().length;
if (count >= 20) {
  throw new Error('Agent capacity reached (20 maximum)');
}
```

### Audit Logging

```typescript
// Automatically logged on create/update/delete
registry.register({ name: 'agent-1', model: 'gpt-4', provider: 'openai' });
// Audit: { id: 'uuid', operation: 'register', timestamp: 'ISO-8601' }
```

### Status Transition Validation

```typescript
import { VALID_TRANSITIONS, AgentStatus } from '@myboteam/types';

function canTransition(from: AgentStatus, to: AgentStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| `AgentNotFound` | ID doesn't exist in registry | Verify agent was registered |
| `Invalid status: X` | Status value not in enum | Use one of: idle, materialized, starting, running, stopped, error |
| `Invalid transition: X → Y` | Transition not in VALID_TRANSITIONS | Check state machine diagram |
| `Agent capacity reached` | 20 agents already registered | Delete unused agents first |
| `Name must be unique` | Duplicate agent name | Choose a different name |
