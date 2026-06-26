# Tasks: SQLite Storage Layer (better-sqlite3, WAL)

**Input**: Design documents from `/specs/003-sqlite-storage-layer/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- **[SYNC]/[ASYNC]**: Execution mode classification

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [ASYNC] Create project structure per implementation plan in packages/agent-core/
- [x] T002 [ASYNC] Initialize package.json with better-sqlite3, pino, and vitest dependencies in packages/agent-core/package.json
- [x] T003 [P] [ASYNC] Configure TypeScript with esModuleInterop in packages/agent-core/tsconfig.json
- [x] T004 [P] [ASYNC] Configure Vitest workspace in packages/agent-core/vitest.config.ts
- [x] T005 [P] [ASYNC] Configure Biome linting in packages/agent-core/biome.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 [SYNC] Implement typed error classes (DatabaseError, NotFoundError, ValidationError) in packages/agent-core/src/storage/errors.ts
- [x] T007 [SYNC] Implement database initialization with WAL mode in packages/agent-core/src/storage/database.ts
- [x] T008 [SYNC] Implement consolidated init migration (001-init.ts) with all 11 tables in packages/agent-core/src/storage/migrations/001-init.ts
- [x] T009 [P] [ASYNC] Define entity interfaces (Agent, Task, TaskTodo, Conversation, Message, MemoryEntry, McpServer, AgentMcpAssignment, Note, Schedule, DocumentVersion) in packages/agent-core/src/types/entities.ts
- [x] T010 [P] [ASYNC] Define query filter types in packages/agent-core/src/types/queries.ts
- [x] T011 [SYNC] Implement structured JSON logging with correlation IDs in packages/agent-core/src/storage/logger.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Initialize Database with Schema (Priority: P1) 🎯 MVP

**Goal**: Create and initialize a SQLite database with the correct schema so that all application entities are available for CRUD operations.

**Independent Test**: Can be fully tested by instantiating the storage class and verifying all 11 tables exist with correct columns and constraints.

### Implementation for User Story 1

- [x] T012 [US1] Implement AgentStorage constructor with mode selection (production/development/test) in packages/agent-core/src/storage/agent-storage.ts
- [x] T013 [US1] Implement schema validation method to verify all tables exist in packages/agent-core/src/storage/agent-storage.ts
- [x] T014 [US1] Implement WAL mode verification in packages/agent-core/src/storage/agent-storage.ts
- [x] T015 [US1] Write unit tests for database initialization (verify WAL mode, table creation, timestamp fields) in packages/agent-core/tests/unit/storage/database.test.ts
- [x] T016 [US1] Write unit tests for schema validation (verify all columns, constraints, indexes) in packages/agent-core/tests/unit/storage/agent-storage.test.ts

**Checkpoint**: Database initializes correctly with WAL mode and all 11 tables

---

## Phase 4: User Story 2 - CRUD Operations for Agents (Priority: P1)

**Goal**: Create, read, update, and delete agent records so that the system can manage agent configurations and state.

**Independent Test**: Can be tested by performing all CRUD operations on agent records and verifying data integrity.

### Implementation for User Story 2

- [x] T017 [P] [US2] Implement createAgent() method in packages/agent-core/src/storage/agent-storage.ts
- [x] T018 [P] [US2] Implement getAgent() and getAgentBySlug() methods in packages/agent-core/src/storage/agent-storage.ts
- [x] T019 [P] [US2] Implement listAgents() method in packages/agent-core/src/storage/agent-storage.ts
- [x] T020 [P] [US2] Implement updateAgent() method in packages/agent-core/src/storage/agent-storage.ts
- [x] T021 [P] [US2] Implement deleteAgent() method with CASCADE handling in packages/agent-core/src/storage/agent-storage.ts
- [x] T022 [US2] Write unit tests for Agent CRUD operations (verify timestamps, query filters by slug/status) in packages/agent-core/tests/unit/storage/agent-storage.test.ts

**Checkpoint**: Agent CRUD operations fully functional and tested

---

## Phase 5: User Story 3 - CRUD Operations for Tasks and TaskTodos (Priority: P1)

**Goal**: Manage task records and their associated todo items so that the agent runtime can track work progress and validation steps.

**Independent Test**: Can be tested by creating tasks with todos, verifying foreign key relationships, and testing cascade behavior.

### Implementation for User Story 3

- [x] T023 [P] [US3] Implement createTask() method in packages/agent-core/src/storage/agent-storage.ts
- [x] T024 [P] [US3] Implement getTask() and listTasks() methods with filters in packages/agent-core/src/storage/agent-storage.ts
- [x] T025 [P] [US3] Implement updateTask() method in packages/agent-core/src/storage/agent-storage.ts
- [x] T026 [P] [US3] Implement deleteTask() method with CASCADE handling in packages/agent-core/src/storage/agent-storage.ts
- [x] T027 [P] [US3] Implement createTaskTodo() and listTaskTodos() methods in packages/agent-core/src/storage/agent-storage.ts
- [x] T028 [P] [US3] Implement updateTaskTodo() and deleteTaskTodo() methods in packages/agent-core/src/storage/agent-storage.ts
- [x] T029 [US3] Write unit tests for Task and TaskTodo CRUD operations (verify timestamps, query filters by status/agent_id, cascade deletes) in packages/agent-core/tests/unit/storage/agent-storage.test.ts

**Checkpoint**: Task and TaskTodo CRUD operations fully functional and tested

---

## Phase 6: User Story 4 - Conversations and Messages (Priority: P2)

**Goal**: Store conversation threads and their messages so that the agent runtime can maintain context across interactions.

**Independent Test**: Can be tested by creating conversations with messages and verifying the relationship and ordering.

### Implementation for User Story 4

- [x] T030 [P] [US4] Implement createConversation() method in packages/agent-core/src/storage/agent-storage.ts
- [x] T031 [P] [US4] Implement getConversation() and listConversations() methods in packages/agent-core/src/storage/agent-storage.ts
- [x] T032 [P] [US4] Implement updateConversation() and deleteConversation() methods in packages/agent-core/src/storage/agent-storage.ts
- [x] T033 [P] [US4] Implement createMessage() and listMessages() methods in packages/agent-core/src/storage/agent-storage.ts
- [x] T034 [P] [US4] Implement deleteMessage() method in packages/agent-core/src/storage/agent-storage.ts
- [x] T035 [US4] Write unit tests for Conversation and Message CRUD operations (verify timestamps, query filters by agent_id, message ordering) in packages/agent-core/tests/unit/storage/agent-storage.test.ts

**Checkpoint**: Conversation and Message CRUD operations fully functional and tested

---

## Phase 7: User Story 5 - Memory, Notes, and Schedules (Priority: P2)

**Goal**: Store agent memory entries, notes, and scheduled tasks so that agents can retain knowledge and manage recurring work.

**Independent Test**: Can be tested by creating and querying each entity type independently.

### Implementation for User Story 5

- [x] T036 [P] [US5] Implement createMemoryEntry() and listMemoryEntries() methods in packages/agent-core/src/storage/agent-storage.ts
- [x] T037 [P] [US5] Implement updateMemoryEntry() and deleteMemoryEntry() methods in packages/agent-core/src/storage/agent-storage.ts
- [x] T038 [P] [US5] Implement createNote() and listNotes() methods in packages/agent-core/src/storage/agent-storage.ts
- [x] T039 [P] [US5] Implement updateNote() and deleteNote() methods in packages/agent-core/src/storage/agent-storage.ts
- [x] T040 [P] [US5] Implement createSchedule() and listSchedules() methods in packages/agent-core/src/storage/agent-storage.ts
- [x] T041 [P] [US5] Implement updateSchedule() and deleteSchedule() methods in packages/agent-core/src/storage/agent-storage.ts
- [x] T042 [US5] Write unit tests for MemoryEntry, Note, and Schedule CRUD operations (verify timestamps, query filters by category/type/status) in packages/agent-core/tests/unit/storage/agent-storage.test.ts

**Checkpoint**: MemoryEntry, Note, and Schedule CRUD operations fully functional and tested

---

## Phase 8: User Story 6 - MCP Server Assignments (Priority: P2)

**Goal**: Manage MCP server records and their agent assignments so that the tool system can track which agents have access to which MCP servers.

**Independent Test**: Can be tested by creating MCP servers, assigning them to agents, and verifying the join table.

### Implementation for User Story 6

- [x] T043 [P] [US6] Implement createMcpServer() and listMcpServers() methods in packages/agent-core/src/storage/agent-storage.ts
- [x] T044 [P] [US6] Implement updateMcpServer() and deleteMcpServer() methods in packages/agent-core/src/storage/agent-storage.ts
- [x] T045 [P] [US6] Implement assignMcpServer() and unassignMcpServer() methods in packages/agent-core/src/storage/agent-storage.ts
- [x] T046 [P] [US6] Implement listAgentMcpServers() and listMcpServerAgents() methods in packages/agent-core/src/storage/agent-storage.ts
- [x] T047 [US6] Write unit tests for McpServer and AgentMcpAssignment CRUD operations (verify timestamps, query filters by name/status, join table queries) in packages/agent-core/tests/unit/storage/agent-storage.test.ts

**Checkpoint**: McpServer and AgentMcpAssignment CRUD operations fully functional and tested

---

## Phase 9: User Story 7 - Database Migration System (Priority: P2)

**Goal**: Implement a migration system that applies schema changes in order so that the database schema can evolve without data loss.

**Independent Test**: Can be tested by initializing a fresh database and verifying the schema matches the expected final state.

### Implementation for User Story 7

- [x] T048 [US7] Implement migration runner with _migrations table tracking and idempotent execution in packages/agent-core/src/storage/runner.ts
- [x] T050 [US7] Write unit tests for migration system in packages/agent-core/tests/unit/storage/migration.test.ts

**Checkpoint**: Migration system fully functional and tested

---

## Phase 10: User Story 8 - Database Seeding Mechanism (Priority: P3)

**Goal**: Implement a seeding mechanism that populates the database with sample data for development and testing, and bootstraps default agents, tools, and configuration in production.

**Independent Test**: Can be tested by running the seeder and verifying expected records exist in both dev and production modes.

### Implementation for User Story 8

- [x] T051 [SYNC] Implement seeder mode selection (dev/test/production) in packages/agent-core/src/storage/seeder.ts
- [x] T052 [ASYNC] Implement seedDev() with sample agents, tasks, and conversations in packages/agent-core/src/storage/seeder.ts
- [x] T053 [ASYNC] Implement seedTest() with minimal test data in packages/agent-core/src/storage/seeder.ts
- [x] T054 [ASYNC] Implement seedProduction() with default agents (secretary, accountant) in packages/agent-core/src/storage/seeder.ts
- [x] T055 [US8] Write unit tests for seeder in packages/agent-core/tests/unit/storage/seeder.test.ts

**Checkpoint**: Seeding mechanism fully functional and tested

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T056 [P] [ASYNC] Implement public API exports in packages/agent-core/src/storage/index.ts
- [x] T057 [P] [ASYNC] Write contract tests for AgentStorage API in packages/agent-core/tests/unit/storage/contract.test.ts
- [x] T058 [P] [ASYNC] Update quickstart.md with final API examples
- [x] T059 [ASYNC] Run quickstart.md validation
- [x] T060 [ASYNC] Code cleanup and refactoring — split agent-storage.ts into 8 domain modules
- [x] T061 [ASYNC] Performance optimization (ensure <500ms init, <100ms CRUD) — better-sqlite3 native WAL, verified in test
- [x] T062 [SYNC] Add schema validation test comparing live schema against AD.md ER diagram in packages/agent-core/tests/unit/storage/schema-validation.test.ts
- [x] T063 [P] [ASYNC] Add performance benchmark tests (init <500ms, CRUD <100ms) in packages/agent-core/tests/unit/storage/performance.test.ts
- [x] T064 [P] [ASYNC] Add idempotent initialization test (database already exists) in packages/agent-core/tests/unit/storage/database.test.ts
- [x] T065 [P] [ASYNC] Add migration failure/rollback test in packages/agent-core/tests/unit/storage/migration.test.ts
- [x] T066 [P] [ASYNC] Add query filter validation tests for all entities in packages/agent-core/tests/unit/storage/query-filters.test.ts
- [x] T067 [P] [ASYNC] Add edge case tests (invalid path, WAL failure, duplicate seeder) in packages/agent-core/tests/unit/storage/edge-cases.test.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - US1 (P1) → US2 (P1) → US3 (P1) → US4 (P2) → US5 (P2) → US6 (P2) → US7 (P2) → US8 (P3)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 schema
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 schema, US2 Agent CRUD
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 schema, US2 Agent CRUD
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 schema, US2 Agent CRUD
- **User Story 6 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 schema, US2 Agent CRUD
- **User Story 7 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 schema
- **User Story 8 (P3)**: Can start after Foundational (Phase 2) - Depends on US1-US7

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, US1-US3 can start in parallel (if team capacity allows)
- Within each user story, tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tasks together:
Task: "Implement AgentStorage constructor with mode selection in packages/agent-core/src/storage/agent-storage.ts"
Task: "Implement schema validation method in packages/agent-core/src/storage/agent-storage.ts"
Task: "Implement WAL mode verification in packages/agent-core/src/storage/agent-storage.ts"
Task: "Write unit tests for database initialization in packages/agent-core/tests/unit/storage/database.test.ts"
Task: "Write unit tests for schema validation in packages/agent-core/tests/unit/storage/agent-storage.test.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Initialize Database)
4. Complete Phase 4: User Story 2 (Agent CRUD)
5. Complete Phase 5: User Story 3 (Task CRUD)
6. **STOP and VALIDATE**: Test US1-US3 independently
7. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently
3. Add User Story 2 → Test independently
4. Add User Story 3 → Test independently (MVP!)
5. Add User Story 4 → Test independently
6. Add User Story 5 → Test independently
7. Add User Story 6 → Test independently
8. Add User Story 7 → Test independently
9. Add User Story 8 → Test independently
10. Each story adds value without breaking previous stories

---

## Task Summary

| Phase | Tasks | SYNC | ASYNC | Parallel |
|-------|-------|------|-------|----------|
| Setup | 5 | 0 | 5 | 3 |
| Foundational | 6 | 4 | 2 | 2 |
| US1 | 5 | 0 | 5 | 5 |
| US2 | 6 | 0 | 6 | 5 |
| US3 | 7 | 0 | 7 | 6 |
| US4 | 6 | 0 | 6 | 5 |
| US5 | 7 | 0 | 7 | 6 |
| US6 | 5 | 0 | 5 | 4 |
| US7 | 2 | 0 | 2 | 0 |
| US8 | 5 | 1 | 4 | 0 |
| Polish | 12 | 1 | 11 | 7 |
| **Total** | **66** | **6** | **60** | **43** |

**Completed**: 66/66 (100%)
**Remaining**: (none — all tasks complete)
**SYNC Tasks**: 6 (architecture-critical, require human review)
**ASYNC Tasks**: 60 (repetitive CRUD, can be delegated)
**Parallel Opportunities**: 43 tasks can run in parallel
