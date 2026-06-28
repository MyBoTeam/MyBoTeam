# Tasks: Data Directory Manager

**Input**: Design documents from `/specs/005-data-directory-manager/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan in packages/daemon/src/
- [ ] T002 Extend existing TypeScript project with Node.js built-in modules (fs, path, os, crypto) in packages/daemon/src/
- [ ] T003 [P] Configure Vitest testing framework in packages/daemon/tests/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Implement PathResolver.getDataDir() in packages/daemon/src/path-resolver.ts
- [ ] T005 Implement PathResolver.getSocketPath() in packages/daemon/src/path-resolver.ts
- [ ] T006 [P] Implement PathResolver.getSkillsDir() in packages/daemon/src/path-resolver.ts (supporting infrastructure)
- [ ] T007 [P] Implement PathResolver.getPidFilePath() in packages/daemon/src/path-resolver.ts (supporting infrastructure)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Initialize Data Directory (Priority: P1) 🎯 MVP

**Goal**: Automatically create data directory at ~/.myboteam/ with standard subdirectories

**Independent Test**: Run application for first time and verify directory structure is created correctly

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T008 [P] [US1] Unit test for PathResolver.getDataDir() in packages/daemon/tests/path-resolver.test.ts
- [ ] T009 [P] [US1] Unit test for DataDirectoryManager.ensureDirectories() in packages/daemon/tests/data-directory.test.ts
- [ ] T010 [P] [US1] Integration test for directory creation in packages/daemon/tests/integration/directory-creation.test.ts
- [ ] T010a [P] [US1] Unit test for idempotency (FR-004): run ensureDirectories() twice, verify no error and existing contents preserved in packages/daemon/tests/data-directory.test.ts

### Implementation for User Story 1

- [ ] T011 [US1] Implement DataDirectoryManager class in packages/daemon/src/data-directory.ts
- [ ] T012 [US1] Implement ensureDirectories() method with recursive directory creation
- [ ] T013 [US1] Implement subdirectory creation (data, logs, vault)
- [ ] T014 [US1] Add logging for directory creation events
- [ ] T015 [US1] Add error handling for permission denied scenarios

**Checkpoint**: User Story 1 fully functional - data directory created on first run

---

## Phase 4: User Story 2 - Configure Custom Data Directory (Priority: P2)

**Goal**: Support custom data directory via MYBOTEAM_DATA_DIR environment variable

**Independent Test**: Set MYBOTEAM_DATA_DIR and verify application uses custom path

### Tests for User Story 2

- [ ] T016 [P] [US2] Unit test for MYBOTEAM_DATA_DIR in packages/daemon/tests/path-resolver.test.ts
- [ ] T017 [P] [US2] Integration test for custom path in packages/daemon/tests/integration/custom-path.test.ts

### Implementation for User Story 2

- [ ] T018 [US2] Update PathResolver.getDataDir() to respect MYBOTEAM_DATA_DIR
- [ ] T019 [US2] Add validation for custom path (non-empty, valid format)
- [ ] T020 [US2] Add error handling for invalid custom paths
- [ ] T021 [US2] Add logging for custom path resolution

**Checkpoint**: User Story 2 functional - custom paths supported

---

## Phase 5: User Story 3 - Cross-Platform Path Resolution (Priority: P3)

**Goal**: Ensure correct path resolution on Windows, macOS, and Linux

**Independent Test**: Run on different operating systems and verify correct default path

### Tests for User Story 3

- [ ] T022 [P] [US3] Unit test for Windows named pipe path in packages/daemon/tests/path-resolver.test.ts
- [ ] T023 [P] [US3] Unit test for Unix socket path in packages/daemon/tests/path-resolver.test.ts
- [ ] T024 [P] [US3] Platform-specific integration tests in packages/daemon/tests/integration/cross-platform.test.ts

### Implementation for User Story 3

- [ ] T025 [US3] Implement Windows named pipe path resolution in packages/daemon/src/path-resolver.ts
- [ ] T026 [US3] Implement Unix socket path resolution in packages/daemon/src/path-resolver.ts
- [ ] T027 [US3] Add platform-specific logging
- [ ] T028 [US3] Test on Windows, macOS, and Linux environments

**Checkpoint**: User Story 3 functional - cross-platform compatibility achieved

---

## Phase 6: User Story 4 - Clean Data Directory (Priority: P4)

**Goal**: Support pnpm dev:clean command to delete entire data directory

**Independent Test**: Run pnpm dev:clean and verify data directory is completely removed

### Tests for User Story 4

- [ ] T029 [P] [US4] Unit test for DataDirectoryManager.clean() in packages/daemon/tests/data-directory.test.ts
- [ ] T030 [P] [US4] Integration test for clean operation in packages/daemon/tests/integration/clean.test.ts

### Implementation for User Story 4

- [ ] T031 [US4] Implement DataDirectoryManager.clean() method in packages/daemon/src/data-directory.ts
- [ ] T032 [US4] Add error handling for non-existent directory
- [ ] T033 [US4] Add pnpm dev:clean script to packages/daemon/package.json
- [ ] T034 [US4] Add logging for clean operation

**Checkpoint**: User Story 4 functional - clean command works correctly

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T035 [P] Add file locking for concurrent access in packages/daemon/src/data-directory.ts
- [ ] T036 [P] Add comprehensive unit tests in packages/daemon/tests/unit/
- [ ] T037 [P] Add integration tests in packages/daemon/tests/integration/
- [ ] T038 Update quickstart.md with implementation details
- [ ] T039 Run quickstart.md validation
- [ ] T040 Code cleanup and refactoring

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - May integrate with US1/US2/US3 but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for PathResolver.getDataDir() in packages/daemon/tests/path-resolver.test.ts"
Task: "Unit test for DataDirectoryManager.ensureDirectories() in packages/daemon/tests/data-directory.test.ts"
Task: "Integration test for directory creation in packages/daemon/tests/integration/directory-creation.test.ts"

# Launch implementation tasks for User Story 1:
Task: "Implement DataDirectoryManager class in packages/daemon/src/data-directory.ts"
Task: "Implement ensureDirectories() method with recursive directory creation"
Task: "Implement subdirectory creation (data, logs, vault)"
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
5. Add User Story 4 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
   - Developer D: User Story 4
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
