# Feature Specification: Eve Materializer (Runtime File Generation)

**Feature Branch**: `013-eve-materializer-runtime`

**Created**: 2026-07-15

**Status**: Draft

**Input**: User description: "I want address https://linear.app/maor-innovations-ltd/issue/MAO-158/m5-2-eve-materializer-runtime-file-generation"

**Goal**: Build the Eve materializer that generates deterministic runtime files from agent configuration, injecting agent profile, tool catalog, and delegation policy into instructions.

**Success Criteria**:
- Materializer generates runtime files from agent config
- Agent profile injected into instructions
- Tool catalog filtered per agent
- Delegation policy included

**Constraints**:
- Blocked by M5-1 (Agent Configuration)
- Blocking M5-3, M5-5
- Source reference: v0.3.0 config-builder
- Unit tests required for materialization output

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Materialize Agent Runtime Files (Priority: P1)

As a system operator, I want the daemon to generate deterministic runtime files from a registered agent's configuration so that the agent can start with the correct profile, tool catalog, and delegation policy baked into its instructions.

**Why this priority**: This is the foundational capability of the Eve materializer. Without runtime file generation, agents cannot transition from "registered" to "materialized" and cannot be started. This is the critical path for the entire M5 Agent Runtime milestone.

**Independent Test**: Can be fully tested by registering an agent with a complete configuration, invoking the materializer, and verifying that the expected runtime files are written to disk with correct content. Delivers the ability to prepare any agent for execution.

**Acceptance Scenarios**:

1. **Given** a registered agent with name, model, provider, and role, **When** the operator explicitly invokes materialization, **Then** a runtime directory is created under the agent's data directory containing individual files: `instructions.md`, `tool-catalog.json`, `delegation-policy.json`, `provider-config.json`, and `checksums.sha256`.
2. **Given** a registered agent with skills and MCP server references, **When** the materializer is invoked, **Then** the runtime files reflect only the tools and skills assigned to that specific agent.
3. **Given** an agent that has already been materialized, **When** the materializer is invoked again with the same config, **Then** the operation succeeds silently (no-op), the agent remains in `materialized` status, and output files are byte-identical.
4. **Given** an agent that has already been materialized, **When** the materializer is invoked again with changed config, **Then** the output files are updated to reflect the new configuration and a new checksum manifest is generated.

---

### User Story 2 - Agent Profile Injection into Instructions (Priority: P1)

As a system operator, I want the agent's profile (name, role, description) injected into the generated instruction files so that the LLM receives consistent identity context in every conversation.

**Why this priority**: The agent profile is the primary mechanism for giving an agent its identity. Without it, the LLM has no context about who it is or what it should do. This is co-dependent with Story 1.

**Independent Test**: Can be tested by materializing an agent with a specific profile (name, role, description) and verifying the generated instruction file contains those fields in a structured format.

**Acceptance Scenarios**:

1. **Given** an agent with name "Orchestrator", role "Task coordinator", **When** materialization completes, **Then** the generated instructions file contains the agent name, role, and description in a clearly delineated section.
2. **Given** an agent with a custom system prompt, **When** materialization completes, **Then** the custom prompt is incorporated alongside the profile metadata.
3. **Given** an agent with no custom system prompt, **When** materialization completes, **Then** a default instruction template is generated from the agent's role and description.

---

### User Story 3 - Tool Catalog Filtering Per Agent (Priority: P2)

As a system operator, I want the materializer to generate a tool catalog that includes only the tools relevant to a specific agent (based on its skills and MCP configuration) so that the LLM receives a focused, non-overwhelming set of available tools.

**Why this priority**: Tool catalog filtering reduces token usage and prevents agent confusion from irrelevant tools. Important for efficiency but the system works without it (agents just get all tools).

**Independent Test**: Can be tested by materializing two agents with different skill sets and verifying each receives only its assigned tools in the generated catalog file.

**Acceptance Scenarios**:

1. **Given** an agent with skills ["web-search", "file-read"], **When** materialization completes, **Then** the tool catalog file contains only those tools plus any base tools always available.
2. **Given** an agent with no skills configured, **When** materialization completes, **Then** the tool catalog contains only the base/default tools.
3. **Given** an agent with MCP server references, **When** materialization completes, **Then** tools from those MCP servers appear in the catalog if the servers are reachable.

---

### User Story 4 - Delegation Policy Inclusion (Priority: P2)

As a system operator, I want the materializer to include delegation policies in the runtime files so that agents know which tasks they can delegate to other agents and under what conditions.

**Why this priority**: Delegation enables multi-agent coordination. Without it, agents operate in isolation. Important for the orchestrator agent but not required for single-agent operation.

**Independent Test**: Can be tested by materializing an orchestrator agent with delegation rules and verifying the delegation policy section appears in the generated instructions.

**Acceptance Scenarios**:

1. **Given** an agent with delegation rules (e.g., "can delegate to secretary for scheduling"), **When** materialization completes, **Then** a `delegation-policy.json` file is generated containing the delegation rules as structured JSON. The instructions file may reference the delegation policy but the rules themselves are in the separate JSON file.
2. **Given** an agent with no delegation rules, **When** materialization completes, **Then** no delegation policy section is included (or an empty section is generated).
3. **Given** an agent with circular delegation references, **When** materialization is attempted, **Then** the materializer detects the cycle and returns a validation error without writing files.

---

### Edge Cases

- What happens when the agent config references a skill that does not exist in the skill registry? The materializer should log a warning and omit the missing skill from the catalog rather than failing.
- What happens when the agent config references an MCP server that is not configured? The materializer should include the MCP reference in the catalog with a status indicator showing it is unavailable.
- What happens when the target runtime directory already contains files from a previous materialization? The materializer should overwrite them (idempotent behavior).
- What happens when the agent config is incomplete (missing required fields like model or provider)? The materializer should reject the config with a clear validation error.
- What happens when disk write fails mid-materialization? The materializer should clean up partial files and return an error, leaving the previous materialized state intact if it existed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate five individual runtime files from a validated agent configuration: `instructions.md`, `tool-catalog.json`, `delegation-policy.json`, `provider-config.json`, and `checksums.sha256`.
- **FR-002**: System MUST inject agent profile metadata (name, role, description, system prompt) into `instructions.md`.
- **FR-003**: System MUST filter `tool-catalog.json` to include only tools assigned to the specific agent via its skills and MCP configuration.
- **FR-004**: System MUST generate `delegation-policy.json` as a separate JSON file when the agent has delegation rules configured; omit the file entirely when no rules exist.
- **FR-005**: System MUST write materialized files to a predictable directory path derived from the agent's ID.
- **FR-006**: System MUST be idempotent — materializing the same config twice produces byte-identical output files and succeeds silently (no-op, status remains `materialized`).
- **FR-007**: System MUST transition the agent's status to `materialized` upon successful file generation.
- **FR-008**: System MUST validate the agent configuration before materialization and reject invalid configs with descriptive errors.
- **FR-009**: System MUST clean up partial output on failure, preserving any previously materialized state.
- **FR-010**: System MUST provide a `dematerialize` operation that removes generated runtime files and resets agent status to `idle`.
- **FR-011**: System MUST generate `checksums.sha256` containing SHA-256 hashes of all other generated files for integrity verification.

### Key Entities

- **AgentConfig**: The validated configuration for an agent, including name, role, model, provider, skills, MCP references, delegation rules, and inference parameters.
- **MaterializedAgent**: The runtime representation of an agent after materialization, consisting of a directory containing five individual files: `instructions.md`, `tool-catalog.json`, `delegation-policy.json`, `provider-config.json`, and `checksums.sha256`.
- **AgentInstructions** (`instructions.md`): The generated instruction file containing the agent's profile, behavioral guidelines, and available capabilities. Format: Markdown.
- **ToolCatalog** (`tool-catalog.json`): The filtered set of tools available to a specific agent, derived from the global tool registry and the agent's skill/MCP assignments. Format: JSON.
- **DelegationPolicy** (`delegation-policy.json`): Separate JSON file containing rules defining which other agents this agent can delegate tasks to, and under what conditions. Omitted when no delegation rules are configured.
- **ProviderConfig** (`provider-config.json`): The provider-specific configuration for the agent's LLM backend. Format: JSON.
- **ChecksumManifest** (`checksums.sha256`): SHA-256 hashes of all generated files for integrity verification and idempotency validation. Format: JSON object mapping filenames to hex-encoded SHA-256 hashes (e.g., `{ "instructions.md": "abc123..." }`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Materializing a standard agent configuration completes in under 500ms.
- **SC-002**: Materializing the same configuration twice produces byte-identical output files.
- **SC-003**: The generated instruction file correctly contains 100% of the agent's profile fields (name, role, description).
- **SC-004**: The tool catalog contains exactly the tools assigned to the agent — no more, no less — verified across 5 different agent configurations with varying skill sets.
- **SC-005**: Agents transition through the status lifecycle (idle → materialized → starting → running) without manual intervention after materialization.
- **SC-006**: Materialization failure leaves no orphan files on disk when no previous materialized state existed.

## Assumptions

- M5-1 (Agent Configuration) is complete — agent configurations are persisted and queryable by ID.
- A defined agent status lifecycle exists with a `materialized` state between `idle` and `starting`.
- A global tool registry exists that the materializer can query to resolve tool definitions for the catalog.
- The materializer operates within the daemon process, not as a separate service.
- Delegation policies are stored as part of the agent configuration, not as a separate system.
- The runtime file format is individual files: Markdown for instructions, JSON for catalog/policy/config, and SHA-256 checksums for integrity.
- The materializer does not need to handle concurrent materialization of the same agent.
- The daemon enforces serialization of operations on a per-agent basis.

## Implementation Notes

### Deferred to M5-1

- **FR-007 Status Transition**: Agent status transition to `materialized` is deferred until M5-1 integrates AgentRegistry. The materializer generates files but does not call `AgentRegistry.setStatus()`.
- **FR-009 Partial Failure Cleanup**: Cleanup on failure is implemented (removes partial files), but preserving previous materialized state requires M5-1 status tracking.

### Design Decisions

- **Directory Naming**: Module uses `eve/` directory (after ADR-002 Eve Agent Harness) instead of generic `materializer/`.
- **Checksum Format**: `checksums.sha256` uses JSON object format `{ "filename": "hash" }` instead of text format (`hash  filename`) for easier programmatic parsing.
- **Output Path Fallback**: When `agent.id` is undefined, output path falls back to agent name. This is expected for newly registered agents before M5-1 assigns UUIDs.
- **Template Engine**: Instruction template generation is inlined in `file-writers.ts` as `generateInstructionsTemplate()` rather than a separate module, reducing file count while maintaining single-responsibility.

## Clarifications

### Session 2026-07-15

- Q: What specific files does the materializer generate, and in what format? → A: Individual files per concern (instructions.md, tool-catalog.json, delegation-policy.json, provider-config.json) plus checksums.sha256.
- Q: When does materialization happen — is it explicit or automatic? → A: Explicit — operator or daemon explicitly invokes materialize before starting an agent.
- Q: Should the materialized output include a checksum or hash for each generated file? → A: Yes — include a checksums.sha256 manifest alongside the generated files.
- Q: When an agent is already materialized and materialization is called again with the same config, should it silently succeed or return a status? → A: Silent success — return materialized status, no error, files unchanged (no-op).
