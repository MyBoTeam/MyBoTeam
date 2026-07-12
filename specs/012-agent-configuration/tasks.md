# Tasks: Agent Configuration System

**Input**: Design documents from `/specs/012-agent-configuration/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: Enabled — SC-004 requires 100% code coverage for validation logic and CRUD operations.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [SYNC/ASYNC] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[SYNC]**: Requires human review (complex logic, security-critical)
- **[ASYNC]**: Can be delegated to async agents (well-defined, low-risk)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and shared type definitions

- [x] T001 [P] [ASYNC] Verify Zod dependency is installed in packages/types via `pnpm list zod` in packages/types
- [x] T002 [P] [ASYNC] Verify better-sqlite3 dependency is installed in packages/agent-core via `pnpm list better-sqlite3` in packages/agent-core
- [x] T003 [P] [ASYNC] Verify Vitest is configured in packages/agent-core via `pnpm list vitest` in packages/agent-core

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type definitions that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] [ASYNC] Define InferenceParamsSchema with Zod validation in packages/types/src/agent-config.ts — fields: temperature (0-2), maxTokens (positive int), topP (0-1), stop (string|array), presencePenalty (-2 to 2), frequencyPenalty (-2 to 2), extras (Record<string, unknown>)
- [x] T005 [P] [ASYNC] Define AgentConfigSchema with Zod validation in packages/types/src/agent-config.ts — fields: id (UUID, optional), name (1-128 chars, regex `^[a-zA-Z0-9 _-]+$`), description (max 512, optional), role (max 256, optional), model (required), provider (required), params (InferenceParamsSchema), secrets (max 50), skills (max 50), mcps (max 10)
- [x] T006 [P] [ASYNC] Export inferred types AgentConfig, AgentConfigPartial, InferenceParams in packages/types/src/agent-config.ts using z.infer<> and .partial()
- [x] T007 [ASYNC] Create AgentStatus type and VALID_TRANSITIONS map in packages/types/src/agent-status.ts — states: idle, materialized, starting, running, stopped, error; transitions per ADR-002
- [x] T008 [P] [ASYNC] Update packages/types/src/index.ts to re-export AgentConfigSchema, InferenceParamsSchema, AgentConfig, AgentConfigPartial, InferenceParams, AgentStatus, VALID_TRANSITIONS
- [x] T009 [ASYNC] Verify types package compiles via `pnpm --filter @myboteam/types run build` in packages/types

**Checkpoint**: Foundation types ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Define Agent Configuration (Priority: P1) 🎯 MVP

**Goal**: Define AgentConfig and InferenceParams types with Zod validation so configs can be validated before persistence

**Independent Test**: Create AgentConfig objects with valid and invalid data; verify validation rejects malformed configs and accepts well-formed ones

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T010 [P] [ASYNC] [US1] Create unit test file packages/agent-core/tests/unit/agent-config.test.ts with test cases for: valid config with all fields, config missing required name, name with special characters, inference params within bounds, inference params out of bounds, empty secrets/skills/mcps arrays, secrets exceeding 50 items

### Implementation for User Story 1

- [x] T011 [P] [ASYNC] [US1] Export AgentConfigSchema and InferenceParamsSchema from packages/agent-core/src/index.ts to make them available to agent-core consumers
- [x] T012 [US1] Run unit tests to verify validation logic works per acceptance scenarios: valid config accepted, missing name rejected, special characters rejected, out-of-range params rejected

**Checkpoint**: Agent configuration validation fully functional and tested

---

## Phase 4: User Story 2 — Default Agent Configurations (Priority: P1)

**Goal**: Ship three default agent configurations (orchestrator, secretary, accountant) for out-of-the-box functionality

**Independent Test**: Load default configurations and verify each has expected name, role, model, provider values

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T013 [P] [ASYNC] [US2] Create unit test file packages/agent-core/tests/unit/agent-defaults.test.ts with test cases for: three defaults exist, each has valid name/role/model/provider, orchestrator role is coordinator, secretary role is scheduling, accountant role is resource tracking

### Implementation for User Story 2

- [x] T014 [P] [ASYNC] [US2] Create default agent configurations in packages/agent-core/src/agent-defaults.ts — export DEFAULT_AGENTS array with orchestrator, secretary, accountant configs (model/provider TBD per ADR-006)
- [x] T015 [P] [ASYNC] [US2] Export DEFAULT_AGENTS from packages/agent-core/src/index.ts
- [x] T016 [US2] Run unit tests to verify default configs load correctly per acceptance scenarios

**Checkpoint**: Default agents available on daemon startup

---

## Phase 5: User Story 3 — Persist and Load Configurations from SQLite (Priority: P2)

**Goal**: Agent configurations persist in SQLite with CRUD operations, surviving daemon restarts

**Independent Test**: Create config, restart persistence layer, verify config restored correctly

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T017 [P] [ASYNC] [US3] Create unit test file packages/agent-core/tests/unit/agent-registry.test.ts with test cases for: register creates config, list returns all, getById returns correct config, update modifies fields, delete removes config, duplicate name rejected, capacity limit enforced

### Implementation for User Story 3

- [x] T018 [SYNC] [US3] Implement AgentRegistry class in packages/agent-core/src/agent-registry.ts — constructor(db: DatabaseService), register() with UUID generation and INSERT, list() with SELECT, getById() with SELECT WHERE, update() with SELECTIVE UPDATE, delete() with DELETE
- [x] T019 [SYNC] [US3] Add capacity check (MAX_AGENTS = 20) in register() — COUNT query before INSERT, reject with CapacityReached error if >= 20
- [x] T020 [SYNC] [US3] Add unique name enforcement in register() and update() — query for existing name before INSERT/UPDATE, reject with DuplicateName error
- [x] T021 [P] [ASYNC] [US3] Add structured audit logging in register(), update(), delete() — log { id, operation, timestamp } to console for each mutation
- [x] T022 [P] [ASYNC] [US3] Add loadAll() method in AgentRegistry — query all rows from agent_registry and return AgentConfig[] (satisfies FR-006 for daemon startup loading)
- [x] T023 [P] [ASYNC] [US3] Export AgentRegistry and loadAll from packages/agent-core/src/index.ts
- [x] T024 [US3] Run unit tests to verify CRUD operations per acceptance scenarios: create/read/update/delete, persistence across restarts, unique name enforcement, capacity limit, UUID auto-generation (FR-009), timestamp tracking (FR-010), startup load (FR-006)

**Checkpoint**: Agent configurations fully persistent with CRUD operations

---

## Phase 6: User Story 4 — Validate Configuration Changes (Priority: P2)

**Goal**: Configuration updates validated before being applied; invalid updates rejected while preserving original

**Independent Test**: Attempt update with invalid data; verify rejection and original preserved

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T025 [P] [ASYNC] [US4] Add test cases to packages/agent-core/tests/unit/agent-registry.test.ts for: update with invalid model rejected, original preserved after failed update, valid update applied, unchanged fields preserved

### Implementation for User Story 4

- [x] T026 [SYNC] [US4] Add Zod validation in AgentRegistry.update() — validate partial config with AgentConfigSchema.partial().safeParse() before SQLite UPDATE, reject with ValidationError if invalid
- [x] T027 [US4] Run unit tests to verify update validation per acceptance scenarios: invalid update rejected, valid update applied, atomicity of partial updates (SC-005)

**Checkpoint**: All configuration mutations validated at boundary

---

## Phase 7: User Story 5 — Agent Status State Machine (Priority: P2)

**Goal**: Agent status follows defined 6-state lifecycle; invalid transitions rejected

**Independent Test**: Attempt all valid and invalid transitions; verify state machine enforcement

### Tests for User Story 5

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T028 [P] [ASYNC] [US5] Add test cases to packages/agent-core/tests/unit/agent-registry.test.ts for: all 6 valid transitions succeed, all invalid transitions rejected, setStatus updates SQLite, invalid transition preserves original status

### Implementation for User Story 5

- [x] T029 [SYNC] [US5] Implement setStatus() in AgentRegistry — validate transition against VALID_TRANSITIONS map, reject with InvalidTransition error if invalid, UPDATE status in SQLite
- [x] T030 [SYNC] [US5] Add InvalidStatus error handling — reject status values not in AgentStatus enum
- [x] T031 [US5] Run unit tests to verify status state machine per acceptance scenarios: all valid transitions work, all invalid transitions rejected

**Checkpoint**: Agent lifecycle state machine fully enforced

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [x] T032 [P] [ASYNC] Run full test suite via `pnpm --filter @myboteam/agent-core run test` in packages/agent-core
- [x] T033 [P] [ASYNC] Run linter via `pnpm --filter @myboteam/agent-core run lint` in packages/agent-core
- [x] T034 [P] [ASYNC] Verify quickstart.md usage examples work against implementation
- [x] T035 [ASYNC] Run type checking via `pnpm --filter @myboteam/types run typecheck` and `pnpm --filter @myboteam/agent-core run typecheck`
- [x] T036 [P] [ASYNC] Verify audit logging outputs structured entries for create/update/delete operations
- [x] T037 [P] [ASYNC] Verify capacity error message matches spec: "Agent capacity reached (20 maximum)"
- [x] T038 [P] [ASYNC] Performance test: verify default agent load time < 1 second (SC-001) — measure time from loadAll() call to returning 3 configs
- [x] T039 [P] [ASYNC] Verify warning logging for non-existent skill/MCP references at registration time (deferred to M5-2 — document in task notes)
- [x] T040 [P] [ASYNC] Verify SQLite corruption error handling — system fails to start with clear error message (handled by M1-4/M2-1 database initialization — document in task notes)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (Define Config): Foundation types only
  - US2 (Default Configs): Foundation types + can parallel with US1
  - US3 (Persistence): Foundation types + benefits from US1 validation
  - US4 (Update Validation): Depends on US3 (AgentRegistry must exist)
  - US5 (Status Machine): Depends on US3 (AgentRegistry must exist)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational — Independent of US1
- **User Story 3 (P2)**: Can start after Foundational — Benefits from US1 validation patterns
- **User Story 4 (P2)**: Depends on US3 (AgentRegistry must exist for update validation)
- **User Story 5 (P2)**: Depends on US3 (AgentRegistry must exist for setStatus)

### Within Each User Story

- Tests written FIRST (TDD) and must FAIL before implementation
- Models/types before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T001, T002, T003: Setup verification tasks (all [P])
- T004, T005, T006: Schema definitions (all [P], different schemas)
- T010, T013, T017: Test file creation (all [P], different files)
- T014, T015: Default config creation and export (all [P])
- T021, T022, T023: Audit logging, loadAll, and export (all [P])
- T032, T033, T034, T035, T036, T037, T038, T039, T040: Polish tasks (all [P])

---

## Parallel Example: User Story 3

```bash
# Launch audit logging, loadAll, and export together:
Task: "Add structured audit logging in register(), update(), delete()"
Task: "Add loadAll() method in AgentRegistry"
Task: "Export AgentRegistry and loadAll from packages/agent-core/src/index.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 — Define Agent Configuration
4. Complete Phase 4: User Story 2 — Default Agent Configurations
5. **STOP and VALIDATE**: Test US1 + US2 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Define Config) + US2 (Defaults) → Test independently → Deploy/Demo (MVP!)
3. Add US3 (Persistence) → Test independently → Deploy/Demo
4. Add US4 (Update Validation) → Test independently → Deploy/Demo
5. Add US5 (Status Machine) → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 + US2 (both P1, can parallel)
   - Developer B: US3 (P2, persistence)
3. After US3:
   - Developer A: US4 (update validation)
   - Developer B: US5 (status machine)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [SYNC] tasks = require human review (SQLite operations, state machine)
- [ASYNC] tasks = can be delegated (schemas, constants, tests)
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests must FAIL before implementing (TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
