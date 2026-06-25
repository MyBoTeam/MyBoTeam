# Tasks: pnpm Workspace + Monorepo Scaffold

**Input**: Design documents from `/specs/002-pnpm-workspace-scaffold/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: Not included — scaffold only (config files, no application code)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: User Story 1 - Initialize Monorepo Structure (Priority: P1) 🎯 MVP

**Goal**: Set up pnpm workspace with defined package locations and root scripts

**Independent Test**: Run `pnpm install` in root directory and verify workspace configuration is recognized

### Implementation for User Story 1

- [x] T001 [P] [ASYNC] [US1] Create pnpm-workspace.yaml with workspace patterns and onlyBuiltDependencies in pnpm-workspace.yaml
- [x] T002 [P] [ASYNC] [US1] Create root package.json with build/dev/check/test scripts using pnpm -r in package.json
- [x] T003 [SYNC] [US1] Run pnpm install to verify workspace configuration works

**Checkpoint**: User Story 1 complete — workspace configuration is functional

---

## Phase 2: User Story 2 - Configure Node Version (Priority: P2)

**Goal**: Enforce consistent Node.js version 24 across all contributors

**Independent Test**: Verify pnpm uses Node.js version 24 as specified in .npmrc

### Implementation for User Story 2

- [x] T004 [P] [ASYNC] [US2] Create .npmrc with use-node-version=24 in .npmrc
- [x] T005 [SYNC] [US2] Verify pnpm uses Node.js version 24 by running pnpm install

**Checkpoint**: User Story 2 complete — Node.js version is enforced

---

## Phase 3: User Story 3 - Verify Directory Structure (Priority: P3)

**Goal**: Ensure apps/ and packages/ directories exist for future packages

**Independent Test**: List root directory and verify apps/ and packages/ directories exist

### Implementation for User Story 3

- [x] T006 [P] [ASYNC] [US3] Create apps/ directory at repository root
- [x] T007 [P] [ASYNC] [US3] Create packages/ directory at repository root
- [x] T008 [P] [ASYNC] [US3] Create packages/mcp-servers/ subdirectory
- [x] T009 [SYNC] [US3] Verify all directories exist and are accessible

**Checkpoint**: User Story 3 complete — directory structure is ready

---

## Phase 4: Validation & Cross-Cutting Concerns

**Purpose**: Final validation that all success criteria are met

- [x] T010 [SYNC] Run full validation: pnpm install, directory check, script verification
- [x] T011 [SYNC] Update Linear issue MAO-137 with completion status (Administrative — no requirement mapping needed)

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 1 (Phase 1)**: No dependencies — can start immediately
- **User Story 2 (Phase 2)**: Can start after Phase 1 (independent, but logical ordering)
- **User Story 3 (Phase 3)**: Can start after Phase 1 (independent, but logical ordering)
- **Validation (Phase 4)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories
- **User Story 2 (P2)**: Can run in parallel with US1 (different files)
- **User Story 3 (P3)**: Can run in parallel with US1/US2 (different directories)

### Within Each User Story

- Configuration files first (US1, US2)
- Directories second (US3)
- Validation after all files/directories created

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T004 can run in parallel with T001/T002 (different file)
- T006, T007, T008 can run in parallel (different directories)

---

## Parallel Example: User Story 1

```bash
# Launch both config file tasks together:
Task: "Create pnpm-workspace.yaml with workspace patterns in pnpm-workspace.yaml"
Task: "Create root package.json with scripts in package.json"
```

---

## Parallel Example: User Story 3

```bash
# Launch all directory creation tasks together:
Task: "Create apps/ directory at repository root"
Task: "Create packages/ directory at repository root"
Task: "Create packages/mcp-servers/ subdirectory"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete User Story 1: Create pnpm-workspace.yaml and package.json
2. **STOP and VALIDATE**: Run `pnpm install` to verify workspace works
3. User Story 1 alone delivers value — workspace is functional

### Incremental Delivery

1. Complete User Story 1 → Verify `pnpm install` works → Workspace functional
2. Add User Story 2 → Verify Node.js version → Environment standardized
3. Add User Story 3 → Verify directories → Structure complete
4. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Developer A: User Story 1 (config files)
2. Developer B: User Story 2 (Node.js version) — can run in parallel
3. Developer C: User Story 3 (directories) — can run in parallel
4. All stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No tests included — scaffold only (config files, no application code)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
