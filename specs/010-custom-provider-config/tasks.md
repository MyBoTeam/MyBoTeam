# Tasks: Custom Provider Configuration

**Input**: Design documents from `/specs/010-custom-provider-config/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included per Principle II (Test-First Quality) - contract tests for provider interface, unit tests for validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 0: Source Port (Prerequisite) ✅ COMPLETE

**Purpose**: Port existing utilities from v0.3.0 that are missing from current codebase

**⚠️ CRITICAL**: This phase MUST complete before any other phase. These files exist in v0.3.0 but are missing from the current codebase.

- [x] T000a [ASYNC] Port `packages/agent-core/src/utils/url.ts` (contains `validateHttpUrl()`) from v0.3.0 to current codebase
- [x] T000b [ASYNC] Port `packages/agent-core/src/utils/sanitize.ts` (contains `sanitizeString()`) from v0.3.0 to current codebase
- [x] T000d [ASYNC] Create `packages/agent-core/src/utils/index.ts` barrel export (if not exists)

**Note**: `providers/custom.ts` from v0.3.0 is NOT ported — upstream's provider patterns (`openai-provider.ts`, `cloud-provider-base.ts`) provide better reference. Custom provider connection test will be implemented from scratch following upstream patterns.

**Checkpoint**: All v0.3.0 dependencies available in current codebase

---

## Phase 1: Setup (Shared Infrastructure) ✅ COMPLETE

**Purpose**: Project initialization and basic structure

- [x] T001 [ASYNC] Create TypeScript interfaces for CustomProvider, ConnectionTestResult, CustomProviderConfig (renamed from ProviderConfig to avoid upstream naming conflict) in packages/types/src/custom-provider.ts
- [x] T002 [ASYNC] Create barrel export for new types in packages/agent-core/src/providers/custom-provider.ts

---

## Phase 2: Foundational (Blocking Prerequisites) ✅ COMPLETE

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [ASYNC] Implement URL validation utility using existing validateHttpUrl() in packages/agent-core/src/providers/tools/custom-validation.ts
- [x] T004 [ASYNC] Implement API key format validation in packages/agent-core/src/providers/tools/custom-validation.ts
- [x] T005 [ASYNC] Implement model name validation in packages/agent-core/src/providers/tools/custom-validation.ts
- [x] T006 [SYNC] Implement vault integration for encrypted storage in packages/agent-core/src/providers/custom-config.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Configure Custom LLM Provider (Priority: P1) 🎯 MVP ✅ COMPLETE

**Goal**: As a developer, configure a custom LLM provider with URL, API key, and model name to connect to any OpenAI-compatible endpoint.

**Independent Test**: Configure a custom provider with valid credentials and verify successful connection to the endpoint.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] Contract test for CreateProvider in packages/agent-core/tests/contract/providers/custom-provider.test.ts
- [x] T008 [P] [US1] Contract test for TestConnection in packages/agent-core/tests/contract/providers/custom-provider.test.ts

### Implementation for User Story 1

- [x] T009 [P] [US1] Implement CustomProviderService.createProvider() in packages/agent-core/src/providers/custom-config.ts
- [x] T010 [P] [US1] Implement CustomProviderService.getProvider() in packages/agent-core/src/providers/custom-config.ts
- [x] T011 [US1] Implement CustomProviderService.testConnection() using existing testCustomConnection() in packages/agent-core/src/providers/custom-config.ts
- [x] T012 [US1] Add provider status management (Active/Inactive/Error) in packages/agent-core/src/providers/custom-config.ts
- [x] T013 [US1] Add connection test result storage in packages/agent-core/src/providers/custom-config.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Validate Custom Provider Configuration (Priority: P2) ✅ COMPLETE

**Goal**: As a developer, receive clear feedback on configuration issues before attempting to use the provider.

**Independent Test**: Enter invalid configurations (malformed URL, invalid API key, unreachable endpoint) and verify appropriate error messages.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T014 [P] [US2] Unit test for URL validation in packages/agent-core/tests/unit/providers/custom-validation.test.ts
- [x] T015 [P] [US2] Unit test for API key validation in packages/agent-core/tests/unit/providers/custom-validation.test.ts
- [x] T016 [P] [US2] Unit test for model name validation in packages/agent-core/tests/unit/providers/custom-validation.test.ts

### Implementation for User Story 2

- [x] T017 [P] [US2] Implement validateProviderConfig() in packages/agent-core/src/providers/tools/custom-validation.ts
- [x] T018 [P] [US2] Implement validateUrlFormat() in packages/agent-core/src/providers/tools/custom-validation.ts
- [x] T019 [US2] Implement validateApiKeyFormat() in packages/agent-core/src/providers/tools/custom-validation.ts
- [x] T020 [US2] Add custom provider error code constants (PROVIDER_NOT_FOUND, PROVIDER_NAME_EXISTS, INVALID_URL, INVALID_API_KEY, MODEL_NOT_FOUND, VALIDATION_FAILED) in packages/types/src/custom-provider.ts — note: AUTHENTICATION_ERROR, RATE_LIMIT_ERROR, TIMEOUT_ERROR, CONNECTION_ERROR are reused from upstream provider-errors.ts
- [x] T021 [US2] Integrate validation into createProvider() and updateProvider() in packages/agent-core/src/providers/custom-config.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Secure Storage of Provider Credentials (Priority: P3) ✅ COMPLETE

**Goal**: As a developer, have API keys encrypted at rest and never exposed in plaintext.

**Independent Test**: Verify API keys are encrypted in storage and not exposed in logs or configuration files.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T022 [P] [US3] Unit test for API key encryption in packages/agent-core/tests/unit/providers/custom-config.test.ts
- [x] T023 [P] [US3] Unit test for API key masking in packages/agent-core/tests/unit/providers/custom-config.test.ts

### Implementation for User Story 3

- [x] T024 [P] [US3] Implement API key encryption using vault in packages/agent-core/src/providers/custom-config.ts
- [x] T025 [P] [US3] Implement API key masking for responses in packages/agent-core/src/providers/custom-config.ts
- [x] T026 [US3] Implement secure logging (mask API keys) in packages/agent-core/src/providers/custom-config.ts
- [x] T027 [US3] Add provider count limit validation (max 50) in packages/agent-core/src/providers/custom-config.ts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: User Story Completion - CRUD Operations ✅ COMPLETE

**Goal**: Complete provider management with update and delete operations.

**Independent Test**: Update and delete provider configurations, verify state transitions work correctly.

### Tests for CRUD Operations

- [x] T028 [P] Contract test for UpdateProvider in packages/agent-core/tests/contract/providers/custom-provider.test.ts
- [x] T029 [P] Contract test for DeleteProvider in packages/agent-core/tests/contract/providers/custom-provider.test.ts
- [x] T030 [P] Contract test for ListProviders in packages/agent-core/tests/contract/providers/custom-provider.test.ts

### Implementation for CRUD Operations

- [x] T031 [P] Implement CustomProviderService.updateProvider() in packages/agent-core/src/providers/custom-config.ts
- [x] T032 [P] Implement CustomProviderService.deleteProvider() (soft delete) in packages/agent-core/src/providers/custom-config.ts
- [x] T033 [P] Implement CustomProviderService.listProviders() with pagination in packages/agent-core/src/providers/custom-config.ts
- [x] T034 Implement provider uniqueness validation (URL + Name) in packages/agent-core/src/providers/custom-config.ts
- [x] T035 Implement state transition validation in packages/agent-core/src/providers/custom-config.ts

---

## Phase 7: Polish & Cross-Cutting Concerns ✅ COMPLETE

**Purpose**: Improvements that affect multiple user stories

- [x] T036 [P] Add network failure error handling: timeout (10s default), DNS resolution failure, connection refused, SSL errors — each with specific error code and user-facing message in packages/agent-core/src/providers/custom-config.ts
- [x] T037 [P] Add rate limit detection: reuse upstream `tools/rate-limit-parser.ts` for HTTP 429 + Retry-After header parsing; notify user with retry timestamp; temporarily disable provider after 3 consecutive rate-limit events in packages/agent-core/src/providers/custom-config.ts
- [x] T038 [P] Add response format auto-detection and transformation for OpenAI-compatible providers (FR-007): detect `choices[0].message.content`, `generations[0].text`, `results[0].output` patterns; pass through unrecognized formats with warning in packages/agent-core/src/providers/custom-config.ts
- [x] T038a [P] Add OpenAI-compatible API format validation: verify endpoint responds to `/v1/models` and supports `/v1/chat/completions` (FR-005) in packages/agent-core/src/providers/custom-config.ts
- [x] T038b [P] Add missing model handling: when specified `modelName` not found in `/v1/models` response, return clear error with list of available models in packages/agent-core/src/providers/custom-config.ts
- [x] T039 Add JSDoc documentation for all public APIs in packages/agent-core/src/providers/custom-config.ts
- [x] T040 Run quickstart.md validation scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable
- **CRUD Operations**: Depends on US1 completion (builds on createProvider)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
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
Task: "Contract test for CreateProvider in packages/agent-core/tests/contract/providers/custom-provider.test.ts"
Task: "Contract test for TestConnection in packages/agent-core/tests/contract/providers/custom-provider.test.ts"

# Launch all models for User Story 1 together:
Task: "Implement CustomProviderService.createProvider() in packages/agent-core/src/providers/custom-config.ts"
Task: "Implement CustomProviderService.getProvider() in packages/agent-core/src/providers/custom-config.ts"
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