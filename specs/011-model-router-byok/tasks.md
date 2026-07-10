# Tasks: Model Router + BYOK Key Injection

**Input**: Design documents from `/specs/011-model-router-byok/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [SYNC/ASYNC] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[SYNC]**: Requires human review (complex logic, security-critical, ambiguous requirements)
- **[ASYNC]**: Can be delegated to async agents (well-defined CRUD, repetitive tasks, clear specs)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type definitions and schema changes needed by all user stories

- [X] T001 [P] [ASYNC] Create router type definitions (ProviderHealthState, FallbackChainResult, RouterError, RouterErrorCode) in `packages/types/src/router.ts`
- [X] T002 [P] [ASYNC] Create RouterError type definitions (RouterErrorCode enum, RouterError schema) in `packages/types/src/errors.ts`
- [X] T003 [P] [ASYNC] Add optional `fallbackProviderIds` field to AgentConfigSchema in `packages/types/src/agent.ts` — field: `z.array(z.string().uuid()).optional()`
- [X] T004 [P] [ASYNC] Export new types from `packages/types/src/index.ts` barrel

**Checkpoint**: Type definitions complete — all other phases depend on these

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 [P] [ASYNC] Implement classifyTransient() and classifyPermanent() utility functions in `packages/agent-core/src/providers/tools/router-error-mapper.ts` — maps ProviderError category/code to transient/permanent classification per FR-009 (timeouts+5xx=transient, DNS+SSL+connection_refused+auth+400=permanent)
- [X] T006 [P] [ASYNC] Implement ProviderRegistry class in `packages/agent-core/src/providers/provider-registry.ts` — register/unregister/getProvider/listAll/listByType methods, holds Map<providerId, { client: ProviderClient, type: ProviderType }>
- [X] T007 [SYNC] Implement ProviderHealthTracker class in `packages/agent-core/src/providers/provider-health.ts` — state machine (healthy→degraded→cooldown→healthy), exponential backoff (60s→120s→240s→600s cap), recordSuccess/recordFailure/isAvailable/getState/getAllStates methods, concurrent access safety. Cooldown resets on success per FR-003
- [X] T008 [SYNC] Implement BYOKInjector class in `packages/agent-core/src/providers/byok-injector.ts` — inject(providerConfig, providerId) decrypts from vault, maskKey(key) for display, vault_locked error handling (skip provider + log warning per FR-005), no key caching beyond request lifecycle
- [X] T009 [P] [ASYNC] Write unit tests for classifyTransient/classifyPermanent in `packages/agent-core/tests/unit/router-error-mapper.test.ts` — test all error categories, HTTP status codes, network error types
- [X] T010 [P] [ASYNC] Write unit tests for ProviderRegistry in `packages/agent-core/tests/unit/provider-registry.test.ts` — test register/unregister/getProvider/listByType, duplicate handling
- [X] T011 [P] [ASYNC] Write unit tests for ProviderHealthTracker in `packages/agent-core/tests/unit/provider-health.test.ts` — test state transitions (healthy→degraded→cooldown→healthy), cooldown duration calculation (60s→120s→240s→600s cap), exponential backoff, reset on success (failure counter reset to 0), concurrent access
- [X] T012 [P] [ASYNC] Write unit tests for BYOKInjector in `packages/agent-core/tests/unit/byok-injector.test.ts` — test key decryption, vault locked handling, key masking, no caching

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Provider Selection by Agent Config (Priority: P1) 🎯 MVP

**Goal**: Route LLM requests to the correct provider based on agent configuration

**Independent Test**: Configure two agents with different providers, verify each routes correctly; test missing provider returns error

### Implementation for User Story 1

- [X] T013 [SYNC] [US1] Implement ModelRouter.chatCompletion() in `packages/agent-core/src/providers/model-router.ts` — provider lookup from registry, fallback chain construction (agent fallbackProviderIds → global default order), BYOK injection before provider call, health state tracking on success/failure, ProviderClientResult<T> return type per FR-008. Wire existing RetryHandler for within-provider retry (3 attempts, exponential backoff) before escalating to fallback chain per FR-011
- [X] T014 [P] [ASYNC] [US1] Write unit tests for ModelRouter.chatCompletion() in `packages/agent-core/tests/unit/model-router.test.ts` — test correct provider routing, missing provider error (PROVIDER_NOT_FOUND), global default fallback when no override set

**Checkpoint**: User Story 1 fully functional — agents route to correct providers

---

## Phase 4: User Story 2 — Fallback Chain with Dead-Host Cooldown (Priority: P1)

**Goal**: Automatic fallback to alternative providers with exponential-backoff dead-host cooldown

**Independent Test**: Simulate primary provider failure, verify fallback activates; verify cooldown prevents retries; verify recovery after cooldown

### Implementation for User Story 2

- [X] T015 [SYNC] [US2] Add fallback chain iteration to ModelRouter.chatCompletion() in `packages/agent-core/src/providers/model-router.ts` — iterate providers in chain, skip providers in cooldown (healthTracker.isAvailable), classify errors (transient vs permanent), record failures in health tracker, return ALL_PROVIDERS_FAILED with chain details when exhausted per FR-002/FR-003
- [X] T016 [SYNC] [US2] Add fallback chain iteration to ModelRouter.streamChat() in `packages/agent-core/src/providers/model-router.ts` — same fallback logic for streaming, handle mid-stream error propagation (once output starts, errors propagate without retry per existing pattern)
- [X] T017 [P] [ASYNC] [US2] Write unit tests for fallback chain in `packages/agent-core/tests/unit/model-router.test.ts` — test fallback on 5xx, cooldown skip, cooldown expiry + recovery, ALL_PROVIDERS_FAILED error, transient errors don't trigger fallback, rate limits don't increment cooldown. Include SC-002 assertion: verify fallback activates within 2 provider attempts (primary + one fallback). Include SC-003 assertion: verify cooldown duration matches formula (60s → 120s → 240s → 600s cap)

**Checkpoint**: User Stories 1 AND 2 both functional — routing with resilient fallback

---

## Phase 5: User Story 3 — BYOK Key Injection at Runtime (Priority: P1)

**Goal**: BYOK keys decrypted from vault at runtime, never logged or exposed

**Independent Test**: Configure custom provider with BYOK key, send request, verify key never appears in logs/errors/dumps

### Implementation for User Story 3

- [X] T018 [P] [ASYNC] [US3] Add BYOK key masking to log output in `packages/agent-core/src/providers/tools/logger.ts` — ensure logProviderRequest/logProviderError mask any apiKey fields using maskKey() from BYOKInjector
- [X] T019 [P] [ASYNC] [US3] Write unit tests for BYOK key non-exposure in `packages/agent-core/tests/unit/byok-injector.test.ts` — test that decrypted keys don't appear in error messages, log entries, or serialized request dumps; test vault-locked skip behavior; test all-BYOK + vault-locked = VAULT_LOCKED error

**Checkpoint**: User Stories 1, 2, AND 3 all functional — routing, fallback, and secure key injection

---

## Phase 6: User Story 4 — Per-Agent Provider Override (Priority: P2)

**Goal**: Per-agent provider overrides that take precedence over global defaults

**Independent Test**: Configure global default + one agent override, verify both agents use respective providers; test override removal reverts to default

### Implementation for User Story 4

- [X] T020 [P] [ASYNC] [US4] Update AgentConfig Zod validation in `packages/types/src/agent.ts` — add validation for fallbackProviderIds: no duplicates, must not contain primary providerId, valid UUIDs
- [X] T021 [P] [ASYNC] [US4] Write unit tests for per-agent override in `packages/agent-core/tests/unit/model-router.test.ts` — test agent with override routes to override provider, agent without override uses global default, override removal reverts to default, fallback within agent's list not global list

**Checkpoint**: User Stories 1-4 all functional — full routing, fallback, BYOK, and per-agent overrides

---

## Phase 7: User Story 5 — Provider Health Visibility (Priority: P3)

**Goal**: Visibility into provider health status for debugging and monitoring

**Independent Test**: Query health status after routing through multiple providers, verify states match expectations

### Implementation for User Story 5

- [X] T022 [P] [ASYNC] [US5] Implement ModelRouter.getHealthStatus() in `packages/agent-core/src/providers/model-router.ts` — iterate ProviderHealthTracker.getAllStates(), map to ProviderHealthStatusResponse format (providerId, providerName, state: healthy|degraded|cooldown, consecutiveFailures, cooldownExpiresAt, lastFailureReason, lastSuccessAt)
- [X] T023 [P] [ASYNC] [US5] Write unit tests for getHealthStatus() in `packages/agent-core/tests/unit/model-router.test.ts` — test healthy state reporting, cooldown state with expiry, degraded state with failure count, recovery state

**Checkpoint**: All user stories functional — full feature complete

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Barrel exports, integration wiring, final validation

- [X] T024 [P] [ASYNC] Update barrel exports in `packages/agent-core/src/index.ts` — export ModelRouter, ProviderRegistry, ProviderHealthTracker, BYOKInjector, classifyTransient, classifyPermanent
- [X] T025 [P] [ASYNC] Update barrel exports in `packages/types/src/index.ts` — export new types from router.ts and errors.ts
- [X] T026 [SYNC] Run full unit test suite — `pnpm --filter @myboteam/agent-core test` — verify all tests pass
- [X] T027 [SYNC] Run quickstart.md validation — verify architecture diagram matches implementation, verify usage example compiles and runs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (types must exist) — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 completion
- **Phase 4 (US2)**: Depends on Phase 3 (extends ModelRouter.chatCompletion with fallback)
- **Phase 5 (US3)**: Depends on Phase 2 (BYOKInjector exists); integrates with Phase 3/4 ModelRouter
- **Phase 6 (US4)**: Depends on Phase 1 (AgentConfig schema) and Phase 3 (ModelRouter)
- **Phase 7 (US5)**: Depends on Phase 2 (ProviderHealthTracker exists) and Phase 3 (ModelRouter)
- **Phase 8 (Polish)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (Provider Selection)**: Can start after Phase 2 — no dependencies on other stories
- **US2 (Fallback Chain)**: Extends US1's ModelRouter — must come after US1
- **US3 (BYOK Injection)**: Uses BYOKInjector from Phase 2, integrates into ModelRouter — can start after Phase 2, parallel with US1/US2
- **US4 (Per-Agent Override)**: Uses AgentConfig schema from Phase 1, validated in ModelRouter — can start after Phase 1, parallel with US1-US3
- **US5 (Health Visibility)**: Uses ProviderHealthTracker from Phase 2, adds to ModelRouter — can start after Phase 2, parallel with US1-US4

### Within Each User Story

- Implementation before tests (tests validate implementation)
- Core logic before integration wiring
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: All 4 tasks (T001-T004) can run in parallel [P]
- **Phase 2**: T005 + T006 can run in parallel; T009 + T010 + T011 + T012 can run in parallel
- **Phase 3**: T014 (tests) can start in parallel with T013 (implementation)
- **Phase 5**: T018 + T019 can run in parallel
- **Phase 6**: T020 + T021 can run in parallel
- **Phase 7**: T022 + T023 can run in parallel
- **Phase 8**: T024 + T025 can run in parallel

---

## Parallel Example: Phase 2 (Foundation)

```bash
# Launch foundational implementations together:
Task T005: "Implement classifyTransient/classifyPermanent in router-error-mapper.ts"
Task T006: "Implement ProviderRegistry in provider-registry.ts"

# Launch all foundational tests together (after implementations):
Task T009: "Unit tests for router-error-mapper.test.ts"
Task T010: "Unit tests for provider-registry.test.ts"
Task T011: "Unit tests for provider-health.test.ts"
Task T012: "Unit tests for byok-injector.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (type definitions)
2. Complete Phase 2: Foundational (ProviderRegistry, ProviderHealthTracker, BYOKInjector)
3. Complete Phase 3: User Story 1 (ModelRouter.chatCompletion with basic routing)
4. **STOP and VALIDATE**: Test User Story 1 independently — agents route to correct providers
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1+2 → Foundation ready
2. Phase 3 (US1) → Basic routing works → Deploy/Demo (MVP!)
3. Phase 4 (US2) → Fallback + cooldown → Deploy/Demo
4. Phase 5 (US3) → BYOK security → Deploy/Demo
5. Phase 6 (US4) → Per-agent overrides → Deploy/Demo
6. Phase 7 (US5) → Health visibility → Deploy/Demo
7. Phase 8 → Polish → Final release

### Parallel Team Strategy

With multiple developers:

1. Team completes Phase 1+2 together (foundation)
2. Once Phase 2 is done:
   - Developer A: Phase 3 (US1) + Phase 4 (US2) — routing + fallback
   - Developer B: Phase 5 (US3) — BYOK injection
   - Developer C: Phase 6 (US4) + Phase 7 (US5) — overrides + health
3. Phase 8: Team integrates and polishes

---

## Notes

- [P] tasks = different files, no dependencies
- [SYNC] tasks require human review (security, state machine, core routing)
- [ASYNC] tasks can be delegated (types, utilities, tests)
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- BYOKInjector (Phase 2) is security-critical — must be [SYNC] reviewed
- ProviderHealthTracker (Phase 2) state machine correctness is critical — must be [SYNC] reviewed
