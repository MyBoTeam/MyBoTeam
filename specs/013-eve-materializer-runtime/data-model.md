# Data Model: Eve Materializer

## Materialized Runtime Files

The materializer generates five files per agent under `.local-data/agents/{agent-id}/`:

### 1. `instructions.md` (Markdown)

The agent's system prompt and behavioral guidelines.

```markdown
# Agent: {name}

## Role
{role}

## Description
{description}

## Instructions
{custom system prompt OR default template generated from role + description}

## Delegation Policy
{included only when delegation rules exist}
- Can delegate to: {target agent name} for {condition}
- Can delegate to: {target agent name} for {condition}
```

### 2. `tool-catalog.json` (JSON)

Filtered set of tools available to this agent.

```json
{
  "agentId": "uuid",
  "generatedAt": "ISO-8601",
  "tools": [
    {
      "name": "tool-name",
      "description": "Tool description",
      "parameters": {
        "param-name": {
          "type": "string",
          "description": "Param description",
          "required": true
        }
      },
      "source": "skill:mcp-server-name | skill:skill-name | base"
    }
  ],
  "mcpServers": [
    {
      "name": "server-name",
      "status": "available | unavailable",
      "toolCount": 3
    }
  ]
}
```

### 3. `delegation-policy.json` (JSON)

Rules for inter-agent delegation. Omitted when no delegation rules are configured.

```json
{
  "agentId": "uuid",
  "generatedAt": "ISO-8601",
  "delegations": [
    {
      "targetAgent": "target-agent-name",
      "conditions": ["scheduling", "calendar"],
      "maxDepth": 1
    }
  ]
}
```

### 4. `provider-config.json` (JSON)

Provider and model configuration for the agent's LLM backend. Does NOT include API keys (injected at runtime by BYOKInjector per ADR-006).

```json
{
  "agentId": "uuid",
  "generatedAt": "ISO-8601",
  "provider": "anthropic",
  "model": "claude-3-sonnet",
  "params": {
    "temperature": 0.7,
    "maxTokens": 4096
  }
}
```

### 5. `checksums.sha256` (text)

SHA-256 hashes of all generated files for integrity verification.

```
a1b2c3d4e5f6...  instructions.md
f6e5d4c3b2a1...  tool-catalog.json
1a2b3c4d5e6f...  delegation-policy.json
6f5e4d3c2b1a...  provider-config.json
```

## State Transitions

```
idle ──materialize()──→ materialized ──start()──→ starting ──→ running
  ↑                        │
  │                        └──dematerialize()──→ idle
  │
  └──error (on materialize failure) ──→ idle
```

- `idle → materialized`: Materialization succeeds, files written to disk
- `materialized → idle`: Dematerialization succeeds, files removed from disk
- `idle → error`: Materialization fails (validation error, disk error, etc.)
- `error → idle`: Agent reset after error

## Directory Layout

```
.local-data/agents/
├── {agent-id-1}/
│   ├── instructions.md
│   ├── tool-catalog.json
│   ├── delegation-policy.json
│   ├── provider-config.json
│   └── checksums.sha256
├── {agent-id-2}/
│   ├── instructions.md
│   ├── tool-catalog.json
│   ├── provider-config.json
│   └── checksums.sha256
│   # (no delegation-policy.json — agent has no delegation rules)
```

## Validation Rules

| Field | Rule | Source |
|-------|------|--------|
| `agentId` | Must be valid UUID | AgentConfigSchema.id |
| `generatedAt` | Must be ISO-8601 datetime | Materialization timestamp |
| `provider` | Must match agent's provider field | AgentConfigSchema.provider |
| `model` | Must match agent's model field | AgentConfigSchema.model |
| `tools` | Must be subset of global tool registry filtered by agent skills/MCP | FR-003 |
| `delegations` | Must not contain cycles | FR-004, acceptance scenario 3 |
| Checksums | SHA-256 of each file must match actual file content | FR-011 |
