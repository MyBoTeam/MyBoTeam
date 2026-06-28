# Tasks: JSON-RPC Unix Socket Server

**Input**: Design documents from `/specs/006-json-rpc-unix-socket/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included as requested in the feature specification (FR-008 requires unit, integration, and contract tests).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Source Reference**: v0.2.0 (`/Users/mavishay/Projects/MaorInnovations/myboteam_V0.2.0/packages/daemon/src/`) and Accomplish (`/Users/mavishay/Projects/Accomplish/accomplish/packages/agent-core/src/daemon/`)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

**Source Reference**: 
- v0.2.0: `packages/daemon/src/socket-path.ts` (PathResolver class)
- Accomplish: `packages/agent-core/src/common/types/daemon.ts` (TypeScript types)

- [x] T001 [ASYNC] Create TypeScript types for JSON-RPC protocol in packages/types/src/daemon.ts (Source: Accomplish common/types/daemon.ts lines 56-105)
- [x] T002 [P] [ASYNC] Setup Vitest configuration for daemon package in packages/agent-core/vitest.config.ts
- [x] T003 [P] [ASYNC] Configure Biome linting for daemon package in packages/agent-core/biome.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Source Reference**:
- v0.2.0: `packages/daemon/src/socket-transport.ts` (DaemonTransport interface)
- Accomplish: `packages/agent-core/src/daemon/socket-path.ts` (getSocketPath function)

- [x] T004 [SYNC] Implement DaemonTransport interface in packages/agent-core/src/daemon/transport.ts (Source: v0.2.0 socket-transport.ts lines 3-8)
- [x] T005 [SYNC] Implement SocketTransport class with 1MB buffer limit in packages/agent-core/src/daemon/socket-transport.ts (Source: v0.2.0 socket-transport.ts lines 10-89)
- [x] T006 [ASYNC] Enhance socket path resolution utility in packages/agent-core/src/daemon/socket-path.ts (Source: v0.2.0 socket-path.ts lines 5-28, ADD getSocketPath function)
- [x] T007 [ASYNC] Create export barrel for daemon module in packages/agent-core/src/daemon/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Send request and receive response (Priority: P1) 🎯 MVP

**Goal**: A client process sends a JSON-RPC request over a Unix domain socket to the daemon and receives a response with the same correlation ID.

**Independent Test**: Can be fully tested by sending a single request and verifying the response contains the same correlation ID and correct result.

**Source Reference**:
- v0.2.0: `packages/daemon/src/rpc-server.ts` (DaemonRpcServer class, handleMessage, sendResponse)
- Accomplish: `packages/agent-core/src/daemon/rpc-server.ts` (DaemonRpcServer class)

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T008 [P] [US1] [ASYNC] Create contract test for valid request/response in packages/agent-core/tests/contract/valid-request-response.test.ts
- [x] T009 [P] [US1] [ASYNC] Create integration test for client-server communication in packages/agent-core/tests/integration/client-server.test.ts
- [x] T010 [P] [US1] [ASYNC] Create unit test for JSON-RPC message parsing in packages/agent-core/tests/unit/message-parser.test.ts

### Implementation for User Story 1

- [x] T011 [US1] [SYNC] Implement DaemonRpcServer class with basic server lifecycle in packages/agent-core/src/daemon/rpc-server.ts (Source: v0.2.0 rpc-server.ts lines 27-60, Accomplish rpc-server.ts lines 33-54)
- [x] T012 [US1] [ASYNC] Implement JSON-RPC message handler for request processing in packages/agent-core/src/daemon/rpc-message-handler.ts (Source: Accomplish rpc-message-handler.ts lines 46-86)
- [x] T013 [US1] [ASYNC] Add correlation ID handling to response generation (Source: v0.2.0 rpc-server.ts lines 299-309)
- [x] T014 [US1] [ASYNC] Add structured logging with pino for server operations
- [x] T015 [US1] [ASYNC] Implement socket file cleanup on shutdown (Source: v0.2.0 rpc-server.ts lines 136-140, Accomplish rpc-server.ts lines 157-164)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Method routing (Priority: P2)

**Goal**: The daemon routes incoming requests to the appropriate handler function based on the `method` field in the JSON-RPC request.

**Independent Test**: Can be tested by registering two different handler methods and verifying each request is dispatched to the correct handler.

**Source Reference**:
- v0.2.0: `packages/daemon/src/rpc-server.ts` (registerMethod, resolveHandler)
- Accomplish: `packages/agent-core/src/daemon/rpc-server.ts` (registerMethod)

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T016 [P] [US2] [ASYNC] Create contract test for method routing in packages/agent-core/tests/contract/method-routing.test.ts
- [x] T017 [P] [US2] [ASYNC] Create integration test for multiple method handlers in packages/agent-core/tests/integration/method-handlers.test.ts
- [x] T018 [P] [US2] [ASYNC] Create unit test for handler registration in packages/agent-core/tests/unit/handler-registration.test.ts

### Implementation for User Story 2

- [x] T019 [US2] [SYNC] Implement registerMethod() API for handler registration in packages/agent-core/src/daemon/rpc-server.ts (Source: v0.2.0 rpc-server.ts lines 62-64, Accomplish rpc-server.ts lines 59-62)
- [x] T020 [US2] [ASYNC] Implement method routing logic to dispatch to correct handler (Source: v0.2.0 rpc-server.ts lines 66-78)
- [x] T021 [US2] [ASYNC] Add built-in daemon.ping health check method (Source: v0.2.0 rpc-server.ts lines 54-59, Accomplish rpc-server.ts lines 49-53)
- [x] T022 [US2] [ASYNC] Implement hasConnectedClients() utility method (Source: v0.2.0 rpc-server.ts lines 98-103, Accomplish rpc-server.ts lines 67-74)
- [x] T023 [US2] [ASYNC] Add onConnection and onDisconnection lifecycle callbacks (Source: Accomplish rpc-server.ts lines 35-36, 103, 121)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Structured error responses (Priority: P3)

**Goal**: The daemon returns structured error responses following JSON-RPC 2.0 error codes for various failure conditions.

**Independent Test**: Can be tested by sending malformed requests, unknown methods, and invalid parameters to verify correct error codes are returned.

**Source Reference**:
- v0.2.0: `packages/daemon/src/rpc-server.ts` (handleMessage error handling)
- Accomplish: `packages/agent-core/src/daemon/rpc-message-handler.ts` (handleRpcLine error handling)
- Accomplish: `packages/agent-core/src/common/types/daemon.ts` (JSON_RPC_ERRORS constants)

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T024 [P] [US3] [ASYNC] Create contract test for error responses in packages/agent-core/tests/contract/error-responses.test.ts
- [x] T025 [P] [US3] [ASYNC] Create integration test for malformed requests in packages/agent-core/tests/integration/malformed-requests.test.ts
- [x] T026 [P] [US3] [ASYNC] Create unit test for error code generation in packages/agent-core/tests/unit/error-codes.test.ts

### Implementation for User Story 3

- [x] T027 [US3] [SYNC] Implement comprehensive error handling for all JSON-RPC error codes in packages/agent-core/src/daemon/rpc-message-handler.ts (Source: v0.2.0 rpc-server.ts lines 246-296, Accomplish rpc-message-handler.ts lines 51-85)
- [x] T028 [US3] [ASYNC] Add validation for JSON-RPC 2.0 message format (Source: v0.2.0 rpc-server.ts lines 256-270)
- [x] T029 [US3] [ASYNC] Implement 1MB message size limit enforcement (Source: v0.2.0 rpc-server.ts lines 158-163)
- [x] T030 [US3] [ASYNC] Add buffer overflow detection and connection cleanup (Source: v0.2.0 rpc-server.ts lines 158-163)
- [x] T031 [US3] [ASYNC] Implement NDJSON framing protocol parsing (Source: v0.2.0 rpc-server.ts lines 164-172)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

**Source Reference**:
- v0.2.0: `packages/daemon/src/json-rpc-client.ts` (Client implementation)
- Accomplish: `packages/agent-core/src/common/types/daemon.ts` (Full type definitions)

- [x] T032 [P] [ASYNC] Create quickstart validation test in packages/agent-core/tests/integration/quickstart.test.ts
- [x] T033 [P] [ASYNC] Add performance tests for concurrent connections in packages/agent-core/tests/performance/concurrent-connections.test.ts (must validate SC-005: 100 concurrent connections with <100ms average response time)
- [x] T034 [ASYNC] Implement notify() method for server-to-client notifications (Source: v0.2.0 rpc-server.ts lines 123-130, Accomplish rpc-server.ts lines 80-88)
- [x] T035 [ASYNC] Add Windows named pipe support to SocketTransport (Source: v0.2.0 socket-path.ts lines 12-15)
- [x] T036 [ASYNC] Create export barrel updates for new daemon exports
- [x] T037 [ASYNC] Run quickstart.md validation scenarios
- [x] T038 [ASYNC] Code cleanup and refactoring
- [x] T039 [ASYNC] Documentation updates in packages/agent-core/README.md
- [x] T040 [ASYNC] Add Windows named pipe support to RPC server (complementing T035 client-side support for FR-001)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3)
  - Or in parallel if team capacity allows
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models/types before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, user stories can proceed in priority order
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Create contract test for valid request/response in packages/agent-core/tests/contract/valid-request-response.test.ts"
Task: "Create integration test for client-server communication in packages/agent-core/tests/integration/client-server.test.ts"
Task: "Create unit test for JSON-RPC message parsing in packages/agent-core/tests/unit/message-parser.test.ts"
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
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
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
- **Source Reference**: All implementation tasks reference specific lines from v0.2.0 and Accomplish source code