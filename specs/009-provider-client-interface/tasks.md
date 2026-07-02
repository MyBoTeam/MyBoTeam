# Tasks: ProviderClient Interface

**Input**: Design documents from `/specs/009-provider-client-interface/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Contract tests are required per spec FR-004. Unit tests for validation schemas included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project structure and shared configuration

- [ ] T001 [ASYNC] Create new type files in packages/types/src/ per project structure plan
- [ ] T002 [ASYNC] Update packages/types/src/index.ts to export new type modules

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Base types that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 [P] [ASYNC] Create ChatMessage type with Zod schema in packages/types/src/chat.ts
- [ ] T004 [P] [ASYNC] Create ToolDefinition type with JSON Schema support in packages/types/src/tools.ts
- [ ] T005 [P] [ASYNC] Create ToolCall type with Zod schema in packages/types/src/tools.ts
- [ ] T006 [ASYNC] Create ProviderError discriminated union in packages/types/src/errors.ts
- [ ] T007 [P] [ASYNC] Create UsageInfo type with Zod schema in packages/types/src/chat.ts

**Checkpoint**: Foundation types ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Define ProviderClient Interface (Priority: P1) 🎯 MVP

**Goal**: Define the ProviderClient interface with chatCompletion, streamChat, and listModels methods

**Independent Test**: Can be verified by checking interface exists with correct method signatures and contract tests pass against mock implementation

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T008 [P] [US1] Contract test for ProviderClient interface in packages/types/tests/contract/provider-client.test.ts

### Implementation for User Story 1

- [ ] T009 [P] [US1] Create ChatRequest type with Zod schema in packages/types/src/chat.ts
- [ ] T010 [P] [US1] Create ChatResponse type with Zod schema in packages/types/src/chat.ts
- [ ] T011 [US1] Create ProviderClient interface in packages/types/src/provider-client.ts (depends on T009, T010)
- [ ] T012 [US1] Export ProviderClient from packages/types/src/index.ts

**Checkpoint**: ProviderClient interface defined and tested

---

## Phase 4: User Story 2 - Type-Safe Request/Response Validation (Priority: P1)

**Goal**: Runtime validation schemas for all request/response types with AsyncIterable streaming

**Independent Test**: Can be tested by passing valid and invalid data through validation schemas and verifying correct acceptance/rejection behavior

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T013 [P] [US2] Validation tests for ChatRequest schema in packages/types/tests/unit/chat.test.ts
- [ ] T014 [P] [US2] Validation tests for ChatResponse schema in packages/types/tests/unit/chat.test.ts
- [ ] T015 [P] [US2] Validation tests for ChatMessage schema in packages/types/tests/unit/chat.test.ts

### Implementation for User Story 2

- [ ] T016 [P] [US2] Create StreamingChunk type with Zod schema in packages/types/src/streaming.ts
- [ ] T017 [P] [US2] Add toolCall delta field to StreamingChunk type in packages/types/src/streaming.ts
- [ ] T018 [US2] Update ProviderClient.streamChat to return AsyncIterable<StreamingChunk> in packages/types/src/provider-client.ts (depends on T016, T017)
- [ ] T019 [US2] Add timeout parameter to ChatRequest schema in packages/types/src/chat.ts
- [ ] T020 [US2] Add validation tests for StreamingChunk in packages/types/tests/unit/streaming.test.ts

**Checkpoint**: Type-safe validation working for all request/response types

---

## Phase 5: User Story 3 - Provider Error Handling (Priority: P2)

**Goal**: Well-defined error types covering auth, rate limit, network, and provider-specific errors

**Independent Test**: Can be tested by triggering each error type and verifying the correct error category is returned

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T021 [P] [US3] Validation tests for ProviderError discriminated union in packages/types/tests/unit/errors.test.ts
- [ ] T022 [P] [US3] Test auth error type structure in packages/types/tests/unit/errors.test.ts
- [ ] T023 [P] [US3] Test rate_limit error with retryAfter in packages/types/tests/unit/errors.test.ts
- [ ] T024 [P] [US3] Test network error with cause in packages/types/tests/unit/errors.test.ts
- [ ] T025 [P] [US3] Test provider error with statusCode in packages/types/tests/unit/errors.test.ts

### Implementation for User Story 3

- [ ] T026 [US3] Implement auth error category in packages/types/src/errors.ts
- [ ] T027 [US3] Implement rate_limit error category with retryAfter field in packages/types/src/errors.ts
- [ ] T028 [US3] Implement network error category with optional cause in packages/types/src/errors.ts
- [ ] T029 [US3] Implement provider error category with statusCode in packages/types/src/errors.ts
- [ ] T030 [US3] Export ProviderError from packages/types/src/index.ts

**Checkpoint**: Error types fully defined and tested

---

## Phase 6: User Story 4 - Model Listing (Priority: P2)

**Goal**: ModelInfo type with id, displayName, contextWindow, and capabilities

**Independent Test**: Can be tested by calling listModels on a mock provider and verifying the returned model list format

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T031 [P] [US4] Validation tests for ModelInfo schema in packages/types/tests/unit/models.test.ts
- [ ] T032 [P] [US4] Validation tests for ModelCapabilities schema in packages/types/tests/unit/models.test.ts

### Implementation for User Story 4

- [ ] T033 [P] [US4] Create ModelCapabilities type with Zod schema in packages/types/src/models.ts
- [ ] T034 [P] [US4] Create ModelInfo type with Zod schema in packages/types/src/models.ts
- [ ] T035 [US4] Export ModelInfo from packages/types/src/index.ts

**Checkpoint**: Model listing types defined and tested

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [ ] T036 [ASYNC] Run full contract test suite in packages/types/tests/contract/
- [ ] T037 [ASYNC] Run all unit tests in packages/types/tests/unit/
- [ ] T038 [ASYNC] Verify TypeScript compilation with strict mode
- [ ] T039 [ASYNC] Verify Biome lint passes without config changes
- [ ] T040 [ASYNC] Update quickstart.md with final type names if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 and US2 are P1 and can proceed in parallel after Foundational
  - US3 and US4 are P2 and can proceed after US1/US2 or in parallel
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **US2 (P1)**: Can start after Foundational (Phase 2) - Builds on US1 types but independently testable
- **US3 (P2)**: Can start after Foundational (Phase 2) - Uses error types from Phase 2
- **US4 (P2)**: Can start after Foundational (Phase 2) - Independent of US1-US3

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Types before interface
- Interface before export
- Core implementation before tests pass

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- US1 and US2 (both P1) can be worked on in parallel
- US3 and US4 (both P2) can be worked on in parallel

---

## Parallel Example: User Story 1

```bash
# Launch contract test first:
Task: "Contract test for ProviderClient interface in packages/types/tests/contract/provider-client.test.ts"

# Launch all types for User Story 1 together:
Task: "Create ChatRequest type with Zod schema in packages/types/src/chat.ts"
Task: "Create ChatResponse type with Zod schema in packages/types/src/chat.ts"

# Then interface:
Task: "Create ProviderClient interface in packages/types/src/provider-client.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test ProviderClient interface independently
5. Ready for downstream features (M4-2, M4-3)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (ProviderClient) → Test independently → MVP!
3. Add User Story 2 (Validation) → Test independently → Full type safety
4. Add User Story 3 (Errors) → Test independently → Complete error handling
5. Add User Story 4 (Models) → Test independently → Full feature set

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (ProviderClient interface)
   - Developer B: User Story 2 (Validation schemas)
   - Developer C: User Story 3 (Error types) + User Story 4 (Model types)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Contract tests (T008) are REQUIRED per spec FR-004
- Unit tests for validation schemas are included as they verify type safety
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
