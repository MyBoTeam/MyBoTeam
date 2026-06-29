# Tasks: M3.4 Login Item Auto-Start

**Input**: Design documents from `/specs/007-login-item-auto-start/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Test-First Policy**: Tests are written BEFORE implementation in each user story phase (Constitution Principle II).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan in packages/agent-core/src/daemon/
- [ ] T002 [P] Define TypeScript types for login item entities in packages/agent-core/src/types/login-item.ts
- [ ] T003 [P] Configure vitest for unit testing in packages/agent-core/tests/
- [ ] T004a [P] Implement UserDefaults/AppStorage persistence for auto-start preference in packages/agent-core/src/daemon/login-item-persistence.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Implement LoginItemState enum with state transitions in packages/agent-core/src/daemon/login-item-state.ts
- [ ] T005 [P] Implement AutoStartMethod enum and constants in packages/agent-core/src/types/login-item.ts
- [ ] T006 [P] Create LoginItemLogger for event logging in packages/agent-core/src/daemon/login-item-logger.ts
- [ ] T007 Implement error codes and error handling utilities in packages/agent-core/src/daemon/login-item-errors.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Enable Auto-Start on Login (Priority: P1) 🎯 MVP

**Goal**: Enable daemon to automatically start on macOS login

**Independent Test**: Enable auto-start in settings, verify daemon starts on next login within 5 seconds

### Tests for User Story 1 (TDD - Write FIRST, ensure FAIL before implementation)

> **⚠️ TDD REQUIREMENT**: These tests MUST be written and verified to FAIL before any implementation tasks

- [ ] T008 [P] [US1] Write unit tests for LoginItemManager.enable() in packages/agent-core/tests/unit/daemon/login-item-manager.test.ts
- [ ] T009 [P] [US1] Write unit tests for Accomplish defaults registration in packages/agent-core/tests/unit/daemon/login-item-accomplish.test.ts
- [ ] T010 [P] [US1] Write unit tests for Service Management fallback in packages/agent-core/tests/unit/daemon/login-item-service-mgmt.test.ts
- [ ] T011 [P] [US1] Write unit tests for path validation in packages/agent-core/tests/unit/daemon/login-item-validator.test.ts
- [ ] T012 [US1] Write integration test for enable flow in packages/agent-core/tests/integration/daemon/auto-start-enable.test.ts
- [ ] T013 [US1] Write timing verification test for 5-second startup requirement in packages/agent-core/tests/integration/daemon/startup-timing.test.ts (mock Date.now() to verify timing; measure from enable() call to simulated login completion)

**✅ TDD Checkpoint**: All tests written and verified to FAIL - implementation can now begin

### Implementation for User Story 1

- [ ] T014 [US1] Implement LoginItemManager.enable() method in packages/agent-core/src/daemon/login-item-manager.ts
- [ ] T015 [US1] Implement Accomplish defaults registration pattern in packages/agent-core/src/daemon/login-item-accomplish.ts
- [ ] T016 [US1] Implement Service Management framework fallback in packages/agent-core/src/daemon/login-item-service-mgmt.ts
- [ ] T017 [US1] Implement AutoStartService.enable() in packages/agent-core/src/services/auto-start-service.ts
- [ ] T018 [US1] Add registration success/failure logging in packages/agent-core/src/daemon/login-item-logger.ts
- [ ] T019 [US1] Implement path validation for daemon binary in packages/agent-core/src/daemon/login-item-validator.ts

**✅ Implementation Checkpoint**: Run tests - all must PASS. User Story 1 complete.

---

## Phase 4: User Story 2 - Disable Auto-Start on Login (Priority: P2)

**Goal**: Allow users to disable auto-start and remove daemon from login items

**Independent Test**: Disable auto-start in settings, verify daemon does not start on next login

### Tests for User Story 2 (TDD - Write FIRST, ensure FAIL before implementation)

> **⚠️ TDD REQUIREMENT**: These tests MUST be written and verified to FAIL before any implementation tasks

- [ ] T020 [P] [US2] Write unit tests for LoginItemManager.disable() in packages/agent-core/tests/unit/daemon/login-item-manager.test.ts
- [ ] T021 [P] [US2] Write unit tests for unregistration logic in packages/agent-core/tests/unit/daemon/login-item-accomplish.test.ts
- [ ] T022 [US2] Write integration test for disable flow in packages/agent-core/tests/integration/daemon/auto-start-disable.test.ts

**✅ TDD Checkpoint**: All tests written and verified to FAIL - implementation can now begin

### Implementation for User Story 2

- [ ] T023 [US2] Implement LoginItemManager.disable() method in packages/agent-core/src/daemon/login-item-manager.ts
- [ ] T024 [US2] Implement unregistration logic for both methods in packages/agent-core/src/daemon/login-item-accomplish.ts
- [ ] T025 [US2] Implement AutoStartService.disable() in packages/agent-core/src/services/auto-start-service.ts
- [ ] T026 [US2] Add unregistration logging in packages/agent-core/src/daemon/login-item-logger.ts

**✅ Implementation Checkpoint**: Run tests - all must PASS. User Stories 1 AND 2 complete.

---

## Phase 5: User Story 3 - Check Auto-Start Status (Priority: P3)

**Goal**: Allow users to view current auto-start status and sync with system state

**Independent Test**: Check settings UI shows correct status, verify external changes are detected

### Tests for User Story 3 (TDD - Write FIRST, ensure FAIL before implementation)

> **⚠️ TDD REQUIREMENT**: These tests MUST be written and verified to FAIL before any implementation tasks

- [ ] T027 [P] [US3] Write unit tests for LoginItemManager.getStatus() in packages/agent-core/tests/unit/daemon/login-item-manager.test.ts
- [ ] T028 [P] [US3] Write unit tests for syncWithSystem() in packages/agent-core/tests/unit/daemon/login-item-manager.test.ts
- [ ] T029 [US3] Write integration test for status check flow in packages/agent-core/tests/integration/daemon/auto-start-status.test.ts

**✅ TDD Checkpoint**: All tests written and verified to FAIL - implementation can now begin

### Implementation for User Story 3

- [ ] T030 [US3] Implement LoginItemManager.getStatus() method in packages/agent-core/src/daemon/login-item-manager.ts
- [ ] T031 [US3] Implement LoginItemManager.syncWithSystem() method in packages/agent-core/src/daemon/login-item-manager.ts
- [ ] T032 [US3] Implement AutoStartService.getStatus() in packages/agent-core/src/services/auto-start-service.ts
- [ ] T033 [US3] Implement system state query logic in packages/agent-core/src/daemon/login-item-system-query.ts
- [ ] T034 [US3] Add status check logging in packages/agent-core/src/daemon/login-item-logger.ts

**✅ Implementation Checkpoint**: Run tests - all must PASS. All user stories complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Tests for Cross-Cutting Concerns (TDD)

- [ ] T035 [P] Write test for error retry logic with manual setup instructions in packages/agent-core/tests/unit/daemon/login-item-retry.test.ts
- [ ] T036 [P] Write test for duplicate registration prevention in packages/agent-core/tests/unit/daemon/login-item-manager.test.ts
- [ ] T037 [P] Write test for path update logic on application relocation in packages/agent-core/tests/unit/daemon/login-item-path-update.test.ts

### Implementation for Cross-Cutting Concerns

- [ ] T038 [P] Add error retry logic with manual setup instructions in packages/agent-core/src/daemon/login-item-retry.ts
- [ ] T039 Implement duplicate registration prevention in packages/agent-core/src/daemon/login-item-manager.ts (depends on T014; NOT parallel with T014 due to same file)
- [ ] T040 [P] Add path update logic for application relocation in packages/agent-core/src/daemon/login-item-path-update.ts

### UI Tasks for Settings

- [ ] T041 [P] [US1] Write test for auto-start toggle in packages/agent-core/tests/unit/daemon/auto-start-toggle.test.ts
- [ ] T042 [P] [US3] Write test for status display in packages/agent-core/tests/unit/daemon/auto-start-status-display.test.ts
- [ ] T043 [US1] Implement auto-start toggle UI component in packages/agent-core/src/ui/auto-start-toggle.ts
- [ ] T044 [US3] Implement auto-start status display component in packages/agent-core/src/ui/auto-start-status.ts
- [ ] T045 [US1] Integrate toggle with AutoStartService.enable()/disable() in packages/agent-core/src/ui/auto-start-settings.ts
- [ ] T046 [US3] Integrate status display with AutoStartService.getStatus() in packages/agent-core/src/ui/auto-start-settings.ts

### Validation & Documentation

- [ ] T047 [US1] Run quickstart.md validation for User Story 1
- [ ] T048 [US2] Run quickstart.md validation for User Story 2
- [ ] T049 [US3] Run quickstart.md validation for User Story 3
- [ ] T050 Update documentation in specs/007-login-item-auto-start/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories proceed in priority order (P1 → P2 → P3)
  - Each story follows TDD: Tests → Implementation → Verify
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story (TDD Order)

1. **Tests FIRST** - Write all tests, verify they FAIL
2. **Implementation** - Write code to make tests PASS
3. **Verify** - Run tests, confirm all pass
4. **Checkpoint** - Story complete, independently testable

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- All test tasks within a story marked [P] can run in parallel
- Different files within a story marked [P] can run in parallel
- Once Foundational phase completes, user stories proceed sequentially in priority order

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (TDD - FIRST):
Task: "Write unit tests for LoginItemManager.enable() in packages/agent-core/tests/unit/daemon/login-item-manager.test.ts"
Task: "Write unit tests for Accomplish defaults registration in packages/agent-core/tests/unit/daemon/login-item-accomplish.test.ts"
Task: "Write unit tests for Service Management fallback in packages/agent-core/tests/unit/daemon/login-item-service-mgmt.test.ts"
Task: "Write unit tests for path validation in packages/agent-core/tests/unit/daemon/login-item-validator.test.ts"

# After tests FAIL, launch implementation:
Task: "Implement Accomplish defaults registration pattern in packages/agent-core/src/daemon/login-item-accomplish.ts"
Task: "Implement Service Management framework fallback in packages/agent-core/src/daemon/login-item-service-mgmt.ts"
Task: "Implement path validation for daemon binary in packages/agent-core/src/daemon/login-item-validator.ts"

# After implementation, launch UI tasks:
Task: "Write test for auto-start toggle in packages/agent-core/tests/unit/daemon/auto-start-toggle.test.ts"
Task: "Implement auto-start toggle UI component in packages/agent-core/src/ui/auto-start-toggle.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) - TDD Approach

1. Complete Phase 1: Setup (T001-T004a)
2. Complete Phase 2: Foundational (T004-T007) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1
   - Write ALL tests first (T008-T013)
   - Verify tests FAIL
   - Implement code (T014-T019)
   - Verify tests PASS
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (TDD) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (TDD) → Test independently → Deploy/Demo
4. Add User Story 3 (TDD) → Test independently → Deploy/Demo
5. Add Polish phase (T035-T040) → Cross-cutting concerns
6. Add UI tasks (T041-T046) → Settings integration
7. Each story adds value without breaking previous stories

---

## Notes

- **Total Tasks**: 51 (T001-T050, T004a)
- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD is MANDATORY**: Tests BEFORE implementation (Constitution Principle II)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
