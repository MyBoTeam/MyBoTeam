# Tasks: Crash Recovery — PID Detection, Stale Tasks

**Input**: Design documents from `/specs/007-crash-recovery-stale-tasks/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [SYNC] Verify existing PID lock manager interface in packages/agent-core/src/daemon/pid-lock.ts
- [x] T002 [SYNC] Verify existing task CRUD module interface in packages/agent-core/src/storage/crud/task.ts
- [x] T003 [P] [ASYNC] Review Accomplish reference implementation in Accomplish/apps/daemon/src/index.ts (lines 111-117, 305-347)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [SYNC] Add `detectStaleLock()` method to PidLockManager interface in packages/agent-core/src/daemon/pid-lock.ts
- [x] T005 [SYNC] Add `removeStaleLock()` method to PidLockManager interface in packages/agent-core/src/daemon/pid-lock.ts
- [x] T006 [P] [ASYNC] Implement atomic lock file creation (write to temp, then rename) in packages/agent-core/src/daemon/pid-lock.ts
- [x] T007 [P] [ASYNC] Implement process liveness check (not timestamp-based) in packages/agent-core/src/daemon/pid-lock.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Daemon Recovers from Crash (Priority: P1) 🎯 MVP

**Goal**: Automatically detect and recover from daemon crashes by marking stale running tasks as failed

**Independent Test**: Force-stop daemon, restart, verify stale tasks marked as failed

### Implementation for User Story 1

- [x] T008 [US1] [SYNC] Implement `detectStaleLock()` method in packages/agent-core/src/daemon/pid-lock.ts
- [x] T009 [US1] [SYNC] Implement `removeStaleLock()` method in packages/agent-core/src/daemon/pid-lock.ts
- [x] T010 [US1] [SYNC] Add crash detection logic to daemon startup in apps/daemon/src/index.ts (FR-001, FR-002)
- [x] T011 [US1] [SYNC] Mark stale running tasks as failed on startup in apps/daemon/src/index.ts (FR-003)
- [x] T012 [US1] [SYNC] Add warning logs for each stale task in apps/daemon/src/index.ts (FR-004)
- [x] T013 [P] [US1] [ASYNC] Write unit tests for crash detection in tests/unit/crash-recovery.test.ts
- [x] T014 [P] [US1] [ASYNC] Write integration test for daemon restart after crash in tests/integration/daemon-crash.test.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Graceful Shutdown with Task Drain (Priority: P1)

**Goal**: Gracefully shut down daemon by draining active tasks before exiting

**Independent Test**: Invoke shutdown RPC method, verify tasks drain within timeout

### Implementation for User Story 2

- [x] T015 [US2] [SYNC] Create shutdown manager module in packages/agent-core/src/daemon/shutdown-manager.ts
- [x] T016 [US2] [SYNC] Implement drain timeout configuration via `MYBOTEAM_DRAIN_TIMEOUT_MS` env var in packages/agent-core/src/daemon/shutdown-manager.ts (FR-008)
- [x] T017 [US2] [SYNC] Implement scheduler stop logic in apps/daemon/src/scheduler.ts (FR-006)
- [x] T018 [US2] [SYNC] Add shutdown state tracking (isShuttingDown, shutdownStartTime) in packages/agent-core/src/daemon/shutdown-manager.ts
- [x] T019 [US2] [SYNC] Implement `daemon.shutdown` RPC method in apps/daemon/src/index.ts (FR-005)
- [x] T020 [US2] [SYNC] Implement `daemon.getShutdownStatus` RPC method in apps/daemon/src/index.ts
- [x] T021 [US2] [SYNC] Implement idempotent shutdown handling (ignore subsequent requests) in packages/agent-core/src/daemon/shutdown-manager.ts (FR-012)
- [x] T022 [US2] [SYNC] Implement task rejection when shutdown is in progress in apps/daemon/src/index.ts (FR-007)
- [x] T023 [US2] [SYNC] Implement drain logic with timeout in apps/daemon/src/index.ts `performDrain()` (FR-008)
- [x] T024 [US2] [SYNC] Implement force-stop remaining tasks on timeout in apps/daemon/src/index.ts `performDrain()` (FR-009)
- [x] T025 [US2] [SYNC] Implement lock file release on graceful shutdown in apps/daemon/src/index.ts `gracefulExit()` (FR-010)
- [x] T026 [P] [US2] [ASYNC] Write unit tests for shutdown manager in tests/unit/shutdown-manager.test.ts
- [x] T027 [P] [US2] [ASYNC] Write integration test for graceful shutdown in tests/integration/daemon-shutdown.test.ts
- [x] T028 [P] [US2] [ASYNC] Write contract test for `daemon.shutdown` RPC in tests/contract/rpc-shutdown.test.ts
- [x] T029 [P] [US2] [ASYNC] Write contract test for `daemon.getShutdownStatus` RPC in tests/contract/rpc-shutdown-status.test.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Agent Process Cleanup on Shutdown (Priority: P2)

**Goal**: Track and terminate agent child processes on shutdown

**Independent Test**: Start daemon with agent processes, verify they receive SIGTERM on shutdown

### Implementation for User Story 3

- [x] T030 [US3] [SYNC] Create agent tracker module in packages/agent-core/src/daemon/agent-tracker.ts
- [x] T031 [US3] [SYNC] Implement PID file read/write in packages/agent-core/src/daemon/agent-tracker.ts (FR-011)
- [x] T032 [US3] [SYNC] Implement agent process termination (SIGTERM) in packages/agent-core/src/daemon/agent-tracker.ts (FR-011)
- [x] T033 [US3] [SYNC] Handle missing/empty PID file gracefully in packages/agent-core/src/daemon/agent-tracker.ts
- [x] T034 [US3] [SYNC] Skip dead processes without error in packages/agent-core/src/daemon/agent-tracker.ts
- [x] T035 [US3] [SYNC] Integrate agent tracker with daemon startup in apps/daemon/src/index.ts
- [x] T036 [P] [US3] [ASYNC] Write unit tests for agent tracker in tests/unit/agent-tracker.test.ts
- [x] T037 [P] [US3] [ASYNC] Write integration test for agent cleanup on shutdown in tests/integration/agent-cleanup.test.ts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T038 [P] [ASYNC] Add logging for shutdown events in apps/daemon/src/index.ts
- [ ] T039 [P] [ASYNC] Add metrics for crash recovery and shutdown in apps/daemon/src/index.ts — **Deferred**: Metrics infrastructure (e.g., Prometheus, StatsD) not yet available in project. Will be implemented when metrics system is established in M3-5.
- [x] T040 [P] [ASYNC] Run quickstart.md validation scenarios
- [x] T041 [SYNC] Run linter and type checker (biome, tsc) on all modified files
- [x] T042 [SYNC] Verify all tests pass (unit, integration, contract)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational
  - User Story 2 (P1): Can start after Foundational (independent of US1)
  - User Story 3 (P2): Can start after Foundational (independent of US1/US2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Implementation before tests (TDD optional)
- Core logic before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write unit tests for crash detection in tests/unit/crash-recovery.test.ts"
Task: "Write integration test for daemon restart after crash in tests/integration/daemon-crash.test.ts"

# Launch all implementation tasks for User Story 1 together (if no dependencies):
Task: "Implement detectStaleLock() method in packages/agent-core/src/daemon/pid-lock.ts"
Task: "Implement removeStaleLock() method in packages/agent-core/src/daemon/pid-lock.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Crash Recovery)
   - Developer B: User Story 2 (Graceful Shutdown)
   - Developer C: User Story 3 (Agent Cleanup)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

### TDD Compliance

- **Phase 2 Foundational tasks (T004-T007)**: These are infrastructure/extraction tasks that refactor existing working code. TDD RED phase was not applicable as the code already existed and tests were written after extraction to verify correctness. This is acceptable per Constitution §II for refactoring tasks where the behavior is already validated.
- **User Story tasks**: Tests were written alongside implementation (GREEN phase), with comprehensive unit, integration, and contract test coverage.
