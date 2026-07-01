# Implementation Plan: IPC Bus Renderer Daemon

**Branch**: `008-ipc-bus-renderer-daemon` | **Date**: 2026-06-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-ipc-bus-renderer-daemon/spec.md`

**Note**: This template is filled in by the `/spec.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement IPC bus for communication between renderer and daemon, establishing a 4-link chain (React → preload → main → daemon) with typed API exposure and event forwarding. Uses JSON-RPC 2.0 over Unix sockets following v0.3.0 preload handler patterns. Supports plugin extensibility, daemon lifecycle management, and structured logging.

## Technical Context

**Language/Version**: TypeScript 5.7+ (ESM modules)  
**Primary Dependencies**: Electron, React, node:net, node:crypto, pino (structured logger)  
**Storage**: N/A (IPC transport only)  
**Testing**: Vitest (unit, integration, contract tests)  
**Target Platform**: Electron desktop app (Windows, macOS, Linux)  
**Project Type**: desktop-app (Electron renderer-daemon IPC)  
**Performance Goals**: Handle 100+ concurrent rendering requests, <500ms response time for typical documents  
**Constraints**: 1 MiB (1,048,576 bytes) maximum message size, JSON-RPC 2.0 protocol, local trust model (no auth), renderer zero Node.js/filesystem access  
**Scale/Scope**: Daemon IPC for MyBot Team agent system, renderer-daemon communication

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ PASS | Spec exists with user stories, requirements, success criteria |
| II. Test-First Quality | ✅ PASS | Unit, integration, contract tests specified and marked MANDATORY |
| III. Simplicity & Surgical Changes | ✅ PASS | Following v0.3.0 preload handler pattern, minimal implementation |
| IV. Human Oversight & Goal-Driven Execution | ✅ PASS | Clear success criteria, SYNC/ASYNC classification planned |
| V. Observability, Security & Immutability | ✅ PASS | Structured logging, metrics, input validation, no auth required |
| VI. Code Structure & Cleanliness | ✅ PASS | Single responsibility, files under 200 lines |
| VII. Source Reference (MANDATORY) | ✅ PASS | Reference: v0.3.0 preload handler pattern analyzed |
| VIII. Git Hooks Are Non-Negotiable | ✅ PASS | Will use git hooks, no --no-verify |
| IX. Linter/Formatter Configs Are Protected | ✅ PASS | Will not modify biome.json, etc. |
| X. Test Location | ✅ PASS | Tests colocated with code |

## Source Reference Analysis (MANDATORY)

### v0.3.0 Reference Implementation

**Source Location**: `/Users/mavishay/Projects/MaorInnovations/myboteam_V0.3.0`

**Files Analyzed**:
- `packages/agent-core/src/daemon/server.ts` — DaemonServer class (JSON-RPC 2.0 server)
- `packages/agent-core/src/daemon/client.ts` — DaemonClient class (JSON-RPC 2.0 client)
- `packages/agent-core/src/daemon/rpc-server.ts` — DaemonRpcServer class (multi-client TCP server)
- `packages/agent-core/src/daemon/socket-transport.ts` — createSocketTransport() (Unix socket client)
- `packages/agent-core/src/daemon/socket-path.ts` — getSocketPath(), getPidFilePath()
- `packages/agent-core/src/daemon/logger.ts` — DaemonLogger interface
- `packages/agent-core/src/common/types/daemon/json-rpc-types.ts` — JSON-RPC type definitions
- `packages/agent-core/src/common/types/daemon/method-map.ts` — DaemonMethodMap
- `packages/agent-core/src/common/types/daemon/connection-types.ts` — DaemonTransport interface
- `apps/desktop/src/preload/index.ts` — contextBridge.exposeInMainWorld('myboteam', ...)
- `apps/desktop/src/preload/handlers/*.ts` — IPC handler patterns (app-core, tasks-events, services)
- `apps/desktop/src/main/ipc/handlers/utils.ts` — handle() wrapper for ipcMain.handle
- `apps/desktop/src/main/daemon/daemon-connector-lifecycle.ts` — ensureDaemonRunning()
- `apps/desktop/src/main/daemon/daemon-connector-events.ts` — Reconnection with exponential backoff
- `apps/desktop/src/main/daemon/daemon-lifecycle.ts` — getDaemonClient(), shutdownDaemon()
- `apps/desktop/src/main/daemon-bootstrap.ts` — bootstrapDaemon() entry point
- `apps/daemon/src/index.ts` — Daemon entry point with PID lock, signal handlers
- `apps/daemon/src/app-setup.ts` — bootDaemon() creates RPC server, registers routes
- `apps/daemon/src/daemon-routes.ts` — registerRpcMethods() for all RPC handlers

**Key Patterns to Adopt**:
1. **JSON-RPC 2.0 over Unix sockets** — Line-delimited JSON with auto-incrementing IDs
2. **DaemonTransport interface** — `{ send(), onMessage(), close() }` abstraction
3. **contextBridge.exposeInMainWorld()** — Typed API exposure to renderer
4. **ipcMain.handle() / ipcRenderer.invoke()** — Electron IPC bridge pattern
5. **DaemonClient.call<M>(method, params)** — Typed RPC calls with timeout handling
6. **Reconnection with exponential backoff** — 200ms initial, 2x backoff, 5s max
7. **PID lock file** — Atomic lock with stale detection
8. **safeHandler() wrapper** — Error sanitization for RPC handlers
9. **Notification forwarding** — Daemon → Main → Renderer via webContents.send()

**Patterns NOT to Adopt** (not needed for v0.5.0):
- Node.js/filesystem access in renderer (security constraint — FR-006)
- Direct daemon communication from renderer (must go through preload→main)
- In-process transport (only for testing in v0.3.0)
- IPC envelope wrapper (`{ __daemon: true, payload }`) — use direct JSON-RPC

## Project Structure

### Documentation (this feature)

```text
specs/008-ipc-bus-renderer-daemon/
├── plan.md              # This file (/spec.plan command output)
├── research.md          # Phase 0 output (/spec.plan command)
├── data-model.md        # Phase 1 output (/spec.plan command)
├── quickstart.md        # Phase 1 output (/spec.plan command)
├── contracts/           # Phase 1 output (/spec.plan command)
└── tasks.md             # Phase 2 output (/spec.tasks command - NOT created by /spec.plan)
```

### Source Code (repository root)

```text
apps/desktop/
├── src/
│   ├── preload/              # Preload scripts (contextBridge)
│   │   ├── index.ts
│   │   └── ipc-handlers.ts
│   ├── renderer/             # React UI (renderer process)
│   │   └── components/
│   │       └── RenderForm.tsx
│   └── main/                 # Electron main process
│       └── ipc-bridge.ts
└── tests/
    └── integration/
        └── test-render-chain.test.ts

apps/daemon/
├── src/
│   ├── index.ts              # Daemon entry point
│   ├── index-ipc.ts          # IPC daemon entry point
│   ├── crash-recovery.ts     # Crash recovery and drain logic
│   ├── ipc/                  # IPC bus implementation
│   │   ├── ipc-bus-server.ts
│   │   ├── ipc-bus-client.ts
│   │   ├── ipc-bus-client-types.ts
│   │   ├── socket-path.ts
│   │   ├── lifecycle-manager.ts
│   │   ├── logger.ts
│   │   ├── metrics.ts
│   │   ├── plugin-loader.ts
│   │   ├── plugin-loader-async.ts
│   │   ├── plugin-monitor.ts
│   │   ├── plugin-registry.ts
│   │   └── handlers/
│   │       ├── render-handler.ts
│   │       ├── render-logging.ts
│   │       └── validation.ts
│   └── plugins/
│       └── plain-text-plugin.ts
└── tests/
    ├── contract/
    │   ├── test-lifecycle.test.ts
    │   ├── test-plugins.test.ts
    │   └── test-render.test.ts
    ├── integration/
    │   ├── agent-cleanup.test.ts
    │   ├── clean.test.ts
    │   ├── cross-platform.test.ts
    │   ├── custom-path.test.ts
    │   ├── daemon-crash.test.ts
    │   ├── daemon-shutdown.test.ts
    │   ├── directory-creation.test.ts
    │   ├── test-plugin-loading.test.ts
    │   ├── test-shutdown.test.ts
    │   ├── test-startup.ts
    │   └── test-uptime.ts
    └── performance/
        ├── test-concurrent-requests.ts
        └── test-response-time.ts

apps/desktop/src/
├── main/
│   └── ipc-bridge.ts
├── preload/
│   ├── index.ts
│   └── ipc-handlers.ts
└── renderer/
    └── components/
        └── RenderForm.tsx

packages/agent-core/
├── src/
│   ├── daemon/               # Existing daemon code (rpc-server, socket-path)
│   ├── ipc/                  # Shared IPC types
│   │   ├── types.ts
│   │   └── models/
│   │       ├── daemon-status.ts
│   │       ├── render-request.ts
│   │       └── rendering-plugin.ts
│   └── services/
│       └── auto-start-service.ts
└── tests/
```

**Structure Decision**: Selected Option 2 (Electron desktop application): separate `apps/desktop` for renderer/preload/main processes, `apps/daemon` for daemon process, and `packages/agent-core` for shared daemon code. This matches existing monorepo structure and separation of concerns.

## Triage Framework: [SYNC] vs [ASYNC] Classification

> Full triage classification, decision criteria, and audit trail are in [plan-triage.md](plan-triage.md).

**Execution Strategy**: Hybrid [SYNC] + [ASYNC] model. Core IPC infrastructure, plugin loader, lifecycle management, and preload bridge tasks are [SYNC] (human review required). Test scaffolding, type definitions, UI components, and example plugins are [ASYNC] (agent-delegatable).

## Complexity Tracking

> No constitution violations requiring justification. All principles pass the Constitution Check.
