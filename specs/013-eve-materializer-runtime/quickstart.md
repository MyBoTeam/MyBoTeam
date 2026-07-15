# Quickstart: Eve Materializer

## Prerequisites

- M5-1 (Agent Configuration) complete — agents registered in AgentRegistry
- Node.js with `crypto` module available (built-in)
- Write access to `.local-data/agents/` directory

## Usage

### Materialize an Agent

```typescript
import { materialize } from '@myboteam/agent-core/eve/materializer.js';
import { AgentRegistry } from '@myboteam/agent-core/agent-registry.js';
import type { ToolCatalogEntry } from '@myboteam/agent-core/eve/runtime-files.js';

const registry = new AgentRegistry(db);
const agent = registry.getById('agent-uuid-123');

// Materialize — generates 5 files under .local-data/agents/{agent-id}/
const result = await materialize(agent, {
  baseDir: '.local-data/agents',     // base directory
  availableTools: tools as ToolCatalogEntry[], // available tools
});

console.log(result.agentName);      // 'orchestrator'
console.log(result.filesGenerated); // ['instructions.md', 'tool-catalog.json', ...]
console.log(result.durationMs);     // < 500ms
```

### Dematerialize an Agent

```typescript
import { dematerialize } from '@myboteam/agent-core/eve/materializer.js';

await dematerialize(agent.id, '.local-data/agents');

// Files are removed from .local-data/agents/{agent-id}/
```

### Verify Materialized Output

```bash
# Check files exist
ls .local-data/agents/{agent-id}/

# Verify checksums
cd .local-data/agents/{agent-id}/
sha256sum -c checksums.sha256
# Expected output:
# instructions.md: OK
# tool-catalog.json: OK
# delegation-policy.json: OK (if present)
# provider-config.json: OK
```

## Idempotency

Materializing the same agent twice with the same config produces byte-identical output:

```typescript
const result1 = await materialize(agent, opts);
const result2 = await materialize(agent, opts);

// result1.agentName === 'orchestrator'
// result2.agentName === 'orchestrator' (no-op, silent success)
// Files are identical — checksums match
```

## Error Handling

```typescript
try {
  await materialize(invalidAgent, opts);
} catch (error) {
  // ValidationError: Agent config validation failed
  // DiskError: Failed to write materialized files
  // Agent is left in 'idle' status, no partial files on disk
}
```

## Testing

```bash
# Run materializer unit tests
cd packages/agent-core
npx vitest run tests/unit/eve/

# Run with coverage
npx vitest run --coverage tests/unit/eve/
```

## File Output Example

For an agent named "Orchestrator" with role "coordinator" and skills ["web-search"]:

```
.local-data/agents/550e8400-e29b-41d4-a716-446655440000/
├── instructions.md          # Profile + role + capabilities
├── tool-catalog.json        # [{ name: "web-search", ... }]
├── provider-config.json     # { provider: "anthropic", model: "claude-3-sonnet" }
└── checksums.sha256         # SHA-256 hashes of all files above
```
