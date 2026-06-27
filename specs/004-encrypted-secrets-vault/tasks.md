# Tasks: Encrypted Secrets Vault (AES-256-GCM)

**Input**: Design documents from `/specs/004-encrypted-secrets-vault/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included as they are required by the feature specification (Test-First Quality principle).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create vault directory structure in packages/agent-core/src/vault/
- [ ] T002 Create storage directory structure in packages/agent-core/src/storage/
- [ ] T003 [P] Create TypeScript types file in packages/agent-core/src/vault/vault-types.ts
- [ ] T004 [P] Create public API exports file in packages/agent-core/src/vault/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [SYNC] Implement AES-256-GCM encryption/decryption in packages/agent-core/src/vault/vault-crypto.ts
- [ ] T006 [SYNC] Implement PBKDF2 key derivation in packages/agent-core/src/vault/vault-key-provider.ts
- [ ] T007 [ASYNC] Implement file-based vault storage with atomic writes in packages/agent-core/src/storage/vault-store.ts
- [ ] T008 [ASYNC] Implement read-write lock for concurrent access in packages/agent-core/src/vault/vault-service.ts
- [ ] T009 [P] [ASYNC] Create unit tests for vault-crypto in packages/agent-core/tests/unit/vault/vault-crypto.test.ts
- [ ] T010 [P] [ASYNC] Create unit tests for vault-key-provider in packages/agent-core/tests/unit/vault/vault-key-provider.test.ts
- [ ] T011 [P] [ASYNC] Create integration tests for vault-file-storage in packages/agent-core/tests/integration/vault/vault-file-storage.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Store API Keys Securely (Priority: P1) 🎯 MVP

**Goal**: Store API keys and credentials encrypted at rest so sensitive information is protected even if storage files are compromised

**Independent Test**: Store an API key and verify it is not readable in the storage file, while still being retrievable through the application

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T012 [P] [US1] Contract test for store method in packages/agent-core/tests/contract/vault-api.test.ts
- [ ] T013 [P] [US1] Integration test for storing secrets in packages/agent-core/tests/integration/vault/vault-file-storage.test.ts

### Implementation for User Story 1

- [ ] T014 [P] [US1] Create VaultEntry interface in packages/agent-core/src/vault/vault-types.ts
- [ ] T015 [P] [US1] Create VaultEntryType union type in packages/agent-core/src/vault/vault-types.ts
- [ ] T016 [P] [US1] Create SecretState union type in packages/agent-core/src/vault/vault-types.ts
- [ ] T017 [US1] Implement vault constructor and unlock method in packages/agent-core/src/vault/vault-service.ts
- [ ] T018 [US1] Implement store method in packages/agent-core/src/vault/vault-service.ts
- [ ] T019 [US1] Implement lock method in packages/agent-core/src/vault/vault-service.ts
- [ ] T020 [US1] Add validation and error handling for store operation
- [ ] T021 [US1] Add logging for store operations (no plaintext in logs)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Retrieve and Use Secrets (Priority: P1)

**Goal**: Retrieve stored secrets when needed to authenticate with external services

**Independent Test**: Store a secret, retrieve it, and verify it matches the original value

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T022 [P] [US2] Contract test for retrieve method in packages/agent-core/tests/contract/vault-api.test.ts
- [ ] T023 [P] [US2] Contract test for decrypt method in packages/agent-core/tests/contract/vault-api.test.ts
- [ ] T024 [P] [US2] Integration test for retrieving secrets in packages/agent-core/tests/integration/vault/vault-file-storage.test.ts

### Implementation for User Story 2

- [ ] T025 [US2] Implement retrieve method in packages/agent-core/src/vault/vault-service.ts
- [ ] T026 [US2] Implement decrypt method in packages/agent-core/src/vault/vault-service.ts
- [ ] T027 [US2] Implement list method with filtering in packages/agent-core/src/vault/vault-service.ts
- [ ] T028 [US2] Implement update method in packages/agent-core/src/vault/vault-service.ts
- [ ] T029 [US2] Implement delete method (soft-delete) in packages/agent-core/src/vault/vault-service.ts
- [ ] T030 [US2] Add validation and error handling for retrieve/decrypt operations
- [ ] T031 [US2] Add logging for retrieve operations (no plaintext in logs)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Recover from Key Loss (Priority: P2)

**Goal**: Provide recovery mechanism if user loses access to encryption key

**Independent Test**: Simulate key loss and verify the recovery process works

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T032 [P] [US3] Unit test for key recovery in packages/agent-core/tests/unit/vault/vault-key-provider.test.ts
- [ ] T033 [P] [US3] Integration test for key recovery in packages/agent-core/tests/integration/vault/vault-file-storage.test.ts

### Implementation for User Story 3

- [ ] T034 [US3] Implement key rotation support in packages/agent-core/src/vault/vault-key-provider.ts
- [ ] T035 [US3] Implement re-encryption after key rotation in packages/agent-core/src/vault/vault-crypto.ts
- [ ] T036 [US3] Add recovery flow documentation in specs/004-encrypted-secrets-vault/quickstart.md
- [ ] T037 [US3] Add validation for key recovery operations
- [ ] T038 [US3] Add logging for key recovery operations

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Automatic Token Refresh (Priority: P2)

**Goal**: Automatically refresh OAuth tokens before expiration without user intervention

**Independent Test**: Store an OAuth token with refresh capabilities and verify it is automatically updated when nearing expiration

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T039 [P] [US4] Contract test for refresh method in packages/agent-core/tests/contract/vault-api.test.ts
- [ ] T040 [P] [US4] Unit test for refresh service in packages/agent-core/tests/unit/vault/vault-refresh.test.ts

### Implementation for User Story 4

- [ ] T041 [P] [US4] Create TokenProvider interface in packages/agent-core/src/vault/vault-types.ts
- [ ] T042 [P] [US4] Create RefreshService class in packages/agent-core/src/vault/vault-refresh.ts
- [ ] T043 [US4] Implement provider-specific adapters (Google, GitHub) in packages/agent-core/src/vault/vault-refresh.ts
- [ ] T044 [US4] Implement refresh method in packages/agent-core/src/vault/vault-service.ts
- [ ] T045 [US4] Implement onRefreshFailure event emission in packages/agent-core/src/vault/vault-service.ts
- [ ] T046 [US4] Add validation and error handling for refresh operations
- [ ] T047 [US4] Add logging for refresh operations

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T048 [P] Update public API exports in packages/agent-core/src/vault/index.ts
- [ ] T049 [P] Create integration tests for concurrent access in packages/agent-core/tests/integration/vault/vault-concurrent-access.test.ts
- [ ] T050 [P] Create contract tests for error handling in packages/agent-core/tests/contract/vault-api.test.ts
- [ ] T051 Code cleanup and refactoring
- [ ] T052 Security hardening (ensure no plaintext in logs/traces)
- [ ] T053 Run quickstart.md validation
- [ ] T054 Update documentation in specs/004-encrypted-secrets-vault/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 for store/decrypt methods
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on US1/US2 for key management
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on US1/US2 for token storage

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Types/interfaces before implementation
- Implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, User Stories 1 and 2 can start in parallel
- All tests for a user story marked [P] can run in parallel
- Types/interfaces within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Contract test for store method in packages/agent-core/tests/contract/vault-api.test.ts"
Task: "Integration test for storing secrets in packages/agent-core/tests/integration/vault/vault-file-storage.test.ts"

# Launch all types for User Story 1 together:
Task: "Create VaultEntry interface in packages/agent-core/src/vault/vault-types.ts"
Task: "Create VaultEntryType enum in packages/agent-core/src/vault/vault-types.ts"
Task: "Create SecretState enum in packages/agent-core/src/vault/vault-types.ts"
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
   - Developer A: User Story 1 (Store API Keys)
   - Developer B: User Story 2 (Retrieve Secrets)
   - Developer C: User Story 3 (Recovery) + User Story 4 (Refresh)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
