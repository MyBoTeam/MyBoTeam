# Feature Specification: Agent Configuration System

**Feature Branch**: `012-agent-configuration`

**Created**: 2026-07-11

**Status**: Draft

**Input**: Linear issue MAO-157 — M5-1: Agent configuration system

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Define Agent Configuration (Priority: P1)

As a system operator, I want to define agent configurations with required fields (name, model, provider) and optional fields (role, inference parameters, secrets, skills, MCPs) so that the daemon can instantiate agents with the correct settings at startup.

**Why this priority**: This is the foundation for all agent runtime functionality. Without a validated configuration type, no agents can be registered or managed.

**Independent Test**: Can be fully tested by creating AgentConfig objects with valid and invalid data, verifying validation rejects malformed configs and accepts well-formed ones.

**Acceptance Scenarios**:

1. **Given** a valid agent configuration with all required fields, **When** the configuration is validated, **Then** validation passes and the typed config is returned
2. **Given** a configuration missing the required "name" field, **When** validation is attempted, **Then** a validation error is returned indicating the missing field
3. **Given** a configuration with a name containing special characters outside the allowed set, **When** validation is attempted, **Then** a validation error is returned with the allowed character set
4. **Given** a configuration with inference parameters (temperature, maxTokens, topP), **When** the config is validated, **Then** parameters within bounds are accepted and out-of-bounds values are rejected

---

### User Story 2 - Default Agent Configurations (Priority: P1)

As a system operator, I want the system to ship with three default agent configurations (orchestrator, secretary, accountant) so that the daemon starts with a functional set of agents without manual configuration.

**Why this priority**: The daemon must be operational out-of-the-box. Default configurations ensure immediate functionality after installation.

**Independent Test**: Can be tested by loading default configurations and verifying each has the expected name, role, model, and provider values.

**Acceptance Scenarios**:

1. **Given** the daemon starts for the first time with no existing agent configs, **When** the system initializes, **Then** three default agents (orchestrator, secretary, accountant) are loaded into the registry
2. **Given** an existing agent configuration with custom overrides, **When** the daemon starts, **Then** the custom configuration is preserved and defaults are not re-applied
3. **Given** a default agent configuration, **When** inspected, **Then** each agent has a valid name, role, model, and provider

---

### User Story 3 - Persist and Load Configurations from SQLite (Priority: P2)

As a system operator, I want agent configurations to be persisted in SQLite so that configuration changes survive daemon restarts and agents are restored to their last-known state.

**Why this priority**: Persistence ensures configuration durability. Without it, every restart would require re-configuring agents.

**Independent Test**: Can be tested by creating a config, restarting the persistence layer, and verifying the config is restored correctly.

**Acceptance Scenarios**:

1. **Given** a new agent configuration is created, **When** it is saved to SQLite, **Then** the configuration is retrievable by ID with all fields intact
2. **Given** an agent configuration exists in SQLite, **When** the daemon starts, **Then** all configurations are loaded and available for registration
3. **Given** an agent configuration is updated, **When** the update is saved, **Then** the previous version is replaced and the new version is returned on subsequent reads
4. **Given** an agent configuration is deleted, **When** the deletion is committed, **Then** the configuration is no longer retrievable

---

### User Story 4 - Validate Configuration Changes (Priority: P2)

As a system operator, I want configuration updates to be validated before being applied so that invalid configurations never reach the database.

**Why this priority**: Validation at the boundary prevents data corruption and ensures all persisted configs are valid.

**Independent Test**: Can be tested by attempting to update a config with invalid data and verifying the update is rejected while the original config remains unchanged.

**Acceptance Scenarios**:

1. **Given** an existing valid agent configuration, **When** an update with an invalid model name (empty string) is attempted, **Then** the update is rejected and the original config is preserved
2. **Given** an existing agent configuration, **When** a valid update is applied, **Then** the updated config is returned with the new values and unchanged fields are preserved

---

### User Story 5 - Agent Status State Machine (Priority: P2)

As a system operator, I want the agent status to follow a defined state machine so that status transitions are predictable and invalid transitions are rejected.

**Why this priority**: Defined state transitions prevent agents from entering invalid states and enable reliable runtime behavior.

**Independent Test**: Can be tested by attempting all valid and invalid status transitions and verifying the state machine enforces correct transitions.

**Acceptance Scenarios**:

1. **Given** an agent in "idle" status, **When** the agent is materialized by Eve, **Then** the status transitions to "materialized"
2. **Given** an agent in "materialized" status, **When** the agent process starts, **Then** the status transitions to "starting"
3. **Given** an agent in "starting" status, **When** the agent process is ready, **Then** the status transitions to "running"
4. **Given** an agent in "running" status, **When** the agent process stops, **Then** the status transitions to "stopped"
5. **Given** an agent in "running" status, **When** an error occurs, **Then** the status transitions to "error"
6. **Given** an agent in "error" status, **When** the error is resolved, **Then** the status transitions to "idle"
7. **Given** an agent in any status, **When** an invalid transition is attempted, **Then** the transition is rejected

---

### Edge Cases

- What happens when two agents have the same name? Names MUST be unique within the registry
- What happens when the SQLite database is corrupted? The system MUST fail to start with a clear error message
- What happens when a configuration references a non-existent skill or MCP? The config is accepted but a warning is logged at registration time
- What happens when inference parameters are partially provided? Missing optional parameters use provider defaults
- What happens when the secrets array exceeds 50 entries? Validation rejects the configuration
- What happens when the registry reaches 20 agents? New agent creation is rejected with a capacity error

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST define an AgentConfig type with fields: id (UUID, optional on create), name (string, 1-128 chars, alphanumeric with hyphens/underscores/spaces), description (string, optional, max 512 chars), role (string, optional, max 256 chars), model (string, required), provider (string, required), params (inference parameters, optional), secrets (string array, optional, max 50), skills (string array, optional, max 50), mcps (string array, optional, max 10)
- **FR-002**: System MUST define an InferenceParams type with fields: temperature (0-2, optional), maxTokens (positive integer, optional), topP (0-1, optional), stop (string or string array, optional), presencePenalty (-2 to 2, optional), frequencyPenalty (-2 to 2, optional), extras (record of unknown values, optional)
- **FR-003**: System MUST validate all agent configurations using Zod schemas before persistence
- **FR-004**: System MUST provide three default agent configurations: orchestrator (coordinates agent activity), secretary (manages scheduling and notes), accountant (handles resource tracking and reporting)
- **FR-005**: System MUST persist agent configurations in SQLite with CRUD operations (create, read, update, delete), enforcing a maximum of 20 agents per daemon instance
- **FR-006**: System MUST load all agent configurations from SQLite on daemon startup
- **FR-007**: System MUST enforce unique agent names within the registry
- **FR-008**: System MUST reject configuration updates that fail validation, preserving the existing valid configuration
- **FR-009**: System MUST generate a UUID for new agent configurations when no ID is provided
- **FR-010**: System MUST track created_at and updated_at timestamps for all configurations
- **FR-011**: System MUST define an AgentStatus type with exactly six values: `idle`, `materialized`, `starting`, `running`, `stopped`, `error` (aligned with ADR-002)
- **FR-012**: System MUST enforce valid status transitions: idle→materialized, materialized→starting, starting→running, running→stopped, running→error, error→idle. All other transitions MUST be rejected with an error (aligned with ADR-002)
- **FR-013**: System MUST log a structured audit entry for every configuration mutation (create, update, delete) containing: config ID, operation type, and timestamp

### Key Entities

- **AgentConfig**: Represents a single agent's configuration. Key attributes: id, name, role, model, provider, params (inference parameters), secrets, skills, mcps. Relationships: referenced by AgentRecord during registration
- **InferenceParams**: LLM inference tuning parameters associated with an AgentConfig. Key attributes: temperature, maxTokens, topP, stop, presencePenalty, frequencyPenalty, extras
- **AgentRecord**: Runtime representation of a registered agent (extends AgentConfig with status, capabilities, metadata, and lifecycle timestamps). Referenced by AgentRegistry for CRUD operations
- **AgentStatus**: Enum with six values — `idle`, `materialized`, `starting`, `running`, `stopped`, `error`. Transitions are governed by the state machine defined in FR-012 (aligned with ADR-002)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All three default agents (orchestrator, secretary, accountant) are available within 1 second of daemon startup
- **SC-002**: Configuration validation rejects 100% of malformed inputs (missing required fields, out-of-range values, invalid characters)
- **SC-003**: Agent configurations persist across daemon restarts with zero data loss
- **SC-004**: Unit tests achieve 100% code coverage for validation logic and CRUD operations
- **SC-005**: Configuration updates are applied atomically — partial updates never leave the database in an inconsistent state
- **SC-006**: Invalid status transitions are rejected 100% of the time (no agent enters an undefined state)

## Assumptions

- The SQLite database is already initialized by a prior milestone (M1-4 or M2-1) and available to this feature
- The `agent_registry` table schema already exists with columns for all AgentConfig fields
- Agent names are unique within a single daemon instance (no cross-daemon uniqueness required)
- The Zod validation library is already a project dependency
- Default agent configurations are constants defined in code, not external configuration files
- The secrets field stores references (keys) to the vault, not actual secret values
- No authentication or authorization is required for configuration operations — the local daemon trusts process-level access via Unix socket

## Clarifications

### Session 2026-07-11

- Q: What is the maximum number of agents the system must support in a single daemon instance? → A: 20 agents maximum
- Q: Should this spec define the AgentRecord status state machine? → A: Yes — adopt ADR-002's 6-state lifecycle (idle, materialized, starting, running, stopped, error) as canonical
- Q: How should agent configuration access be controlled? → A: No access control — local daemon with process-level trust via Unix socket
- Q: What logging is required when agent configurations are created, updated, or deleted? → A: Structured audit log: config ID, operation (create/update/delete), timestamp
- Q: Should the spec include an explicit out-of-scope section? → A: No — Requirements and Assumptions sections are sufficient
