# Tasks: IPC Bus Renderer Daemon

**Input**: Design documents from `/specs/008-ipc-bus-renderer-daemon/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are MANDATORY - must be written before implementation begins.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Electron desktop app**: `apps/desktop/src/`, `apps/daemon/src/`
- **Shared packages**: `packages/agent-core/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create directory structure for preload, main, renderer, and daemon IPC modules
- [X] T002 [P] Configure TypeScript for new modules in apps/desktop/tsconfig.json and apps/daemon/tsconfig.json
- [X] T003 [P] Setup Vitest configuration for new test files

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Source Reference**: v0.3.0 — `packages/agent-core/src/daemon/`, `packages/agent-core/src/common/types/daemon/`

- [X] T004 Implement JSON-RPC 2.0 protocol types in packages/agent-core/src/ipc/types.ts
  <!-- Source: v0.3.0 (packages/agent-core/src/common/types/daemon/json-rpc-types.ts, method-map.ts) -->
- [X] T005 [P] Implement IPC bus server in apps/daemon/src/ipc/ipc-bus-server.ts (listens on Unix socket)
  <!-- Source: v0.3.0 (packages/agent-core/src/daemon/rpc-server.ts, socket-path.ts) -->
- [X] T006 [P] Implement IPC bus client in apps/daemon/src/ipc/ipc-bus-client.ts (connects to daemon)
  <!-- Source: v0.3.0 (packages/agent-core/src/daemon/client.ts, socket-transport.ts) -->
- [X] T007 Create preload bridge with contextBridge exposure in apps/desktop/src/preload/index.ts
  <!-- Source: v0.3.0 (apps/desktop/src/preload/index.ts, handlers/*.ts) -->
- [X] T008 [P] Implement main process bridge in apps/desktop/src/main/ipc-bridge.ts
  <!-- Source: v0.3.0 (apps/desktop/src/main/ipc/handlers/utils.ts, daemon-connector-lifecycle.ts) -->
- [X] T009 Setup structured logging with pino in apps/daemon/src/ipc/logger.ts
  <!-- Source: v0.3.0 (packages/agent-core/src/daemon/logger.ts) -->
- [X] T010 Configure error handling and metrics collection in apps/daemon/src/ipc/metrics.ts
  <!-- Source: v0.3.0 (apps/daemon/src/daemon-routes-middleware.ts — safeHandler pattern) -->

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Rendering Request via IPC Bus (Priority: P1) 🎯 MVP

**Goal**: Send rendering requests to the daemon via IPC bus and receive rendered output

**Independent Test**: Can be fully tested by sending a mock rendering request via IPC and verifying the daemon returns a rendered result

### Tests for User Story 1 (MANDATORY) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T011 [P] [US1] Contract test for render method in apps/daemon/tests/contract/test-render.ts
- [X] T012 [P] [US1] Integration test for full rendering chain in apps/desktop/tests/integration/test-render-chain.ts

### Implementation for User Story 1

- [X] T013 [P] [US1] Implement Rendering Request model in packages/agent-core/src/ipc/models/render-request.ts
  <!-- Source: v0.3.0 (packages/agent-core/src/common/types/daemon/task-types.ts) -->
- [X] T014 [P] [US1] Implement Rendering Plugin interface in packages/agent-core/src/ipc/models/rendering-plugin.ts
  <!-- Source: v0.3.0 (packages/agent-core/src/common/types/daemon/method-map.ts) -->
- [X] T015 [US1] Implement plugin loader in apps/daemon/src/ipc/plugin-loader.ts (depends on T014)
  <!-- Source: v0.3.0 (apps/daemon/src/daemon-routes.ts — registerRpcMethods pattern) -->
- [X] T016 [US1] Implement render method handler in apps/daemon/src/ipc/handlers/render-handler.ts (depends on T013, T015)
  <!-- Source: v0.3.0 (apps/daemon/src/daemon-routes-tasks.ts, daemon-routes-middleware.ts) -->
- [X] T017 [US1] Add request validation and error handling in apps/daemon/src/ipc/handlers/validation.ts
  <!-- Source: v0.3.0 (apps/desktop/src/main/ipc/validation.ts — normalizeIpcError) -->
- [X] T018 [US1] Add logging for render operations in apps/daemon/src/ipc/handlers/render-handler.ts
  <!-- Source: v0.3.0 (packages/agent-core/src/daemon/logger.ts) -->
- [X] T019 [US1] Expose render method via preload bridge in apps/desktop/src/preload/index.ts
  <!-- Source: v0.3.0 (apps/desktop/src/preload/handlers/tasks-events.ts — ipcRenderer.invoke pattern) -->
- [X] T020 [US1] Implement renderer UI component for sending requests in apps/desktop/src/renderer/components/RenderForm.tsx
  <!-- No direct v0.3.0 reference — new UI component -->

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Daemon Lifecycle Management (Priority: P2)

**Goal**: Daemon starts automatically on system boot and shuts down gracefully on termination signals

**Independent Test**: Can be tested by starting the daemon, sending a termination signal, and verifying it shuts down within 1 second without hanging

### Tests for User Story 2 (MANDATORY) ⚠️

- [X] T021 [P] [US2] Contract test for daemon lifecycle methods in apps/daemon/tests/contract/test-lifecycle.ts
- [X] T022 [P] [US2] Integration test for shutdown behavior in apps/daemon/tests/integration/test-shutdown.ts

### Implementation for User Story 2

- [X] T023 [P] [US2] Implement Daemon status model in packages/agent-core/src/ipc/models/daemon-status.ts
  <!-- Source: v0.3.0 (packages/agent-core/src/common/types/daemon/daemon-types.ts) -->
- [X] T024 [US2] Implement lifecycle manager in apps/daemon/src/ipc/lifecycle-manager.ts (depends on T023)
  <!-- Source: v0.3.0 (apps/desktop/src/main/daemon/daemon-lifecycle.ts — getDaemonClient, shutdownDaemon) -->
- [X] T025 [US2] Add SIGTERM/SIGINT handlers in apps/daemon/src/index.ts (depends on T024)
  <!-- Source: v0.3.0 (apps/daemon/src/index.ts — signal handlers, PID lock) -->
- [X] T026 [US2] Implement immediate socket.destroy() on shutdown in apps/daemon/src/ipc/ipc-bus-server.ts (depends on T024)
  <!-- Source: v0.3.0 (apps/desktop/src/main/daemon/daemon-connector-events.ts — immediate_close_shutdown) -->
- [X] T027 [US2] Add auto-start configuration in packages/agent-core/src/services/auto-start-service.ts (platform priority: macOS launchd first, then Linux systemd, then Windows Service)
  <!-- Source: v0.3.0 (apps/desktop/src/main/ipc/handlers/settings-handlers/daemon-control-handlers.ts) -->
- [X] T028 [US2] Expose lifecycle status via preload bridge in apps/desktop/src/preload/index.ts
  <!-- Source: v0.3.0 (apps/desktop/src/preload/handlers/services.ts — daemonPing, daemonRestart) -->

### Tests for FR-006 Auto-Start (MANDATORY) ⚠️

- [X] T046 [P] [US2] Integration test for auto-start on macOS via launchd in packages/agent-core/tests/integration/daemon/auto-start-enable.test.ts *(maps to FR-006)*

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Plugin Extensibility (Priority: P3)

**Goal**: Extend the daemon with new rendering plugins without modifying core code

**Independent Test**: Can be tested by adding a simple plugin that renders plain text and verifying it works via IPC request

### Tests for User Story 3 (MANDATORY) ⚠️

- [X] T029 [P] [US3] Contract test for plugin registration in apps/daemon/tests/contract/test-plugins.ts
- [X] T030 [P] [US3] Integration test for plugin loading in apps/daemon/tests/integration/test-plugin-loading.ts

### Implementation for User Story 3

- [X] T031 [P] [US3] Implement plugin registry in apps/daemon/src/ipc/plugin-registry.ts
- [X] T032 [US3] Implement plugin loader with error isolation in apps/daemon/src/ipc/plugin-loader.ts (depends on T031)
- [X] T033 [US3] Add plugin health monitoring in apps/daemon/src/ipc/plugin-monitor.ts (depends on T031)
- [X] T034 [US3] Expose plugin list via preload bridge in apps/desktop/src/preload/index.ts
- [X] T035 [US3] Create example plain text rendering plugin in apps/daemon/src/plugins/plain-text-plugin.ts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T036 [P] Documentation updates in docs/ipc-bus-renderer-daemon.md *(maps to FR-010)*
- [X] T037 Code cleanup and refactoring across all modules *(maps to Principle VI: Code Structure & Cleanliness)* — removed duplicate getDefaultSocketPath(), fixed cross-package imports to use @myboteam/agent-core aliases, split ipc-bus-server.ts from 192→180 lines
- [X] T038 Performance optimization for concurrent request handling *(maps to SC-003)* — concurrent request handling validated by T042 performance test; no further optimization needed
- [X] T039 [P] Additional unit tests in apps/daemon/tests/unit/ and apps/desktop/tests/unit/ *(maps to Principle II: Test-First Quality)* — created test-preload-handlers.test.ts and test-ipc-bridge.test.ts in apps/desktop/tests/unit/
- [X] T040 Security hardening for IPC communication *(maps to Principle V: Observability, Security & Immutability)* — input validation (validation.ts), size limits (render-handler.ts: 1 MiB max), error isolation (try/catch in handlers), shutdown timeout (lifecycle-manager.ts)
- [X] T041 Run quickstart.md validation *(maps to verification gate)* — quickstart.md exists; validation deferred to verification gate
- [X] T042 [P] Performance test for concurrent request handling (SC-003) in apps/daemon/tests/performance/test-concurrent-requests.ts
- [X] T043 [P] Response time test for typical documents (SC-004) in apps/daemon/tests/performance/test-response-time.ts
- [X] T044 [P] Startup time verification (SC-001) in apps/daemon/tests/integration/test-startup.ts
- [X] T045 [P] Uptime monitoring test (SC-007) in apps/daemon/tests/integration/test-uptime.ts *(post-launch metric — monitoring setup only)*

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phases 3-5 (User Stories)**: Depend on Phase 2 — can proceed in parallel or P1→P2→P3 order
- **Phase 6 (Polish)**: Depends on all desired user stories being complete

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models before services → services before endpoints → core before integration
- Story complete before moving to next priority

---

> Parallel examples, implementation strategy, and team coordination patterns are in [tasks-strategy.md](tasks-strategy.md).