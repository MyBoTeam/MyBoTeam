# Tasks: OpenAI + Anthropic Providers

**Input**: Design documents from `/specs/010-openai-anthropic-providers/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Unit tests and contract tests are required per FR-010 and FR-011.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and SDK package installation

- [x] T001 Install `openai` and `@anthropic-ai/sdk` packages via pnpm
- [x] T002 [P] Create `packages/agent-core/src/providers/` directory structure
- [x] T003 [P] Create `packages/agent-core/tests/contract/` and `packages/agent-core/tests/unit/` directories

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Define ProviderConfig type with all fields (apiKey, baseUrl, defaultModel, organizationId, customHeaders, proxy, retry, maxConcurrent) in `packages/agent-core/src/providers/provider-config.ts`
- [x] T005 Define RetryConfig type in `packages/agent-core/src/providers/provider-config.ts`
- [x] T006 Define ProxyConfig type in `packages/agent-core/src/providers/provider-config.ts`
- [x] T007 Implement semaphore-based concurrency limiter in `packages/agent-core/src/providers/concurrency-limiter.ts`
- [x] T008 Implement model fallback strategy in `packages/agent-core/src/providers/model-fallback.ts` with default models (OpenAI: gpt-4o, Anthropic: claude-sonnet-4-20250514)
- [x] T009 [P] Implement metrics emission utility in `packages/agent-core/src/providers/metrics.ts`
- [x] T010 [P] Implement health check utility in `packages/agent-core/src/providers/health-check.ts`
- [x] T011 Update `packages/agent-core/src/index.ts` to export provider modules

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - OpenAI Provider Implementation (Priority: P1) 🎯 MVP

**Goal**: Implement OpenAI provider satisfying ProviderClient interface for chat completion and streaming

**Independent Test**: Can be fully tested by calling chatCompletion and streamChat methods with mocked OpenAI API responses

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T012 [P] [US1] Contract test for OpenAI chatCompletion in `packages/agent-core/tests/contract/openai-provider.contract.test.ts`
- [x] T013 [P] [US1] Contract test for OpenAI streamChat in `packages/agent-core/tests/contract/openai-provider.contract.test.ts`
- [x] T014 [P] [US1] Contract test for OpenAI listModels in `packages/agent-core/tests/contract/openai-provider.contract.test.ts`
- [x] T015 [P] [US1] Unit test for OpenAI provider initialization in `packages/agent-core/tests/unit/openai-provider.test.ts`

### Implementation for User Story 1

- [x] T016 [US1] Implement OpenAIProvider class with constructor and ProviderConfig validation in `packages/agent-core/src/providers/openai-provider.ts`
- [x] T017 [US1] Implement OpenAI chatCompletion method with request formatting and response mapping in `packages/agent-core/src/providers/openai-provider.ts` (Source: v0.2.0 conversation-provider.ts:68-99)
- [x] T018 [US1] Implement OpenAI streamChat method with SSE streaming and AsyncIterable wrapper in `packages/agent-core/src/providers/openai-provider.ts` (Source: v0.2.0 conversation-provider.ts:100-162)
- [x] T019 [US1] Implement OpenAI tool call extraction from streaming chunks in `packages/agent-core/src/providers/openai-provider.ts` (Source: v0.2.0 conversation-provider.ts:141-156)
- [x] T020 [US1] Implement OpenAI listModels method in `packages/agent-core/src/providers/openai-provider.ts`
- [x] T021 [US1] Implement OpenAI error mapping to ProviderError categories in `packages/agent-core/src/providers/openai-provider.ts`
- [x] T022 [US1] Integrate concurrency limiter for OpenAI requests in `packages/agent-core/src/providers/openai-provider.ts`
- [x] T023 [US1] Integrate metrics emission for OpenAI requests in `packages/agent-core/src/providers/openai-provider.ts`

**Checkpoint**: OpenAI provider fully functional - can chat, stream, and list models

---

## Phase 4: User Story 2 - Anthropic Provider Implementation (Priority: P1)

**Goal**: Implement Anthropic provider satisfying ProviderClient interface for chat completion and streaming

**Independent Test**: Can be fully tested by calling chatCompletion and streamChat methods with mocked Anthropic API responses

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T024 [P] [US2] Contract test for Anthropic chatCompletion in `packages/agent-core/tests/contract/anthropic-provider.contract.test.ts`
- [x] T025 [P] [US2] Contract test for Anthropic streamChat in `packages/agent-core/tests/contract/anthropic-provider.contract.test.ts`
- [x] T026 [P] [US2] Contract test for Anthropic listModels in `packages/agent-core/tests/contract/anthropic-provider.contract.test.ts`
- [x] T027 [P] [US2] Unit test for Anthropic provider initialization in `packages/agent-core/tests/unit/anthropic-provider.test.ts`

### Implementation for User Story 2

- [x] T028 [US2] Implement AnthropicProvider class with constructor and ProviderConfig validation in `packages/agent-core/src/providers/anthropic-provider.ts`
- [x] T029 [US2] Implement Anthropic chatCompletion method with request formatting and response mapping in `packages/agent-core/src/providers/anthropic-provider.ts` (Source: v0.2.0 conversation-provider.ts:70-98)
- [x] T030 [US2] Implement Anthropic streamChat method with SSE streaming and AsyncIterable wrapper in `packages/agent-core/src/providers/anthropic-provider.ts` (Source: v0.2.0 conversation-provider.ts:118-139)
- [x] T031 [US2] Implement Anthropic tool call extraction from streaming chunks in `packages/agent-core/src/providers/anthropic-provider.ts` (Source: v0.2.0 conversation-provider.ts:72-98)
- [x] T032 [US2] Implement Anthropic listModels method in `packages/agent-core/src/providers/anthropic-provider.ts`
- [x] T033 [US2] Implement Anthropic error mapping to ProviderError categories in `packages/agent-core/src/providers/anthropic-provider.ts`
- [x] T034 [US2] Integrate concurrency limiter for Anthropic requests in `packages/agent-core/src/providers/anthropic-provider.ts`
- [x] T035 [US2] Integrate metrics emission for Anthropic requests in `packages/agent-core/src/providers/anthropic-provider.ts`

**Checkpoint**: Both providers fully functional - can chat, stream, and list models

---

## Phase 5: User Story 3 - Model Listing (Priority: P2)

**Goal**: Ensure model listing works correctly for both providers with proper ModelInfo formatting

**Independent Test**: Can be tested by calling listModels on mock providers and verifying the returned ModelInfo array format

### Implementation for User Story 3

- [x] T036 [US3] Implement OpenAI model list filtering and ModelInfo mapping in `packages/agent-core/src/providers/openai-provider.ts`
- [x] T037 [US3] Implement Anthropic model list filtering and ModelInfo mapping in `packages/agent-core/src/providers/anthropic-provider.ts`
- [x] T038 [US3] Add unit tests for model listing edge cases in `packages/agent-core/tests/unit/openai-provider.test.ts` and `packages/agent-core/tests/unit/anthropic-provider.test.ts`

**Checkpoint**: Model listing complete for both providers

---

## Phase 6: User Story 4 - Error Handling with Retries (Priority: P2)

**Goal**: Ensure comprehensive error handling with proper ProviderError categories and retry support

**Independent Test**: Can be tested by simulating various API errors and verifying correct ProviderError categories and retryable flags

### Implementation for User Story 4

- [x] T039 [US4] Implement retry logic with configurable max attempts, delay, and backoff in `packages/agent-core/src/providers/retry-handler.ts`
- [x] T040 [US4] Integrate retry logic into OpenAI provider in `packages/agent-core/src/providers/openai-provider.ts`
- [x] T041 [US4] Integrate retry logic into Anthropic provider in `packages/agent-core/src/providers/anthropic-provider.ts`
- [x] T042 [US4] Add unit tests for retry logic and error handling in `packages/agent-core/tests/unit/retry-handler.test.ts`

**Checkpoint**: Error handling complete with retry support

---

## Phase 7: User Story 5 - Provider Health Checks and Metrics (Priority: P2)

**Goal**: Implement health check and metrics emission for operational visibility

**Independent Test**: Can be tested by calling healthCheck method and verifying metrics emission

### Implementation for User Story 5

- [x] T043 [US5] Implement healthCheck method for OpenAI provider in `packages/agent-core/src/providers/openai-provider.ts`
- [x] T044 [US5] Implement healthCheck method for Anthropic provider in `packages/agent-core/src/providers/anthropic-provider.ts`
- [x] T045 [US5] Integrate metrics emission into both providers in `packages/agent-core/src/providers/openai-provider.ts` and `packages/agent-core/src/providers/anthropic-provider.ts`
- [x] T046 [US5] Add unit tests for health checks in `packages/agent-core/tests/unit/health-check.test.ts`
- [x] T047 [US5] Add unit tests for metrics emission in `packages/agent-core/tests/unit/metrics.test.ts`

**Checkpoint**: Health checks and metrics complete

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [x] T048 Run all contract tests and verify they pass
- [x] T049 Run all unit tests and verify coverage >= 90%
- [x] T050 Run Biome linter and fix any issues without config changes
- [x] T051 Update `packages/agent-core/src/index.ts` with all exports
- [x] T052 Validate quickstart.md examples work correctly
- [x] T053 Run full test suite and verify all tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 can proceed in parallel (different files)
  - US3 depends on US1 and US2 (model listing in both providers)
  - US4 depends on US1 and US2 (retry logic in both providers)
  - US5 depends on US1 and US2 (health checks in both providers)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Can run in parallel with US1
- **User Story 3 (P2)**: Depends on US1 and US2 completion
- **User Story 4 (P2)**: Depends on US1 and US2 completion
- **User Story 5 (P2)**: Depends on US1 and US2 completion

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Models/types before services
- Services before integration
- Core implementation before error handling
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- US1 and US2 can run in parallel (different provider files)
- All contract tests for a provider marked [P] can run in parallel
- US3, US4, US5 can run in parallel after US1 and US2 complete

---

## Parallel Example: User Stories 1 & 2

```bash
# Launch US1 and US2 in parallel (different files):
Task: "Implement OpenAIProvider class in packages/agent-core/src/providers/openai-provider.ts"
Task: "Implement AnthropicProvider class in packages/agent-core/src/providers/anthropic-provider.ts"

# Launch contract tests for both providers in parallel:
Task: "Contract test for OpenAI in packages/agent-core/tests/contract/openai-provider.contract.test.ts"
Task: "Contract test for Anthropic in packages/agent-core/tests/contract/anthropic-provider.contract.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (OpenAI Provider)
4. **STOP and VALIDATE**: Test OpenAI provider independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add OpenAI Provider (US1) → Test independently → Deploy/Demo (MVP!)
3. Add Anthropic Provider (US2) → Test independently → Deploy/Demo
4. Add Model Listing (US3) → Test independently → Deploy/Demo
5. Add Error Handling (US4) → Test independently → Deploy/Demo
6. Add Health Checks (US5) → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (OpenAI)
   - Developer B: User Story 2 (Anthropic)
3. Once US1 and US2 complete:
   - Developer A: User Story 3 (Model Listing) + User Story 5 (Health Checks)
   - Developer B: User Story 4 (Error Handling)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Source references from v0.2.0 are included for key implementation tasks
