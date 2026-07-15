# Research: Eve Materializer (Runtime File Generation)

## Source Reference Analysis

### v0.3.0 Config Builder (`packages/agent-core/src/opencode/config-builder.ts`)

**Pattern adopted**: Context-based builder with provider-specific sub-builders.

- `buildProviderConfigs()` accepts a context object (`ctx`) with provider settings, API keys, and active model
- Each provider has a dedicated builder function (e.g., `buildOllamaConfig`, `buildGoogleConfig`)
- Results are aggregated: configs collected, enabled providers merged, model overrides applied
- Returns `ProviderConfigResult` with `providerConfigs`, `enabledProviders`, `modelOverride`

**Pattern NOT adopted**: The v0.3.0 builder generates provider-specific config objects for the OpenCode SDK. The M5-2 materializer generates a `provider-config.json` file with provider/model/params metadata — a simpler, serializable representation. The v0.3.0 builder's `getApiKey` callback pattern is not needed since API keys are injected at runtime via BYOKInjector (ADR-006).

### ADR-002 Eve Agent Harness

**Key decisions from ADR-002 relevant to M5-2**:

1. **Materialized files go to `.local-data/agents/{agent-id}/`** — this is the runtime directory path (FR-005)
2. **Files include `instructions.md`** — system prompt + behavioral guidelines
3. **Delegation tool pattern**: orchestrator gets `delegate_to_agent` tool; other agents don't
4. **MCP tools exposed as stubs**: one file per assigned MCP server
5. **Status lifecycle**: `idle → materialized → starting → running → stopped → error`

**Reconciliation with spec**: The spec defines 5 files (`instructions.md`, `tool-catalog.json`, `delegation-policy.json`, `provider-config.json`, `checksums.sha256`). ADR-002 mentions `agent.ts` and `tools/*.ts` files. M5-2 is the first phase — it generates the configuration files that M5-3 (Agent Materialization) will use to create the Eve project files. The `tool-catalog.json` replaces individual `tools/*.ts` files as the intermediate representation.

### ADR-006 LLM Provider Model

**Key decisions from ADR-006 relevant to M5-2**:

1. **Per-agent provider override**: Each agent has optional `provider` and `model` fields
2. **Global default**: One default provider + model for all agents
3. **Key injection at materialization time**: Decrypted keys injected into provider config
4. **`provider-config.json`**: The materializer generates this file with provider name, model, and params (but NOT API keys — those are injected at runtime by BYOKInjector)

## Technology Decisions

### Decision 1: File Generation Approach

**Decision**: Synchronous file writes with atomic cleanup on failure.

**Rationale**:
- Materialization is called explicitly before agent startup (not in a hot path)
- Under 500ms target (SC-001) is easily achievable with synchronous writes for 5 small files
- Atomic cleanup: write to temp location first, then rename on success; on failure, delete temp files

**Alternatives considered**:
- Async file writes with streaming: Unnecessary complexity for 5 small files
- Transactional filesystem (SQLite-backed): Over-engineering for this use case

### Decision 2: Checksum Format

**Decision**: Standard `sha256sum` format — one `hash  filename` pair per line, no file prefix.

**Rationale**:
- Matches standard `sha256sum` output format for easy verification
- Consumers can use standard `sha256sum -c checksums.sha256` to verify
- Simple to generate and parse

**Alternatives considered**:
- JSON manifest: Less standard, harder to verify with CLI tools
- Embedded checksums in file headers: Coupling between files

### Decision 3: Idempotency Strategy

**Decision**: Content-hash comparison — compute SHA-256 of generated content, compare with existing file hash before writing.

**Rationale**:
- Avoids unnecessary file writes (preserves mtime for unchanged files)
- Deterministic: same input always produces same hash
- Works with the "byte-identical output" requirement (SC-002)

**Alternatives considered**:
- Always overwrite: Simpler but changes mtime, breaks incremental tooling
- Mtime-based: Non-deterministic, doesn't guarantee content equality

### Decision 4: Directory Structure

**Decision**: `.local-data/agents/{agent-id}/` — matches ADR-002 convention.

**Rationale**:
- ADR-002 specifies `.local-data/agents/{slug}/` as the materialization target
- Using agent ID (UUID) instead of slug for uniqueness guarantee
- Predictable path derived from agent ID (FR-005)

**Alternatives considered**:
- `{agent-name}/`: Names can change, IDs are stable
- `{agent-id}/{timestamp}/`: Adds complexity, not needed for single-materialization model
