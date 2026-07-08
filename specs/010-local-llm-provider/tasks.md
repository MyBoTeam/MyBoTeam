# Tasks: Local LLM Provider (Ollama/LMStudio)

**Input**: Design documents from `/specs/010-local-llm-provider/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Contract tests are included as they are required by FR-011 in the specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Source Code**: `packages/agent-core/src/services/providers/`
- **Tests**: `packages/agent-core/tests/contract/providers/`
- **Types**: `packages/types/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [ASYNC] Create providers directory structure in packages/agent-core/src/services/providers/
- [x] T002 [P] [ASYNC] Create provider-specific types file in packages/agent-core/src/services/providers/types.ts
- [x] T003 [P] [ASYNC] Create provider index file for exports in packages/agent-core/src/services/providers/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [SYNC] Design and implement LocalProviderConfig schema in packages/agent-core/src/services/providers/types.ts
- [x] T005 [SYNC] Design and implement local provider base class in packages/agent-core/src/services/providers/local-provider-base.ts
- [x] T006 [ASYNC] Implement provider error mapping utility in packages/agent-core/src/services/providers/error-mapper.ts (REUSE: import toProviderError from ../../providers/provider-errors.ts)
- [x] T007 [ASYNC] Implement structured logging utility for providers in packages/agent-core/src/services/providers/logger.ts (JSON format, debug level, fields: model, duration_ms, tokens_used, provider_name, success)
- [x] T008 [ASYNC] Implement metrics collection utility for providers in packages/agent-core/src/services/providers/metrics.ts (REUSE: import MetricsEmitter from ../../providers/metrics.ts)
- [x] T009 [ASYNC] Implement provider capability detection service in packages/agent-core/src/services/providers/capability-detector.ts (probe /v1/models, detect streaming/tools/vision/maxContextWindow within 2s)
- [x] T010 [ASYNC] Implement rate limit header parser in packages/agent-core/src/services/providers/rate-limit-parser.ts (parse X-RateLimit-Remaining, X-RateLimit-Reset, include in RateLimitError)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Configure Ollama Provider (Priority: P1) 🎯 MVP

**Goal**: Enable developers to configure and use local Ollama instances as LLM providers

**Independent Test**: Can be fully tested by configuring an Ollama provider endpoint, listing available models, and completing a chat request against a local Ollama instance.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T011 [P] [US1] Contract test for Ollama chatCompletion in packages/agent-core/tests/contract/providers/ollama-provider.test.ts
- [x] T012 [P] [US1] Contract test for Ollama streamChat in packages/agent-core/tests/contract/providers/ollama-provider.test.ts
- [x] T013 [P] [US1] Contract test for Ollama listModels in packages/agent-core/tests/contract/providers/ollama-provider.test.ts
- [x] T014 [P] [US1] Contract test for Ollama error handling in packages/agent-core/tests/contract/providers/ollama-provider.test.ts

### Implementation for User Story 1

- [x] T015 [US1] Implement Ollama provider class in packages/agent-core/src/services/providers/ollama-provider.ts (depends on T005)
- [x] T016 [US1] Implement Ollama chatCompletion method in packages/agent-core/src/services/providers/ollama-provider.ts
- [x] T017 [US1] Implement Ollama streamChat method with SSE parsing in packages/agent-core/src/services/providers/ollama-provider.ts
- [x] T018 [US1] Implement Ollama listModels method in packages/agent-core/src/services/providers/ollama-provider.ts
- [x] T019 [US1] Add Ollama provider to provider registry in packages/agent-core/src/services/providers/index.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Configure LMStudio Provider (Priority: P2)

**Goal**: Enable developers to configure and use local LMStudio servers as LLM providers

**Independent Test**: Can be fully tested by configuring an LMStudio provider endpoint and completing a chat request against a running LMStudio server.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T020 [P] [US2] Contract test for LMStudio chatCompletion in packages/agent-core/tests/contract/providers/lmstudio-provider.test.ts
- [x] T021 [P] [US2] Contract test for LMStudio streamChat in packages/agent-core/tests/contract/providers/lmstudio-provider.test.ts
- [x] T022 [P] [US2] Contract test for LMStudio listModels in packages/agent-core/tests/contract/providers/lmstudio-provider.test.ts
- [x] T023 [P] [US2] Contract test for LMStudio error handling in packages/agent-core/tests/contract/providers/lmstudio-provider.test.ts

### Implementation for User Story 2

- [x] T024 [US2] Implement LMStudio provider class in packages/agent-core/src/services/providers/lmstudio-provider.ts (depends on T005)
- [x] T025 [US2] Implement LMStudio chatCompletion method in packages/agent-core/src/services/providers/lmstudio-provider.ts
- [x] T026 [US2] Implement LMStudio streamChat method with SSE parsing in packages/agent-core/src/services/providers/lmstudio-provider.ts
- [x] T027 [US2] Implement LMStudio listModels method in packages/agent-core/src/services/providers/lmstudio-provider.ts
- [x] T028 [US2] Add LMStudio provider to provider registry in packages/agent-core/src/services/providers/index.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Auto-Detect Local Provider (Priority: P3)

**Goal**: Enable automatic detection of running local LLM providers

**Independent Test**: Can be tested by starting a local Ollama or LMStudio instance and verifying the system discovers it without manual configuration.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T029 [P] [US3] Contract test for provider discovery in packages/agent-core/tests/contract/providers/provider-discovery.test.ts
- [x] T030 [P] [US3] Integration test for auto-discovery flow in packages/agent-core/tests/integration/provider-discovery.test.ts

### Implementation for User Story 3

- [x] T031 [US3] Implement provider discovery service in packages/agent-core/src/services/providers/provider-discovery.ts
- [x] T032 [US3] Implement port scanning logic for Ollama (11434) and LMStudio (1234) in packages/agent-core/src/services/providers/provider-discovery.ts
- [x] T033 [US3] Implement health check endpoint validation in packages/agent-core/src/services/providers/provider-discovery.ts
- [x] T034 [US3] Add discovery service to provider registry in packages/agent-core/src/services/providers/index.ts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T035 [ASYNC] Run quickstart.md validation scenarios
- [x] T036 [ASYNC] Code cleanup and refactoring across provider implementations
- [x] T037 [ASYNC] Performance optimization for streaming responses
- [x] T038 [ASYNC] Security review for authentication handling
- [x] T039 [ASYNC] Verify SC-006: Model listing returns available models within 2 seconds
- [x] T040 [ASYNC] Verify SC-007: Auto-discovery detects running providers within 5 seconds
- [x] T041 [ASYNC] Verify SC-008: All lint checks pass without configuration modifications

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational
  - User Story 2 (P2): Can start after Foundational (independent of US1)
  - User Story 3 (P3): Can start after Foundational (independent of US1/US2)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent of US1/US2

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Base class before provider implementation
- Provider implementation before registry integration
- Core implementation before integration

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Contract test for Ollama chatCompletion in packages/agent-core/tests/contract/providers/ollama-provider.test.ts"
Task: "Contract test for Ollama streamChat in packages/agent-core/tests/contract/providers/ollama-provider.test.ts"
Task: "Contract test for Ollama listModels in packages/agent-core/tests/contract/providers/ollama-provider.test.ts"
Task: "Contract test for Ollama error handling in packages/agent-core/tests/contract/providers/ollama-provider.test.ts"

# Then implement provider (sequential due to shared file):
Task: "Implement Ollama provider class in packages/agent-core/src/services/providers/ollama-provider.ts"
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
   - Developer A: User Story 1 (Ollama)
   - Developer B: User Story 2 (LMStudio)
   - Developer C: User Story 3 (Auto-Discovery)
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

---

## Task Summary

| Phase | Tasks | SYNC | ASYNC | Parallel |
|-------|-------|------|-------|----------|
| Phase 1: Setup | 3 | 0 | 3 | 3 |
| Phase 2: Foundational | 7 | 2 | 5 | 4 |
| Phase 3: US1 (Ollama) | 9 | 0 | 9 | 5 |
| Phase 4: US2 (LMStudio) | 9 | 0 | 9 | 5 |
| Phase 5: US3 (Discovery) | 6 | 0 | 6 | 2 |
| Phase 6: Polish | 7 | 0 | 7 | 0 |
| **Total** | **41** | **2** | **39** | **19** |

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1: Ollama Provider)
