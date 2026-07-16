# Tasks: Eve Materializer (Runtime File Generation)

**Input**: Design documents from `/specs/013-eve-materializer-runtime/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: Unit tests are REQUIRED per spec constraint ("Unit tests required for materialization output"). Test tasks included in each user story phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [SYNC/ASYNC] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create materializer module directory structure

- [x] T001 [ASYNC] Create materializer directory structure at `packages/agent-core/src/eve/` with barrel exports in `index.ts`
- [x] T002 [P] [ASYNC] Create test directory structure at `packages/agent-core/tests/unit/eve/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: File writers and template engine that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] [SYNC] Implement file-writers.ts with all five file generation functions in `packages/agent-core/src/eve/file-writers.ts` — `writeInstructions()`, `writeToolCatalog()`, `writeDelegationPolicy()`, `writeProviderConfig()`, `writeChecksumManifest()`
- [x] T004 [P] [ASYNC] Implement template generation in `packages/agent-core/src/eve/file-writers.ts` — `generateInstructionsTemplate(agent)` returns Markdown string from role + description

**Checkpoint**: Foundation ready — file writers and template engine available for all user stories

---

## Phase 3: User Story 1 — Materialize Agent Runtime Files (Priority: P1) 🎯 MVP

**Goal**: Generate deterministic runtime files from agent configuration with profile injection

**Independent Test**: Register an agent, invoke materializer, verify 5 files written to `.local-data/agents/{agent-id}/` with correct content

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T005 [P] [SYNC] [US1] Write unit test for materializer core in `packages/agent-core/tests/unit/eve/materializer.test.ts` — test: materialize generates 5 files, idempotency (same config = byte-identical), re-materialize with changed config updates files, status transition idle → materialized, validation error on invalid config, cleanup on partial failure

### Implementation for User Story 1

- [x] T006 [SYNC] [US1] Implement materializer.ts core logic in `packages/agent-core/src/eve/materializer.ts` — `materialize(agent, opts)` function: validate config, create runtime directory, call all five file writers, generate checksums, transition status to `materialized` via AgentRegistry; handle idempotency (compare checksums before writing); atomic cleanup on failure (delete partial files, preserve previous state)
- [x] T007 [SYNC] [US1] Implement dematerialize function in `packages/agent-core/src/eve/materializer.ts` — `dematerialize(agentId, opts)` function: remove runtime directory, reset status to `idle` via AgentRegistry

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently — materializer generates all 5 files, handles idempotency, and manages status transitions

---

## Phase 4: User Story 2 — Agent Profile Injection into Instructions (Priority: P1)

**Goal**: Agent profile (name, role, description, system prompt) is injected into `instructions.md`

**Independent Test**: Materialize agent with specific profile, verify `instructions.md` contains all profile fields in structured format

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T008 [P] [SYNC] [US2] Write unit test for profile injection in `packages/agent-core/tests/unit/eve/profile-injection.test.ts` — test: instructions.md contains agent name/role/description, custom system prompt incorporated, default template generated when no prompt

### Implementation for User Story 2

- [x] T009 [SYNC] [US2] Implement instructions.md generation with profile injection in `packages/agent-core/src/eve/file-writers.ts` — `writeInstructions()`: generate Markdown with `# Agent: {name}`, `## Role`, `## Description`, `## Instructions` sections; incorporate custom system prompt or call template-engine for default

**Checkpoint**: User Story 2 complete — `instructions.md` contains correct agent profile

---

## Phase 5: User Story 3 — Tool Catalog Filtering Per Agent (Priority: P2)

**Goal**: `tool-catalog.json` contains only tools assigned to the specific agent via skills and MCP configuration

**Independent Test**: Materialize two agents with different skill sets, verify each receives only its assigned tools

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T010 [P] [SYNC] [US3] Write unit test for tool catalog filtering in `packages/agent-core/tests/unit/eve/materializer.test.ts` — test: catalog contains only assigned tools + base tools, no skills = base tools only, MCP tools included when servers reachable, missing skill logged as warning and omitted

### Implementation for User Story 3

- [x] T011 [SYNC] [US3] Implement tool-catalog.json generation with filtering in `packages/agent-core/src/eve/file-writers.ts` — `writeToolCatalog()`: query global tool registry, filter by agent skills/MCP, include base tools, mark MCP server availability status, log warnings for missing skills

**Checkpoint**: User Story 3 complete — `tool-catalog.json` correctly filtered per agent

---

## Phase 6: User Story 4 — Delegation Policy Inclusion (Priority: P2)

**Goal**: `delegation-policy.json` contains delegation rules; file omitted when no rules configured

**Independent Test**: Materialize orchestrator with delegation rules, verify delegation policy section present; materialize agent without rules, verify file omitted

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T012 [P] [SYNC] [US4] Write unit test for delegation policy in `packages/agent-core/tests/unit/eve/delegation-policy.test.ts` — test: policy contains correct delegations, no rules = file omitted, circular reference detected and returns validation error

### Implementation for User Story 4

- [x] T013 [SYNC] [US4] Implement delegation-policy.json generation with cycle detection in `packages/agent-core/src/eve/file-writers.ts` — `writeDelegationPolicy()`: serialize delegation rules, detect cycles via DFS, return error on circular reference, omit file when no rules configured

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T014 [P] [ASYNC] Run quickstart.md validation — execute all examples from `specs/013-eve-materializer-runtime/quickstart.md` and verify output
- [x] T015 [P] [ASYNC] Update barrel exports in `packages/agent-core/src/eve/index.ts` — export `materialize`, `dematerialize`, and types
- [x] T016 [ASYNC] Run lint and typecheck: `cd packages/agent-core && npx biome check src/eve/ && npx tsc --noEmit`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–6)**: All depend on Foundational phase completion
  - US1 (P1) and US2 (P1) are co-dependent (materializer generates instructions.md with profile)
  - US3 (P2) and US4 (P2) are independent of each other but depend on US1 (materializer core)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P1)**: Co-dependent with US1 — profile injection is part of instructions.md generation
- **User Story 3 (P2)**: Can start after US1 — depends on materializer core
- **User Story 4 (P2)**: Can start after US1 — depends on materializer core

### Within Each User Story

- Tests written FIRST (TDD) — must FAIL before implementation
- File writers before materializer (foundational)
- Materializer before status transitions
- Core implementation before integration

### Parallel Opportunities

- T001 and T002 can run in parallel (different directories)
- T003 and T004 can run in parallel (different files)
- T005 (US1 tests) can run in parallel with T008 (US2 tests) and T010 (US3 tests) and T012 (US4 tests)
- US3 and US4 can be implemented in parallel after US1 completes

---

## Parallel Example: User Story 1

```bash
# Phase 2 — Foundation (parallel):
Task: "Implement file-writers.ts in packages/agent-core/src/eve/file-writers.ts"
Task: "Implement template generation in packages/agent-core/src/eve/file-writers.ts"

# Phase 3 — US1 tests + implementation (sequential within story):
Task: "Write unit test for materializer core in tests/unit/eve/materializer.test.ts"
Task: "Implement materializer.ts core logic in packages/agent-core/src/eve/materializer.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (materializer core)
4. Complete Phase 4: User Story 2 (profile injection)
5. **STOP and VALIDATE**: Test materializer generates all 5 files with correct profiles
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 + US2 → Test independently → Deploy/Demo (MVP!)
3. Add US3 (tool catalog) → Test independently → Deploy/Demo
4. Add US4 (delegation policy) → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 + US2 (co-dependent, P1)
   - Developer B: US3 (P2) — can start after US1 core is stable
   - Developer C: US4 (P2) — can start after US1 core is stable
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Unit tests are REQUIRED per spec constraint — TDD approach used
- US1 and US2 are co-dependent (profile injection is part of instructions.md generation)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
