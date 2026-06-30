# Tasks: Daemon Lifecycle (MAO-148)

**Input**: Design documents from `/specs/007-daemon-lifecycle/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included for each user story per Constitution Principle II (Test-First Quality).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [SYNC/ASYNC] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[SYNC]**: Requires human review (complex logic, security-critical, ambiguous requirements)
- **[ASYNC]**: Can be delegated to async agents (well-defined CRUD, repetitive tasks, clear specs)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 [P] [ASYNC] Create daemon lifecycle directory structure in `packages/agent-core/src/daemon/lifecycle/`
- [X] T002 [P] [ASYNC] Create contracts directory with TypeScript interfaces in `specs/007-daemon-lifecycle/contracts/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [SYNC] Implement DaemonState enum with valid lifecycle states in `packages/agent-core/src/daemon/lifecycle/daemon-state.ts`
- [X] T004 [SYNC] Implement TaskState enum with valid task lifecycle states in `packages/agent-core/src/daemon/lifecycle/task-state.ts`
- [X] T005 [SYNC] Implement DaemonProcess interface in `packages/agent-core/src/daemon/lifecycle/daemon-process.interface.ts`
- [X] T006 [P] [SYNC] Implement TaskQueue interface in `packages/agent-core/src/daemon/lifecycle/task-queue.interface.ts`
- [X] T007 [P] [SYNC] Implement ShutdownManager interface in `packages/agent-core/src/daemon/lifecycle/shutdown-manager.interface.ts`
- [X] T008 [SYNC] Implement exit code constants for daemon lifecycle in `packages/agent-core/src/daemon/lifecycle/exit-codes.ts` (document exit code mapping per spec)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 2.5: Architectural Decision Records (Required)

**Purpose**: Document architectural decisions that require ADRs per architect.validate hook

**⚠️ CRITICAL**: These ADRs must be created before implementation to ensure architectural alignment

- [X] T008a [SYNC] Create ADR for graceful shutdown with 30s timeout in `packages/agent-core/src/daemon/lifecycle/adr/001-graceful-shutdown.md`
- [X] T008b [SYNC] Create ADR for auto-restart with exponential backoff in `packages/agent-core/src/daemon/lifecycle/adr/002-auto-restart.md`
- [X] T008c [SYNC] Create ADR for task draining on shutdown in `packages/agent-core/src/daemon/lifecycle/adr/003-task-draining.md`
- [X] T008d [SYNC] Create ADR for resource cleanup on shutdown in `packages/agent-core/src/daemon/lifecycle/adr/004-resource-cleanup.md`
- [X] T008e [SYNC] Create ADR for OpenTelemetry observability in `packages/agent-core/src/daemon/lifecycle/adr/005-opentelemetry-observability.md`

**Checkpoint**: ADRs created - architectural decisions documented

---

## Phase 3: User Story 1 - Daemon Start and Stop (Priority: P1) 🎯 MVP

**Goal**: Start and stop the daemon process as an independent process of the host application

**Independent Test**: Launch host application, verify daemon starts independently, close app, verify daemon terminates cleanly

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T009 [P] [SYNC] [US1] Write unit tests for DaemonProcessManager start/stop in `packages/agent-core/tests/unit/daemon-lifecycle/process-manager.test.ts`
- [X] T010 [P] [SYNC] [US1] Write integration test for daemon start/stop lifecycle in `packages/agent-core/tests/integration/daemon-lifecycle/start-stop.test.ts`

### Implementation for User Story 1

- [X] T011 [SYNC] [US1] Implement PidManager for single instance management in `packages/agent-core/src/daemon/lifecycle/pid-manager.ts`
- [X] T012 [SYNC] [US1] Implement DaemonProcessManager class with start/stop/kill in `packages/agent-core/src/daemon/lifecycle/daemon-process-manager.ts`
- [X] T013 [ASYNC] [US1] Add error handling for failed daemon start scenarios in `packages/agent-core/src/daemon/lifecycle/daemon-process-manager.ts`
- [X] T014 [ASYNC] [US1] Add logging for daemon lifecycle events in `packages/agent-core/src/daemon/lifecycle/daemon-process-manager.ts`
- [X] T014a [SYNC] [US1] Add error propagation to host application on daemon start failure in `packages/agent-core/src/daemon/lifecycle/daemon-process-manager.ts`

**Checkpoint**: User Story 1 complete - daemon can start and stop as independent process

---

## Phase 4: User Story 2 - Graceful Shutdown with Task Drain (Priority: P2)

**Goal**: Daemon gracefully shuts down by draining active tasks before terminating

**Independent Test**: Start long-running task, initiate shutdown, verify task completes within timeout

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T015 [P] [SYNC] [US2] Write unit tests for ShutdownManager in `packages/agent-core/tests/unit/daemon-lifecycle/shutdown-manager.test.ts`
- [X] T016 [P] [SYNC] [US2] Write unit tests for TaskDrainer in `packages/agent-core/tests/unit/daemon-lifecycle/task-drainer.test.ts`
- [X] T017 [P] [SYNC] [US2] Write integration test for graceful shutdown in `packages/agent-core/tests/integration/daemon-lifecycle/graceful-shutdown.test.ts`

### Implementation for User Story 2

- [X] T018 [SYNC] [US2] Implement ShutdownManager class with 30s timeout in `packages/agent-core/src/daemon/lifecycle/shutdown-manager.ts`
- [X] T019 [SYNC] [US2] Implement TaskDrainer class for draining active tasks in `packages/agent-core/src/daemon/lifecycle/task-drainer.ts`
- [X] T020 [ASYNC] [US2] Add timeout handling and force kill logic in `packages/agent-core/src/daemon/lifecycle/shutdown-manager.ts`
- [X] T021 [ASYNC] [US2] Add subsequent signal ignore logic in `packages/agent-core/src/daemon/lifecycle/shutdown-manager.ts`
- [X] T022 [ASYNC] [US2] Add logging for shutdown events in `packages/agent-core/src/daemon/lifecycle/shutdown-manager.ts`

**Checkpoint**: User Story 2 complete - daemon can gracefully shutdown with task draining

---

## Phase 5: User Story 3 - Clean Resource Cleanup (Priority: P3)

**Goal**: Daemon cleans up all resources (sockets, connections, file handles) on shutdown

**Independent Test**: Monitor system resources before/after shutdown, verify all sockets and connections closed

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T023 [P] [SYNC] [US3] Write unit tests for ResourceCleanupHandler in `packages/agent-core/tests/unit/daemon-lifecycle/resource-cleanup.test.ts`
- [X] T024 [P] [SYNC] [US3] Write integration test for resource cleanup in `packages/agent-core/tests/integration/daemon-lifecycle/resource-cleanup.test.ts`

### Implementation for User Story 3

- [X] T025 [SYNC] [US3] Implement ResourceCleanupHandler class with socket.destroy() pattern in `packages/agent-core/src/daemon/lifecycle/resource-cleanup-handler.ts`
- [X] T026 [ASYNC] [US3] Add file handle cleanup logic in `packages/agent-core/src/daemon/lifecycle/resource-cleanup-handler.ts`
- [X] T027 [ASYNC] [US3] Add temp file cleanup logic in `packages/agent-core/src/daemon/lifecycle/resource-cleanup-handler.ts`
- [X] T028 [ASYNC] [US3] Add logging for cleanup events in `packages/agent-core/src/daemon/lifecycle/resource-cleanup-handler.ts`

**Checkpoint**: User Story 3 complete - daemon cleans up all resources on shutdown

---

## Phase 6: Cross-Cutting - Auto-Restart (Priority: P2)

**Purpose**: Daemon auto-restarts on crash with exponential backoff

### Tests for Auto-Restart

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T029 [P] [SYNC] Write unit tests for Watchdog in `packages/agent-core/tests/unit/daemon-lifecycle/watchdog.test.ts`
- [X] T030 [P] [SYNC] Write unit tests for RestartManager in `packages/agent-core/tests/unit/daemon-lifecycle/restart-manager.test.ts`
- [X] T031 [P] [SYNC] Write integration test for auto-restart in `packages/agent-core/tests/integration/daemon-lifecycle/auto-restart.test.ts`

### Implementation for Auto-Restart

- [X] T032 [SYNC] Implement Watchdog class for daemon health monitoring in `packages/agent-core/src/daemon/lifecycle/watchdog.ts`
- [X] T033 [SYNC] Implement RestartManager class with exponential backoff in `packages/agent-core/src/daemon/lifecycle/restart-manager.ts`
- [X] T034 [ASYNC] Add backoff reset after stability logic in `packages/agent-core/src/daemon/lifecycle/restart-manager.ts`
- [X] T035 [ASYNC] Add max restart attempts and manual intervention requirement in `packages/agent-core/src/daemon/lifecycle/restart-manager.ts`
- [X] T036 [ASYNC] Add logging for restart events in `packages/agent-core/src/daemon/lifecycle/restart-manager.ts`

**Checkpoint**: Auto-restart complete - daemon recovers from crashes with exponential backoff

---

## Phase 7: Cross-Cutting - Observability (Priority: P3)

**Purpose**: Structured logging, metrics, and tracing for operational monitoring

### Tests for Observability

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T037 [P] [SYNC] Write unit tests for Logger in `packages/agent-core/tests/unit/daemon-lifecycle/logger.test.ts`
- [X] T038 [P] [SYNC] Write unit tests for MetricsCollector in `packages/agent-core/tests/unit/daemon-lifecycle/metrics-collector.test.ts`
- [X] T039 [P] [SYNC] Write unit tests for Tracer in `packages/agent-core/tests/unit/daemon-lifecycle/tracer.test.ts`

### Implementation for Observability

- [X] T040 [SYNC] Implement Logger class with structured JSON logging in `packages/agent-core/src/daemon/lifecycle/logger.ts`
- [X] T041 [SYNC] Implement MetricsCollector class with OpenTelemetry in `packages/agent-core/src/daemon/lifecycle/metrics-collector.ts`
- [X] T042 [SYNC] Implement Tracer class with OpenTelemetry in `packages/agent-core/src/daemon/lifecycle/tracer.ts`
- [X] T043 [ASYNC] Add daemon.uptime metric in `packages/agent-core/src/daemon/lifecycle/metrics-collector.ts`
- [X] T044 [ASYNC] Add daemon.tasks.active/completed/failed metrics in `packages/agent-core/src/daemon/lifecycle/metrics-collector.ts`
- [X] T045 [ASYNC] Add daemon.connections.active metric in `packages/agent-core/src/daemon/lifecycle/metrics-collector.ts`
- [X] T046 [ASYNC] Add daemon.errors.total metric in `packages/agent-core/src/daemon/lifecycle/metrics-collector.ts`
- [X] T047 [ASYNC] Add task execution spans in `packages/agent-core/src/daemon/lifecycle/tracer.ts`
- [X] T048 [ASYNC] Add shutdown lifecycle spans in `packages/agent-core/src/daemon/lifecycle/tracer.ts`

**Checkpoint**: Observability complete - daemon emits structured logs, metrics, and traces

---

## Phase 8: Integration Tests (Priority: P1)

**Purpose**: Comprehensive integration tests for all lifecycle scenarios

- [X] T049 [SYNC] Write integration test for normal start/stop cycle in `packages/agent-core/tests/integration/daemon-lifecycle/normal-cycle.test.ts`
- [X] T050 [SYNC] Write integration test for forced shutdown on timeout in `packages/agent-core/tests/integration/daemon-lifecycle/forced-shutdown.test.ts`
- [X] T051 [SYNC] Write integration test for crash recovery in `packages/agent-core/tests/integration/daemon-lifecycle/crash-recovery.test.ts`
- [X] T052 [SYNC] Write integration test for multiple shutdown signals in `packages/agent-core/tests/integration/daemon-lifecycle/multiple-signals.test.ts`
- [X] T053 [SYNC] Write integration test for task abort on critical state in `packages/agent-core/tests/integration/daemon-lifecycle/task-abort.test.ts`

**Checkpoint**: All integration tests pass

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final polish and documentation

- [X] T054 [ASYNC] Add JSDoc documentation to all public interfaces in `packages/agent-core/src/daemon/lifecycle/`
- [X] T055 [ASYNC] Verify all lint checks pass with `pnpm lint`
- [X] T056 [ASYNC] Verify all type checks pass with `pnpm typecheck`
- [X] T057 [ASYNC] Update quickstart.md with final implementation details in `specs/007-daemon-lifecycle/quickstart.md`

**Checkpoint**: Implementation complete - ready for review

---

## Task Summary

### By Priority
- **P1 (Critical)**: T001-T014a (15 tasks) - Daemon Start/Stop MVP
- **P2 (Important)**: T015-T022, T029-T036 (16 tasks) - Graceful Shutdown, Auto-Restart
- **P3 (Nice-to-have)**: T023-T028, T037-T048 (18 tasks) - Resource Cleanup, Observability
- **Cross-Cutting**: T049-T053 (5 tasks) - Integration Tests (all priorities)
- **Architectural**: T008a-T008e (5 tasks) - ADRs
- **Polish**: T054-T057 (4 tasks)

### By User Story
- **Setup**: T001-T002 (2 tasks)
- **Foundational**: T003-T008 (6 tasks)
- **ADRs**: T008a-T008e (5 tasks)
- **US1 - Daemon Start/Stop**: T009-T014a (7 tasks)
- **US2 - Graceful Shutdown**: T015-T022 (8 tasks)
- **US3 - Resource Cleanup**: T023-T028 (6 tasks)
- **Auto-Restart**: T029-T036 (8 tasks)
- **Observability**: T037-T048 (12 tasks)
- **Integration Tests**: T049-T053 (5 tasks)
- **Polish**: T054-T057 (4 tasks)

### Total Tasks: 63

### Execution Order
1. Phase 1-2: Setup and Foundation (T001-T008)
2. Phase 2.5: ADRs (T008a-T008e)
3. Phase 3: US1 - Daemon Start/Stop (T009-T014a) - MVP
4. Phase 4: US2 - Graceful Shutdown (T015-T022)
5. Phase 5: US3 - Resource Cleanup (T023-T028)
6. Phase 6: Auto-Restart (T029-T036)
7. Phase 7: Observability (T037-T048)
8. Phase 8: Integration Tests (T049-T053)
9. Phase 9: Polish (T054-T057)

### Parallel Opportunities
- T001, T002: Directory setup can run in parallel
- T003, T004: Enums can be implemented in parallel
- T006, T007: Interfaces can be implemented in parallel
- T009, T010: Tests for US1 can run in parallel
- T015, T016, T017: Tests for US2 can run in parallel
- T023, T024: Tests for US3 can run in parallel
- T029, T030, T031: Tests for auto-restart can run in parallel
- T037, T038, T039: Tests for observability can run in parallel
