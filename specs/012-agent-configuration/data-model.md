# Data Model: Agent Configuration System

**Date**: 2026-07-11
**Feature**: 012-agent-configuration

## Entities

### AgentConfig

Represents a single agent's configuration. Stored in SQLite `agent_registry` table.

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | No (auto-generated) | Primary key | Unique identifier |
| name | string | Yes | 1-128 chars, regex `^[a-zA-Z0-9 _-]+$`, unique | Agent name |
| description | string | No | Max 512 chars | Agent description |
| role | string | No | Max 256 chars | Agent role description |
| model | string | Yes | Min 1 char | LLM model identifier |
| provider | string | Yes | Min 1 char | LLM provider identifier |
| params | InferenceParams | No | Nested object | LLM inference parameters |
| secrets | string[] | No | Max 50 items | Vault key references |
| skills | string[] | No | Max 50 items | Skill identifiers |
| mcps | string[] | No | Max 10 items | MCP server identifiers |
| created_at | ISO 8601 | Auto | Timestamp | Creation timestamp |
| updated_at | ISO 8601 | Auto | Timestamp | Last update timestamp |

**Validation Rules**:
- Name must be unique across all agents
- Total agents per daemon ≤ 20
- All Zod validation enforced before persistence

---

### InferenceParams

LLM inference tuning parameters. Embedded in AgentConfig as JSON.

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| temperature | number | No | 0-2 | Sampling temperature |
| maxTokens | integer | No | Positive | Maximum tokens to generate |
| topP | number | No | 0-1 | Nucleus sampling |
| stop | string \| string[] | No | — | Stop sequences |
| presencePenalty | number | No | -2 to 2 | Presence penalty |
| frequencyPenalty | number | No | -2 to 2 | Frequency penalty |
| extras | Record<string, unknown> | No | — | Provider-specific parameters |

**Validation Rules**:
- All numeric fields validated for range
- Missing fields use provider defaults

---

### AgentStatus

Enum representing agent lifecycle state. Aligned with ADR-002.

| Value | Description | Valid Transitions |
|-------|-------------|-------------------|
| idle | Agent registered, not materialized | → materialized |
| materialized | Eve files generated on disk | → starting |
| starting | Agent process launching | → running |
| running | Agent actively processing | → stopped, → error |
| stopped | Agent process terminated normally | — |
| error | Agent encountered an error | → idle |

**Transition Map**:
```typescript
const VALID_TRANSITIONS: Record<AgentStatus, AgentStatus[]> = {
  idle: ['materialized'],
  materialized: ['starting'],
  starting: ['running'],
  running: ['stopped', 'error'],
  stopped: [],
  error: ['idle'],
};
```

---

### AgentRecord

Runtime representation extending AgentConfig. Used by AgentRegistry.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| id | UUID | AgentConfig | Unique identifier |
| name | string | AgentConfig | Agent name |
| role | string | AgentConfig | Agent role |
| description | string | AgentConfig | Agent description |
| capabilities | string[] | AgentRegistry | Registered capabilities |
| status | AgentStatus | AgentRegistry | Current lifecycle state |
| metadata | Record<string, unknown> | AgentRegistry | Runtime metadata |
| secrets | string[] | AgentConfig | Vault key references |
| skills | string[] | AgentConfig | Skill identifiers |
| mcpServers | string[] | AgentConfig | MCP server identifiers |
| provider | { id: string; model: string } | AgentConfig | LLM provider config |
| resourceLimits | { maxTokens: number; timeoutMs: number; maxMemoryEntries: number } | AgentRegistry | Resource constraints |
| last_seen_at | ISO 8601 | AgentRegistry | Last activity timestamp |
| created_at | ISO 8601 | AgentConfig | Creation timestamp |
| updated_at | ISO 8601 | AgentConfig | Last update timestamp |

---

## Relationships

```
AgentConfig (1) ──── (1) InferenceParams
     │
     │ referenced by
     ▼
AgentRecord (extends AgentConfig)
     │
     │ managed by
     ▼
AgentRegistry (CRUD operations)
     │
     │ stored in
     ▼
SQLite agent_registry table
```

## Default Configurations

| Name | Role | Model | Provider |
|------|------|-------|----------|
| orchestrator | Coordinates agent activity | TBD | TBD |
| secretary | Manages scheduling and notes | TBD | TBD |
| accountant | Handles resource tracking and reporting | TBD | TBD |

*Note: Default model/provider values to be determined during implementation based on ADR-006 provider availability.*
