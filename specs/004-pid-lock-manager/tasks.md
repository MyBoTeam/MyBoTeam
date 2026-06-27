# Tasks: PID Lock Manager

**Input**: Design documents from `/specs/004-pid-lock-manager/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Types, error classes, and interfaces shared by all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 [P] [ASYNC] Create PidLockPayload interface, PidLockHandle type (with isAcquired property), and PidLockError class in packages/agent-core/src/daemon/pid-lock.ts
- [x] T002 [P] [ASYNC] Write unit tests for PidLockError and type exports in packages/agent-core/tests/unit/pid-lock.test.ts
- [x] T014 [P] [ASYNC] Create getPidFilePath(dataDir) stub in packages/agent-core/src/daemon/socket-path.ts (returns `{dataDir}/daemon.pid` — to be replaced by M2-5 Data Directory Manager)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 2: User Story 1 — Acquire PID Lock on Startup (Priority: P1) 🎯 MVP

**Goal**: Daemon acquires exclusive PID lock on startup, fails fast if another instance is running

**Independent Test**: Start daemon twice — second instance fails with PidLockError containing existingPid

### Tests for User Story 1 (TDD — write FIRST)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T003 [P] [US1] [ASYNC] Write unit tests for acquirePidLock (no lock, live conflict, stale detection) in packages/agent-core/tests/unit/pid-lock.test.ts
- [x] T004 [P] [US1] [SYNC] Write integration test for atomic race condition prevention in packages/agent-core/tests/integration/pid-lock.test.ts — include performance assertions: lock acquisition <100ms when conflict detected (SC-001), stale detection <50ms (SC-002), normal acquire/release <50ms (SC-003)

### Implementation for User Story 1

- [x] T005 [US1] [SYNC] Implement acquirePidLock() with atomic linkSync, stale detection (isPidAlive, readPidPayload), and retry logic in packages/agent-core/src/daemon/pid-lock.ts

**Checkpoint**: User Story 1 fully functional — daemon acquires lock, detects conflicts, handles stale locks

---

## Phase 3: User Story 2 — Release PID Lock on Shutdown (Priority: P1)

**Goal**: Daemon releases PID lock on graceful shutdown so subsequent starts can acquire cleanly

**Independent Test**: Start daemon, send SIGTERM, verify PID file is removed

### Tests for User Story 2 (TDD — write FIRST)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T006 [P] [US2] [ASYNC] Write unit tests for release() (idempotent, file removed, signal handlers) in packages/agent-core/tests/unit/pid-lock.test.ts

### Implementation for User Story 2

- [x] T007 [US2] [SYNC] Implement release() method on PidLockHandle (idempotent unlinkSync) and register SIGINT/SIGTERM handlers in packages/agent-core/src/daemon/pid-lock.ts

**Checkpoint**: User Stories 1 AND 2 both functional — full lock lifecycle works

---

## Phase 4: User Story 3 — Stale Lock Detection and Cleanup (Priority: P1)

**Goal**: Automatic recovery from stale locks without manual intervention

**Independent Test**: Create PID file with non-existent PID, verify daemon acquires lock

### Tests for User Story 3 (TDD — write FIRST)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T008 [P] [US3] [ASYNC] Write unit tests for stale lock scenarios (dead process, corrupted file, different user) in packages/agent-core/tests/unit/pid-lock.test.ts

### Implementation for User Story 3

- [x] T009 [US3] [ASYNC] Ensure isPidAlive() handles ESRCH (stale), EPERM (valid), and corrupted payload gracefully in packages/agent-core/src/daemon/pid-lock.ts

**Checkpoint**: All P1 user stories functional — lock acquire, release, and stale recovery complete

---

## Phase 5: User Story 4 — Agent PID Tracking (Priority: P2)

**Goal**: Track agent child process PIDs for cleanup on daemon shutdown

**Independent Test**: Save agent PIDs, call cleanup, verify SIGTERM sent to each

### Tests for User Story 4 (TDD — write FIRST)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T010 [P] [US4] [ASYNC] Write unit tests for saveAgentPids() and cleanupAgentProcesses() in packages/agent-core/tests/unit/pid-lock.test.ts — include timing assertion: agent processes must receive SIGTERM within 5 seconds (SC-006)

### Implementation for User Story 4

- [x] T011 [US4] [ASYNC] Implement saveAgentPids(dataDir, pids) and cleanupAgentProcesses(dataDir) in packages/agent-core/src/daemon/pid-lock.ts — cleanupAgentProcesses MUST terminate agents within 5 seconds (SC-006)

**Checkpoint**: All user stories functional — core lock + agent PID tracking complete

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Exports, validation, and completeness

- [x] T012 [P] [ASYNC] Add barrel exports to packages/agent-core/src/daemon/index.ts (acquirePidLock, PidLockError, PidLockHandle, PidLockPayload, saveAgentPids, cleanupAgentProcesses, getPidFilePath)
- [x] T013 [ASYNC] Validate all tasks pass and run quickstart.md examples end-to-end
- [x] T015 [ASYNC] Add integration test verifying PID lock operations do not interfere with database WAL mode (SC-005) in packages/agent-core/tests/integration/pid-lock.test.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — can start immediately
- **US1 Acquire (Phase 2)**: Depends on Phase 1 completion — BLOCKS Phases 3, 4
- **US2 Release (Phase 3)**: Depends on Phase 1 completion — can parallel with Phase 2
- **US3 Stale (Phase 4)**: Depends on Phase 1 completion — can parallel with Phase 2
- **US4 Agent PIDs (Phase 5)**: Depends on Phase 1 completion — can parallel with Phases 2-4
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 Acquire (P1)**: Can start after Foundational — No dependencies on other stories
- **US2 Release (P1)**: Can start after Foundational — Independent (operates on same file, so sequential with US1 if same developer)
- **US3 Stale (P1)**: Can start after Foundational — Builds on isPidAlive from US1 (sequential with US1)
- **US4 Agent PIDs (P2)**: Can start after Foundational — Fully independent from US1-US3

### Within Each User Story

- Tests (TDD) MUST be written and FAIL before implementation
- Types/interfaces before core logic
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T001, T002, T014 (types, tests, socket-path stub) can run in parallel
- T003 and T004 (US1 tests) can run in parallel
- T006 (US2 tests) can run in parallel with T003/T004
- T008 (US3 tests) can run in parallel with T003/T004/T006
- T010 (US4 tests) can run in parallel with all other test tasks
- T012 (barrel exports) can run in parallel with implementation tasks

---

## Parallel Execution Examples

### Example 1: Parallel Test Writing (TDD)

```bash
# Launch all test tasks in parallel:
Task T003: "Write unit tests for acquirePidLock in packages/agent-core/tests/unit/pid-lock.test.ts"
Task T004: "Write integration test for atomic race condition in packages/agent-core/tests/integration/pid-lock.test.ts"
Task T006: "Write unit tests for release() in packages/agent-core/tests/unit/pid-lock.test.ts"
Task T008: "Write unit tests for stale lock scenarios in packages/agent-core/tests/unit/pid-lock.test.ts"
Task T010: "Write unit tests for saveAgentPids() in packages/agent-core/tests/unit/pid-lock.test.ts"
```

### Example 2: Parallel Implementation (After TDD)

```bash
# Launch implementation tasks in parallel (different stories):
Task T007: "Implement release() in packages/agent-core/src/daemon/pid-lock.ts"
Task T011: "Implement saveAgentPids/cleanupAgentProcesses in packages/agent-core/src/daemon/pid-lock.ts"
Task T012: "Add barrel exports in packages/agent-core/src/daemon/index.ts"
Task T015: "Add WAL mode integration test in packages/agent-core/tests/integration/pid-lock.test.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Foundational (types + errors)
2. Complete Phase 2: US1 Acquire lock
3. Complete Phase 3: US2 Release lock
4. Complete Phase 4: US3 Stale detection
5. **STOP and VALIDATE**: Full lock lifecycle works
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add US1 Acquire → Test independently → Deploy/Demo (MVP!)
3. Add US2 Release → Test independently → Deploy/Demo
4. Add US3 Stale Detection → Test independently → Deploy/Demo
5. Add US4 Agent PIDs → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
