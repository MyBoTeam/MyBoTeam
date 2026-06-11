# Tasks: Pi Vendor Harness

**Input**: Design documents from `specs/001-pi-vendor-harness/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md), [contracts/task-harness.md](./contracts/task-harness.md), [contracts/pi-package-boundaries.md](./contracts/pi-package-boundaries.md)

**Tests**: Required. MAO-66 changes core task execution, provider credentials, tools, MCP, connector behavior, and deprecation gates. Automated tests are required before or alongside implementation; live credentialed checks are recorded in `validation-evidence.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. P1 protects current behavior first, P2 introduces full-parity Pi routing, and P3 validates the package-boundary/update model.

## Format: `[ID] [P?] [SYNC/ASYNC] [Story?] Description`

- **[P]**: Can run in parallel with other marked tasks in the same phase after dependencies are met
- **[SYNC]**: Requires human review/oversight due to architecture, security, data lifecycle, or external integration risk
- **[ASYNC]**: Can be delegated after prerequisites are complete because the task is bounded and deterministic
- **[US1]/[US2]/[US3]**: User story labels from [spec.md](./spec.md)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create workspace package shells, validation artifacts, and test scaffolding needed by all stories.

- [X] T001 [ASYNC] Create `packages/pi-vendor/package.json`, `packages/pi-vendor/tsconfig.json`, and `packages/pi-vendor/src/index.ts` following workspace ESM package conventions
- [X] T002 [ASYNC] Create `packages/pi-agent-core/package.json`, `packages/pi-agent-core/tsconfig.json`, and `packages/pi-agent-core/src/index.ts` following workspace ESM package conventions
- [X] T003 [P] [ASYNC] Verify the existing `packages/*` workspace glob includes `@myboteam/pi-vendor` and `@myboteam/pi-agent-core`, then add root workspace dependency resolution only where needed
- [X] T004 [P] [ASYNC] Create `packages/pi-vendor/VENDORS.md` with upstream repo, release tag `v0.79.1`, commit `28df940f0d07b65284849a483be7b06e2ca046ee`, copied scope, update procedure, local adaptations, and release-review license status
- [X] T005 [P] [ASYNC] Create `specs/001-pi-vendor-harness/validation-evidence.md` template with status, scope item, environment, command/result, evidence link, reviewer, secret-safety note, residual risk, approved exclusions, approved gaps, and deprecation approval sections
- [X] T006 [P] [ASYNC] Create test fixture directories `packages/pi-agent-core/tests/fixtures/` and `packages/pi-agent-core/tests/unit/` for Pi event, tool, provider, and permission fixtures
- [X] T007 [P] [ASYNC] Create `packages/pi-agent-core/src/validation/redaction.ts` placeholder module and matching `packages/pi-agent-core/tests/unit/redaction.test.ts` for secret-redaction test-first coverage
- [X] T008 [P] [ASYNC] Add package-level test scripts for `@myboteam/pi-vendor` and `@myboteam/pi-agent-core` in `packages/pi-vendor/package.json` and `packages/pi-agent-core/package.json`
- [X] T106 [SYNC] Create `specs/001-pi-vendor-harness/current-capability-inventory.md` by enumerating current providers/models, built-in tools, MCP capabilities, connectors, local-only workflows, source files, and validation owners; require T039, T052, T053, T097, and T098 to use this inventory as their parity scope
- [X] T107 [SYNC] Extract V0.2.0 demo lifecycle, error, timeout, and credential expectations into `packages/pi-agent-core/tests/fixtures/v020-demo-behavior.md` and cross-reference them from `specs/001-pi-vendor-harness/validation-evidence.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define shared runtime contracts and safe package boundaries before any user-story implementation.

**Critical**: No user story work should begin until this phase is complete.

- [X] T009 [SYNC] Define a harness-neutral `TaskRuntimeAdapter` contract in `packages/agent-core/src/internal/classes/adapter-types.ts` without removing the existing OpenCode adapter exports
- [X] T010 [SYNC] Add unit tests for adapter factory selection and OpenCode default preservation in `packages/agent-core/tests/unit/task-runtime-adapter-factory.test.ts`
- [X] T011 [SYNC] Implement a task runtime adapter factory in `packages/agent-core/src/internal/classes/task-runtime-adapter-factory.ts` that can create the current OpenCode adapter and later the Pi adapter
- [X] T012 [SYNC] Update `packages/agent-core/src/internal/classes/task-manager-execution.ts` to use the task runtime adapter factory instead of directly constructing `OpenCodeAdapter`
- [X] T013 [SYNC] Update `packages/agent-core/src/internal/classes/task-manager-utils.ts` to accept the harness-neutral adapter event contract while preserving all current callback behavior
- [X] T014 [P] [ASYNC] Export the adapter factory and harness-neutral task adapter types from `packages/agent-core/src/index.ts` and `packages/agent-core/src/desktop-main.ts`
- [X] T015 [SYNC] Add tests for no automatic Pi-to-current-harness fallback in `packages/agent-core/tests/unit/task-runtime-no-fallback.test.ts`
- [X] T016 [SYNC] Add clean-start task/session/history deletion contract tests in `apps/daemon/__tests__/unit/clean-start-task-state.unit.test.ts`
- [X] T017 [SYNC] Implement clean-start deletion of old task history, task messages, todos, and current-harness session state in `apps/daemon/src/app-setup.ts` and `apps/daemon/src/storage-service.ts`
- [X] T018 [SYNC] Add provider credential runtime lookup contract tests in `packages/pi-agent-core/tests/unit/provider-credentials.test.ts`
- [X] T019 [SYNC] Define Pi provider credential resolver interfaces in `packages/pi-agent-core/src/models/provider-credential-resolver.ts` that retrieve secrets by callback and never write generated auth files
- [X] T020 [P] [ASYNC] Add a validation evidence schema helper in `packages/pi-agent-core/src/validation/evidence-schema.ts` and tests in `packages/pi-agent-core/tests/unit/evidence-schema.test.ts`
- [X] T108 [SYNC] Update shared task-source contracts, validation, and tests in `packages/agent-core/src/common/types/task.ts`, daemon routing code, and `apps/daemon/__tests__/unit/task-source-routing.unit.test.ts` so daemon/background and connector-triggered starts are represented explicitly or mapped through a documented existing source value
- [X] T021 [SYNC] Run `pnpm check`, `pnpm -F @myboteam/agent-core test`, `pnpm -F @myboteam/daemon test`, and record Phase 2 results in `specs/001-pi-vendor-harness/validation-evidence.md`

**Checkpoint**: Foundation ready. Current task manager behavior is protected, clean-start state behavior is defined, and Pi adapter package boundaries can be implemented.

---

## Phase 3: User Story 1 - Preserve Existing Task Execution (Priority: P1) MVP

**Goal**: Existing task creation, execution, progress streaming, permissions, provider selection, connector behavior, browser frames, summaries, and results continue working while Pi is introduced.

**Independent Test**: Run existing task flow and relevant automated checks with the current harness still available; the same user-visible lifecycle states and task results are produced without new setup steps.

### Tests for User Story 1

- [X] T022 [P] [SYNC] [US1] Add current-harness task lifecycle regression tests in `packages/agent-core/tests/unit/current-harness-lifecycle-regression.test.ts`
- [X] T023 [P] [SYNC] [US1] Add daemon task event forwarding regression tests for message, progress, permission, summary, browser frame, complete, and error events in `apps/daemon/__tests__/unit/task-event-forwarding.unit.test.ts`
- [X] T024 [P] [SYNC] [US1] Add daemon tests proving UI, scheduler, WhatsApp, and connector-triggered task starts still converge through `TaskService` in `apps/daemon/__tests__/unit/task-source-routing.unit.test.ts`
- [X] T025 [P] [SYNC] [US1] Add regression tests that no normal user-facing harness selector or deprecation warning is exposed in `apps/web/src/client/__tests__/harness-selector-absence.test.tsx`
- [X] T026 [P] [SYNC] [US1] Add existing permission auto-deny behavior tests for WhatsApp/background tasks in `apps/daemon/__tests__/unit/task-permission-source-policy.unit.test.ts`
- [X] T027 [P] [ASYNC] [US1] Add summary/title preservation tests for current task flow in `apps/daemon/__tests__/unit/task-summary-title-regression.unit.test.ts`
- [X] T028 [P] [ASYNC] [US1] Add browser preview/frame regression tests in `apps/daemon/__tests__/unit/task-browser-frame-regression.unit.test.ts`

### Implementation for User Story 1

- [X] T029 [SYNC] [US1] Preserve OpenCode runtime construction and lifecycle behavior in `packages/agent-core/src/internal/classes/open-code-adapter.ts` while adapting it to `TaskRuntimeAdapter`
- [X] T030 [SYNC] [US1] Preserve daemon `TaskService` start, stop, interrupt, and resume method behavior in `apps/daemon/src/task-service.ts` while preparing for Pi routing
- [X] T031 [SYNC] [US1] Preserve task callback storage and event emission behavior in `apps/daemon/src/task-callbacks.ts` for both current and future Pi adapters
- [X] T032 [ASYNC] [US1] Update maintainer documentation in `packages/agent-core/README.md` describing current harness preservation during MAO-66 and removal being out of scope
- [X] T033 [SYNC] [US1] Run `pnpm -F @myboteam/agent-core test`, `pnpm -F @myboteam/daemon test`, and record US1 regression evidence in `specs/001-pi-vendor-harness/validation-evidence.md`

**Checkpoint**: User Story 1 is independently complete when existing/current-harness behavior is regression-protected and remains runnable.

---

## Phase 4: User Story 2 - Introduce Pi as a Full-Parity Harness Path (Priority: P2)

**Goal**: Pi-backed execution becomes the default route for all current task sources and preserves the existing task lifecycle, tools, permissions, providers, connectors, browser frames, summaries/titles, diagnostics, and terminal states.

**Independent Test**: Run representative credentialed tasks through Pi; they stream assistant output, invoke required tools/connectors, surface tool outcomes, and complete through the existing task lifecycle.

### Tests for User Story 2

- [X] T034 [P] [ASYNC] [US2] Add deterministic Pi text/thinking event mapping fixture tests in `packages/pi-agent-core/tests/unit/pi-event-text-mapping.test.ts`
- [X] T035 [P] [ASYNC] [US2] Add deterministic Pi tool start/update/end mapping fixture tests in `packages/pi-agent-core/tests/unit/pi-event-tool-mapping.test.ts`
- [X] T036 [P] [SYNC] [US2] Add Pi task terminal-state tests for success, failure, cancellation, interruption, startup failure, and pre-result failure in `packages/pi-agent-core/tests/unit/pi-runtime-terminal-states.test.ts`
- [X] T037 [P] [SYNC] [US2] Add Pi permission bridge tests for high-risk approval, denial with `{ block: true, reason }`, and low-risk safe-tool execution in `packages/pi-agent-core/tests/unit/pi-permission-bridge.test.ts`
- [X] T038 [P] [SYNC] [US2] Add Pi provider/model resolver tests for all configured provider classes and approved-exclusion recording in `packages/pi-agent-core/tests/unit/pi-provider-model-resolver.test.ts`
- [X] T039 [P] [SYNC] [US2] Add Pi tool/MCP/connector bridge contract tests in `packages/pi-agent-core/tests/unit/pi-tool-mcp-connector-bridge.test.ts`
- [X] T040 [P] [ASYNC] [US2] Add Pi browser frame mapping tests in `packages/pi-agent-core/tests/unit/pi-browser-frame-mapping.test.ts`
- [ ] T041 [P] [ASYNC] [US2] Add Pi summary/title behavior tests in `apps/daemon/__tests__/unit/pi-summary-title.unit.test.ts`
- [ ] T042 [P] [SYNC] [US2] Add no-fallback daemon integration tests for Pi startup/pre-result failure in `apps/daemon/__tests__/unit/pi-no-fallback.unit.test.ts`
- [ ] T043 [P] [SYNC] [US2] Add all-task-source Pi routing tests for UI, daemon/background, scheduler, WhatsApp, and connector-triggered tasks in `apps/daemon/__tests__/unit/pi-task-source-routing.unit.test.ts`
- [X] T044 [P] [ASYNC] [US2] Add Pi diagnostic redaction tests for provider secrets, connector tokens, credential material, and sensitive tool outputs in `packages/pi-agent-core/tests/unit/pi-diagnostic-redaction.test.ts`
- [ ] T045 [P] [SYNC] [US2] Add Pi event batching/storage integration tests in `apps/daemon/__tests__/unit/pi-task-event-storage.unit.test.ts`

### Implementation for User Story 2

- [X] T046 [SYNC] [US2] Copy upstream Pi agent and AI source for tag `v0.79.1` commit `28df940f0d07b65284849a483be7b06e2ca046ee` into `packages/pi-vendor/src/pi-agent-core/` and `packages/pi-vendor/src/pi-ai/`
- [X] T047 [SYNC] [US2] Adapt copied upstream imports, package exports, and dependency declarations in `packages/pi-vendor/package.json` and `packages/pi-vendor/src/index.ts` without adding MyBoTeam wrapper logic to `pi-vendor`
- [X] T048 [ASYNC] [US2] Add upstream refresh validation notes and copied-scope checks to `packages/pi-vendor/VENDORS.md`
- [X] T049 [SYNC] [US2] Implement Pi event mapper in `packages/pi-agent-core/src/events/pi-event-mapper.ts` for assistant text, reasoning, tool events, turn finish, completion, and errors
- [ ] T050 [SYNC] [US2] Implement Pi runtime adapter in `packages/pi-agent-core/src/adapter/pi-task-runtime-adapter.ts` using vendored `Agent`, runtime `getApiKey`, abort handling, and no OpenCode fallback
- [X] T051 [SYNC] [US2] Implement Pi provider/model resolver in `packages/pi-agent-core/src/models/pi-model-resolver.ts` using current provider settings and maintainer-approved exclusion output
- [X] T052 [SYNC] [US2] Implement Pi tool bridge in `packages/pi-agent-core/src/tools/pi-tool-bridge.ts` for current MyBoTeam built-in tool calls and tool-result messages
- [X] T053 [SYNC] [US2] Implement Pi MCP and connector bridge in `packages/pi-agent-core/src/tools/pi-mcp-connector-bridge.ts` using existing connector token handling and MCP capability metadata
- [X] T054 [SYNC] [US2] Implement Pi permission bridge in `packages/pi-agent-core/src/tools/pi-permission-bridge.ts` using current high-risk permission flow and low-risk safe-tool policy
- [X] T055 [ASYNC] [US2] Implement Pi browser frame mapper in `packages/pi-agent-core/src/events/pi-browser-frame-mapper.ts` preserving current browser preview/frame payload shape
- [X] T056 [ASYNC] [US2] Implement Pi diagnostic logger in `packages/pi-agent-core/src/validation/pi-diagnostic-logger.ts` using existing app/daemon log path and redaction helpers
- [ ] T057 [SYNC] [US2] Wire `@myboteam/pi-agent-core` into `packages/agent-core/src/internal/classes/task-runtime-adapter-factory.ts` so Pi is selected for all normal task starts after implementation
- [ ] T058 [SYNC] [US2] Add daemon provider credential callback plumbing for Pi runtime in `apps/daemon/src/task-config-builder.ts` and `apps/daemon/src/task-service.ts`
- [ ] T059 [SYNC] [US2] Update scheduler task execution to rely on Pi default routing through `TaskService` in `apps/daemon/src/scheduler-service.ts`
- [ ] T060 [SYNC] [US2] Update WhatsApp and connector-triggered task bridges to rely on Pi default routing through `TaskService` in `apps/daemon/src/whatsapp/taskBridge.ts` and `apps/daemon/src/connector-service.ts`
- [ ] T061 [SYNC] [US2] Preserve cancel and interrupt propagation from daemon `TaskService` into Pi abort handling in `apps/daemon/src/task-service.ts` and `packages/pi-agent-core/src/adapter/pi-task-runtime-adapter.ts`
- [ ] T062 [SYNC] [US2] Preserve summary/title generation after Pi task completion in `apps/daemon/src/task-service-execution.ts` and `apps/daemon/src/task-config-builder.ts`
- [ ] T063 [SYNC] [US2] Ensure Pi startup/pre-result failures emit clear task failures and do not call the current harness in `packages/pi-agent-core/src/adapter/pi-task-runtime-adapter.ts`
- [ ] T064 [SYNC] [US2] Update task manager tests and code to keep current harness runnable only through maintainer diagnostics in `packages/agent-core/src/internal/classes/task-runtime-adapter-factory.ts`
- [ ] T065 [ASYNC] [US2] Add typed public exports for Pi adapter, event mapper, provider resolver, tool bridge, and validation helpers in `packages/pi-agent-core/src/index.ts`
- [ ] T066 [SYNC] [US2] Run `pnpm -F @myboteam/pi-agent-core test`, `pnpm -F @myboteam/agent-core test`, `pnpm -F @myboteam/daemon test`, and record US2 automated evidence in `specs/001-pi-vendor-harness/validation-evidence.md`

**Checkpoint**: User Story 2 is independently complete when Pi routes all current task sources and passes automated lifecycle, provider, tool, permission, browser, failure, and task-source tests.

---

## Phase 5: User Story 3 - Maintain Pi Package Boundaries Deliberately (Priority: P3)

**Goal**: Maintainers can distinguish MyBoTeam Pi wrappers/adapters from copied upstream Pi source and can refresh upstream Pi deliberately.

**Independent Test**: Inspect package boundaries and documentation; a maintainer can identify wrapper/adapters, copied upstream source, origin, tag, SHA, copied scope, local adaptations, and update procedure in under 2 minutes.

### Tests for User Story 3

- [ ] T067 [P] [ASYNC] [US3] Add package boundary tests proving `@myboteam/pi-vendor` does not import `@myboteam/pi-agent-core`, daemon, desktop, or web code in `packages/pi-vendor/tests/package-boundary.test.ts`
- [ ] T068 [P] [ASYNC] [US3] Add package boundary tests proving `@myboteam/pi-agent-core` uses `@myboteam/pi-vendor` and shared `@myboteam/agent-core` contracts without copied upstream source in `packages/pi-agent-core/tests/unit/package-boundary.test.ts`
- [ ] T069 [P] [ASYNC] [US3] Add provenance document checks for tag, SHA, copied scope, local adaptations, update procedure, and release-review license status in `packages/pi-vendor/tests/vendors-doc.test.ts`

### Implementation for User Story 3

- [ ] T070 [ASYNC] [US3] Update `packages/pi-vendor/README.md` with upstream refresh instructions and package ownership boundaries
- [ ] T071 [ASYNC] [US3] Update `packages/pi-agent-core/README.md` with wrapper/adapter ownership, task runtime responsibilities, and dependency boundaries
- [ ] T072 [SYNC] [US3] Review copied upstream source adaptations in `packages/pi-vendor/src/` and record local adaptation notes in `packages/pi-vendor/VENDORS.md`
- [ ] T073 [SYNC] [US3] Run package boundary tests and record maintainer inspection evidence in `specs/001-pi-vendor-harness/validation-evidence.md`

**Checkpoint**: User Story 3 is independently complete when package boundaries and upstream refresh documentation are testable and reviewable.

---

## Phase 6: Edge Case Test Coverage

**Purpose**: Ensure every documented edge case has at least one automated test task.

- [ ] T074 [P] [SYNC] Add automated tests for missing, expired, invalid, or differently mapped Pi provider credentials in `packages/pi-agent-core/tests/unit/pi-provider-credential-edge-cases.test.ts`
- [ ] T075 [P] [SYNC] Add automated tests for unsupported provider/model approved-exclusion behavior in `packages/pi-agent-core/tests/unit/pi-provider-exclusion-edge-cases.test.ts`
- [ ] T076 [P] [SYNC] Add automated tests for Pi startup failure and pre-result failure in `packages/pi-agent-core/tests/unit/pi-startup-failure-edge-cases.test.ts`
- [ ] T077 [P] [ASYNC] Add automated tests for Pi event order/shape differences in `packages/pi-agent-core/tests/unit/pi-event-order-edge-cases.test.ts`
- [ ] T078 [P] [SYNC] Add automated tests for long-running, failing, permission-sensitive, and connector-backed tools in `packages/pi-agent-core/tests/unit/pi-tool-edge-cases.test.ts`
- [ ] T079 [P] [SYNC] Add automated tests for cancellation/interruption during model output and tool execution in `packages/pi-agent-core/tests/unit/pi-cancel-interrupt-edge-cases.test.ts`
- [ ] T080 [P] [ASYNC] Add automated tests for summary/title failures or differing output after Pi completion in `apps/daemon/__tests__/unit/pi-summary-title-edge-cases.unit.test.ts`
- [ ] T081 [P] [ASYNC] Add automated tests for missing/incompatible Pi browser preview and frame events in `packages/pi-agent-core/tests/unit/pi-browser-frame-edge-cases.test.ts`
- [ ] T082 [P] [SYNC] Add automated tests for tool-safe marking conflicts with current permission policy in `packages/pi-agent-core/tests/unit/pi-safe-tool-policy-edge-cases.test.ts`
- [ ] T083 [P] [SYNC] Add automated tests for unsupported tool/MCP/connector/local-only workflow approved-exclusion behavior in `packages/pi-agent-core/tests/unit/pi-capability-exclusion-edge-cases.test.ts`
- [ ] T084 [P] [ASYNC] Add automated checks for vendored dependency, build, packaging, import, and convention conflicts in `packages/pi-vendor/tests/vendor-convention-edge-cases.test.ts`
- [ ] T085 [P] [ASYNC] Add automated checks that license/notice review remains blocked until release review in `packages/pi-vendor/tests/license-release-review-edge-case.test.ts`
- [ ] T086 [P] [SYNC] Add automated tests that current harness remains available if parity validation later fails after deprecation marker in `packages/agent-core/tests/unit/current-harness-deprecation-edge-case.test.ts`
- [ ] T087 [P] [SYNC] Add secret-safety tests scanning Pi logs, fixtures, screenshots, traces, and task events for provider secrets and connector tokens in `packages/pi-agent-core/tests/unit/pi-secret-safety-edge-cases.test.ts`
- [ ] T088 [P] [ASYNC] Add validation-evidence completeness tests for missing statuses, exclusions, gaps, deprecation approval, and required item fields in `packages/pi-agent-core/tests/unit/validation-evidence-edge-cases.test.ts`
- [ ] T089 [P] [SYNC] Add automated tests that old sessions, task history, and task messages are deleted for clean-start acceptance in `apps/daemon/__tests__/unit/clean-start-deletion-edge-cases.unit.test.ts`
- [ ] T090 [P] [SYNC] Add automated tests that validation items requiring credentials fail/gap clearly when credentials are not configured during clean start in `packages/pi-agent-core/tests/unit/pi-validation-credential-gap-edge-cases.test.ts`
- [ ] T091 [P] [SYNC] Add comparable performance validation harness for Pi versus current harness with reviewer-judged no-material-regression output in `packages/pi-agent-core/tests/integration/pi-performance-comparison.integration.test.ts`
- [ ] T092 [P] [SYNC] Add packaged desktop validation smoke test for Pi package availability and startup in `apps/desktop/e2e/specs/pi-packaged-runtime.spec.ts`

---

## Phase 7: Validation, Deprecation, and Release Readiness

**Purpose**: Perform required checks, record evidence, and mark the current harness deprecated only after approval.

- [ ] T093 [SYNC] Run full static verification `pnpm check` and record output in `specs/001-pi-vendor-harness/validation-evidence.md`
- [ ] T094 [SYNC] Run workspace tests `pnpm -F @myboteam/pi-agent-core test`, `pnpm -F @myboteam/agent-core test`, `pnpm -F @myboteam/daemon test`, `pnpm -F @myboteam/desktop test`, and `pnpm -F @myboteam/web test` where touched, then record output in `specs/001-pi-vendor-harness/validation-evidence.md`
- [ ] T095 [SYNC] Run clean-start dev validation with `pnpm dev:clean` and record old-state deletion, Pi routing, credential setup, and no user-facing selector/warning evidence in `specs/001-pi-vendor-harness/validation-evidence.md`
- [ ] T096 [SYNC] Run packaged desktop build validation and record Pi package availability, startup, and secret-safety evidence in `specs/001-pi-vendor-harness/validation-evidence.md`
- [ ] T097 [SYNC] Run live credentialed provider/model regression for all configured current repo providers/models and record pass, approved exclusion, or approved gap entries in `specs/001-pi-vendor-harness/validation-evidence.md`
- [ ] T098 [SYNC] Run live credentialed tool/MCP/connector regression for all current repo capabilities and record pass, approved exclusion, or approved gap entries in `specs/001-pi-vendor-harness/validation-evidence.md`
- [ ] T099 [SYNC] Run live task-source regression for UI, daemon/background, scheduler, WhatsApp, and connector-triggered tasks and record results in `specs/001-pi-vendor-harness/validation-evidence.md`
- [ ] T100 [SYNC] Review upstream Pi license and notice handling for release readiness and record release-review status in `packages/pi-vendor/VENDORS.md` and `specs/001-pi-vendor-harness/validation-evidence.md`
- [ ] T101 [SYNC] Obtain maintainer approval for parity evidence, approved exclusions, approved gaps, and deprecation readiness in `specs/001-pi-vendor-harness/validation-evidence.md`
- [ ] T102 [SYNC] Add code-level deprecation annotations for the current harness in `packages/agent-core/src/internal/classes/open-code-adapter.ts` and related current-harness exports without removing code or adding normal user-facing warnings
- [ ] T103 [ASYNC] Update maintainer-facing current-harness deprecation documentation in `packages/agent-core/README.md` with link/reference to `specs/001-pi-vendor-harness/validation-evidence.md`
- [ ] T104 [SYNC] Run final regression `pnpm check`, `pnpm -F @myboteam/agent-core test`, `pnpm -F @myboteam/pi-agent-core test`, `pnpm -F @myboteam/daemon test`, and record final deprecation evidence in `specs/001-pi-vendor-harness/validation-evidence.md`
- [ ] T105 [SYNC] Rerun `architecture.init` after MAO-66 implementation and validation to refresh the Architecture Description (AD) for `pi-vendor`, `pi-agent-core`, task manager routing, current-harness deprecation, and validation evidence

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies.
- **Phase 2 Foundational**: Depends on Phase 1 package/test scaffolding.
- **US1 (Phase 3)**: Depends on Phase 2; should complete before Pi becomes the default route.
- **US2 (Phase 4)**: Depends on Phase 2 and should preserve all US1 regressions.
- **US3 (Phase 5)**: Depends on package scaffolding and vendored package work from Phases 1 and 4.
- **Edge Case Tests (Phase 6)**: Depends on the relevant US2/US3 implementation surfaces.
- **Validation/Deprecation (Phase 7)**: Depends on US1, US2, US3, and edge-case coverage.

### User Story Dependencies

- **US1 (P1)**: MVP and regression guard. No other story dependency after Phase 2.
- **US2 (P2)**: Depends on Phase 2 and must not regress US1.
- **US3 (P3)**: Can proceed after package scaffolding, but final package-boundary validation depends on US2 vendoring/adapter work.

### Story Completion Criteria

- **US1 complete**: Current harness remains runnable, existing lifecycle/callback behavior is regression-tested, no user-facing harness selector/warning exists.
- **US2 complete**: Pi routes all current task sources and passes automated lifecycle/provider/tool/MCP/connector/permission/browser/summary/failure tests.
- **US3 complete**: Package boundaries are documented, tested, and maintainer-reviewable for future upstream refresh.

## Parallel Execution Examples

### US1 Parallel Tests

```text
Task: "T022 current-harness lifecycle regression in packages/agent-core/tests/unit/current-harness-lifecycle-regression.test.ts"
Task: "T023 daemon task event forwarding regression in apps/daemon/__tests__/unit/task-event-forwarding.unit.test.ts"
Task: "T025 harness selector absence regression in apps/web/src/client/__tests__/harness-selector-absence.test.tsx"
```

### US2 Parallel Mapper/Resolver Tests

```text
Task: "T034 Pi text/thinking event mapping fixture tests in packages/pi-agent-core/tests/unit/pi-event-text-mapping.test.ts"
Task: "T035 Pi tool event mapping fixture tests in packages/pi-agent-core/tests/unit/pi-event-tool-mapping.test.ts"
Task: "T040 Pi browser frame mapping tests in packages/pi-agent-core/tests/unit/pi-browser-frame-mapping.test.ts"
Task: "T044 Pi diagnostic redaction tests in packages/pi-agent-core/tests/unit/pi-diagnostic-redaction.test.ts"
```

### US3 Parallel Boundary Tests

```text
Task: "T067 pi-vendor import boundary tests in packages/pi-vendor/tests/package-boundary.test.ts"
Task: "T068 pi-agent-core boundary tests in packages/pi-agent-core/tests/unit/package-boundary.test.ts"
Task: "T069 VENDORS.md provenance checks in packages/pi-vendor/tests/vendors-doc.test.ts"
```

## Implementation Strategy

### MVP First

Complete Phases 1-3 first. This produces the MVP safety baseline: existing task execution is protected and the current harness remains runnable while Pi work is introduced.

### Incremental Delivery

1. Build package boundaries and adapter abstraction.
2. Lock down current-harness regression behavior.
3. Implement Pi runtime and event/provider/tool bridges.
4. Complete package-boundary documentation and edge-case coverage.
5. Run live validation and only then mark current harness deprecated.
6. Rerun `architecture.init` as the final task so the AD reflects the implemented architecture.

### Validation Gates

- No Pi default routing before US1 regression tests pass.
- No current-harness deprecation before automated checks, live credentialed parity regression, and maintainer approval are recorded.
- No MAO-66 completion if any current provider/tool/MCP/connector parity gap lacks maintainer-approved exclusion or validation-gap status.
- No release readiness until upstream Pi license/notice review is recorded.
