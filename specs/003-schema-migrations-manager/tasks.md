# Tasks: Schema Migrations Manager

**Input**: Design documents from `/specs/003-schema-migrations-manager/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Unit and integration tests included as requested in spec (Test-First Quality principle).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create migration directory structure in packages/agent-core/src/storage/migrations/
- [ ] T002 Create seed directory structure in packages/agent-core/src/storage/seeds/
- [ ] T003 [P] Create migration types file in packages/agent-core/src/storage/migrations/types.ts
- [ ] T004 [P] Create seed types file in packages/agent-core/src/storage/seeds/types.ts
- [ ] T005 [P] Create migration index file in packages/agent-core/src/storage/migrations/index.ts
- [ ] T006 [P] Create seed index file in packages/agent-core/src/storage/seeds/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Implement migration table schema creation in packages/agent-core/src/storage/migrations/manager.ts
- [ ] T008 Implement file-based lock mechanism in packages/agent-core/src/storage/migrations/lock.ts
- [ ] T009 Implement migration file loader in packages/agent-core/src/storage/migrations/loader.ts
- [ ] T010 Implement migration validator in packages/agent-core/src/storage/migrations/validator.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Automatic Migration on Startup (Priority: P1) 🎯 MVP

**Goal**: When the application starts, automatically detect and apply pending database schema migrations

**Independent Test**: Start application with pending migrations and verify they are applied in correct order

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T011 [P] [US1] Unit test for migration table creation in packages/agent-core/tests/unit/storage/migrations/manager.test.ts
- [ ] T012 [P] [US1] Unit test for pending migration detection in packages/agent-core/tests/unit/storage/migrations/manager.test.ts
- [ ] T013 [P] [US1] Unit test for migration apply in version order in packages/agent-core/tests/unit/storage/migrations/manager.test.ts
- [ ] T014 [P] [US1] Unit test for already-applied migration skip in packages/agent-core/tests/unit/storage/migrations/manager.test.ts
- [ ] T015 [P] [US1] Integration test for full migration apply flow in packages/agent-core/tests/integration/storage/migrations/manager.test.ts
- [ ] T015a [P] [US1] Unit test for migration failure midway (transaction rollback) in packages/agent-core/tests/unit/storage/migrations/manager.test.ts
- [ ] T015b [P] [US1] Unit test for database connection loss during migration in packages/agent-core/tests/unit/storage/migrations/manager.test.ts
- [ ] T015c [P] [US1] Unit test for concurrent migration attempts (lock error) in packages/agent-core/tests/unit/storage/migrations/manager.test.ts

### Implementation for User Story 1

- [ ] T016 [US1] Implement apply() method in packages/agent-core/src/storage/migrations/manager.ts
- [ ] T017 [US1] Implement lock acquisition in apply() method in packages/agent-core/src/storage/migrations/manager.ts
- [ ] T018 [US1] Implement pending migration filtering in packages/agent-core/src/storage/migrations/manager.ts
- [ ] T019 [US1] Implement sequential migration execution in packages/agent-core/src/storage/migrations/manager.ts
- [ ] T020 [US1] Implement lock release in apply() method in packages/agent-core/src/storage/migrations/manager.ts
- [ ] T021 [US1] Add migration logging in packages/agent-core/src/storage/migrations/manager.ts

**Checkpoint**: User Story 1 should be fully functional - migrations apply on startup

---

## Phase 4: User Story 3 - Idempotent Migration Execution (Priority: P1)

**Goal**: Migrations can be run multiple times without side effects

**Independent Test**: Run same migration twice and verify database state unchanged after second run

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T022 [P] [US3] Unit test for idempotent migration execution in packages/agent-core/tests/unit/storage/migrations/manager.test.ts
- [ ] T023 [P] [US3] Unit test for migration table recreation on corruption in packages/agent-core/tests/unit/storage/migrations/manager.test.ts
- [ ] T024 [P] [US3] Integration test for idempotent apply flow in packages/agent-core/tests/integration/storage/migrations/manager.test.ts

### Implementation for User Story 3

- [ ] T025 [US3] Implement idempotent check in apply() method in packages/agent-core/src/storage/migrations/manager.ts
- [ ] T026 [US3] Implement migration table existence check in packages/agent-core/src/storage/migrations/manager.ts
- [ ] T027 [US3] Implement migration table recreation logic in packages/agent-core/src/storage/migrations/manager.ts

**Checkpoint**: User Stories 1 AND 3 should both work - migrations are idempotent

---

## Phase 5: User Story 2 - Migration Rollback (Priority: P2)

**Goal**: Provide mechanism to roll back to specific target version

**Independent Test**: Apply multiple migrations, rollback to target version, verify schema reverts correctly

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T028 [P] [US2] Unit test for rollback to target version in packages/agent-core/tests/unit/storage/migrations/manager.test.ts
- [ ] T029 [P] [US2] Unit test for rollback with missing down migration in packages/agent-core/tests/unit/storage/migrations/manager.test.ts
- [ ] T030 [P] [US2] Unit test for rollback success verification in packages/agent-core/tests/unit/storage/migrations/manager.test.ts
- [ ] T031 [P] [US2] Integration test for full rollback flow in packages/agent-core/tests/integration/storage/migrations/manager.test.ts
- [ ] T031a [P] [US2] Unit test for rollback failure when down migration missing in packages/agent-core/tests/unit/storage/migrations/manager.test.ts

### Implementation for User Story 2

- [ ] T032 [US2] Implement rollback() method in packages/agent-core/src/storage/migrations/manager.ts
- [ ] T033 [US2] Implement target version validation in packages/agent-core/src/storage/migrations/manager.ts
- [ ] T034 [US2] Implement reverse order down migration execution in packages/agent-core/src/storage/migrations/manager.ts
- [ ] T035 [US2] Implement migration record deletion on rollback in packages/agent-core/src/storage/migrations/manager.ts
- [ ] T036 [US2] Add rollback logging in packages/agent-core/src/storage/migrations/manager.ts

**Checkpoint**: User Stories 1, 2, AND 3 should all work - migrations apply and rollback correctly

---

## Phase 6: User Story 4 - Init Migration Consolidation (Priority: P2)

**Goal**: Consolidate all existing migrations into single initialization migration file

**Independent Test**: Deploy to fresh database and verify only init migration runs

### Tests for User Story 4 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T037 [P] [US4] Unit test for init migration detection in packages/agent-core/tests/unit/storage/migrations/manager.test.ts
- [ ] T038 [P] [US4] Unit test for init migration apply on fresh database in packages/agent-core/tests/unit/storage/migrations/manager.test.ts
- [ ] T039 [P] [US4] Unit test for init migration skip on existing database in packages/agent-core/tests/unit/storage/migrations/manager.test.ts
- [ ] T040 [P] [US4] Integration test for init migration flow in packages/agent-core/tests/integration/storage/migrations/manager.test.ts

### Implementation for User Story 4

- [ ] T041 [US4] Create init migration file in packages/agent-core/src/storage/migrations/001_init.ts
- [ ] T042 [US4] Implement init migration detection in packages/agent-core/src/storage/migrations/manager.ts
- [ ] T043 [US4] Implement init migration apply logic in packages/agent-core/src/storage/migrations/manager.ts
- [ ] T044 [US4] Implement init migration skip logic for existing databases in packages/agent-core/src/storage/migrations/manager.ts

**Checkpoint**: User Stories 1, 2, 3, AND 4 should all work - init migration consolidation complete

---

## Phase 7: User Story 5 - Seeding Mechanism (Priority: P3)

**Goal**: Basic seeding mechanism for inserting initial data after migrations

**Independent Test**: Create seed file and verify data is inserted after migrations

### Tests for User Story 5 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T045 [P] [US5] Unit test for seed manager initialization in packages/agent-core/tests/unit/storage/seeds/manager.test.ts
- [ ] T046 [P] [US5] Unit test for empty seed list in packages/agent-core/tests/unit/storage/seeds/manager.test.ts
- [ ] T047 [P] [US5] Unit test for seed execution order in packages/agent-core/tests/unit/storage/seeds/manager.test.ts
- [ ] T048 [P] [US5] Integration test for seed flow in packages/agent-core/tests/integration/storage/seeds/manager.test.ts
- [ ] T048a [P] [US5] Unit test for seed execution order (after migrations) in packages/agent-core/tests/unit/storage/seeds/manager.test.ts

### Implementation for User Story 5

- [ ] T049 [US5] Implement SeedManager class in packages/agent-core/src/storage/seeds/manager.ts
- [ ] T050 [US5] Implement seed file loader in packages/agent-core/src/storage/seeds/manager.ts
- [ ] T051 [US5] Implement seed execution in packages/agent-core/src/storage/seeds/manager.ts
- [ ] T052 [US5] Implement seed idempotency check in packages/agent-core/src/storage/seeds/manager.ts
- [ ] T053 [US5] Add seed logging in packages/agent-core/src/storage/seeds/manager.ts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T054 [P] Update storage index to export migrations and seeds in packages/agent-core/src/storage/index.ts
- [ ] T055 [P] Add comprehensive error handling across all managers
- [ ] T056 [P] Add performance logging for migration duration
- [ ] T057 Run quickstart.md validation scenarios
- [ ] T058 Code cleanup and refactoring
- [ ] T057a [P] Performance test for SC-001 (50 migrations under 5s) in packages/agent-core/tests/integration/storage/migrations/performance.test.ts
- [ ] T057b [P] Performance test for SC-004 (single migration rollback under 10s) in packages/agent-core/tests/integration/storage/migrations/performance.test.ts
- [ ] T057c [P] Idempotency test for SC-006 (100 runs without side effects) in packages/agent-core/tests/integration/storage/migrations/performance.test.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (P1) and US3 (P1) can proceed in parallel after Phase 2
  - US2 (P2) depends on US1 (needs apply() to be implemented)
  - US4 (P2) depends on US1 (needs migration file loading)
  - US5 (P3) can proceed independently after Phase 2
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after US1 (needs apply() for rollback logic)
- **User Story 4 (P2)**: Can start after US1 (needs migration file loading)
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Independent of other stories

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Models/types before services
- Services before integration
- Core implementation before logging
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, US1 and US3 can start in parallel
- All tests for a user story marked [P] can run in parallel
- US5 can run in parallel with US1/US3 after Phase 2

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for migration table creation in packages/agent-core/tests/unit/storage/migrations/manager.test.ts"
Task: "Unit test for pending migration detection in packages/agent-core/tests/unit/storage/migrations/manager.test.ts"
Task: "Unit test for migration apply in version order in packages/agent-core/tests/unit/storage/migrations/manager.test.ts"
Task: "Unit test for already-applied migration skip in packages/agent-core/tests/unit/storage/migrations/manager.test.ts"
Task: "Integration test for full migration apply flow in packages/agent-core/tests/integration/storage/migrations/manager.test.ts"

# Then implement (sequential due to shared manager.ts):
Task: "Implement apply() method in packages/agent-core/src/storage/migrations/manager.ts"
Task: "Implement lock acquisition in apply() method"
Task: "Implement pending migration filtering"
Task: "Implement sequential migration execution"
Task: "Implement lock release in apply() method"
Task: "Add migration logging"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Automatic Migration on Startup)
4. Complete Phase 4: User Story 3 (Idempotent Migration Execution)
5. **STOP and VALIDATE**: Test US1 + US3 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 + US3 → Test independently → Deploy/Demo (MVP!)
3. Add US2 → Test independently → Deploy/Demo (Rollback support)
4. Add US4 → Test independently → Deploy/Demo (Init consolidation)
5. Add US5 → Test independently → Deploy/Demo (Seeding foundation)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 + US3 (P1 stories)
   - Developer B: US2 + US4 (P2 stories)
   - Developer C: US5 (P3 story)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
