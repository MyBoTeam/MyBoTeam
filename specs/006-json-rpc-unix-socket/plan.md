# Implementation Plan: JSON-RPC Unix Socket Server

**Branch**: `006-json-rpc-unix-socket` | **Date**: 2026-06-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-json-rpc-unix-socket/spec.md`

## Summary

Implement a JSON-RPC 2.0 server over Unix domain socket (with Windows named pipe support) for inter-process communication in the MyBot Team daemon. The server will handle concurrent client connections from both daemon processes and CLI tools, with request/response correlation IDs, method routing to handler functions, and structured error responses. The implementation follows patterns from the Accomplish reference project (socket-transport.ts, rpc-server.ts) for consistency.

## Source Reference Analysis (MANDATORY)

### v0.2.0 Reference Implementation

**Source Location**: `/Users/mavishay/Projects/MaorInnovations/myboteam_V0.2.0/packages/daemon/src/`

**Files Analyzed**:
- `rpc-server.ts` (310 lines) - Main RPC server with authentication, rate limiting, method aliases
- `socket-transport.ts` (89 lines) - Client-side transport with DaemonTransport interface
- `socket-path.ts` (29 lines) - PathResolver class with Windows named pipe support
- `json-rpc-client.ts` (103 lines) - JSON-RPC client implementation
- `rpc-auth.ts` (24 lines) - Authentication handshake
- `rate-limiter.ts` (20 lines) - Token bucket rate limiting

**Key Patterns to Adopt**:
1. `DaemonRpcServer` class with `registerMethod()`, `notify()`, `hasConnectedClients()`, `start()`, `stop()`
2. `DaemonTransport` interface with `send()`, `onMessage()`, `onDisconnect()`, `close()`
3. `PathResolver` class with `getSocketPath()` supporting Windows named pipes
4. JSON-RPC 2.0 error codes: -32700, -32600, -32601, -32602, -32603
5. NDJSON framing: Messages delimited by `\n`
6. 1MB buffer limit with connection destruction on overflow

**Patterns NOT to Adopt** (not needed for v0.5.0):
- Authentication (rpc-auth.ts) - Local trust model
- Rate limiting (rate-limiter.ts) - Not required
- Method aliases - Not needed for new implementation

### Accomplish Reference Implementation

**Source Location**: `/Users/mavishay/Projects/Accomplish/accomplish/packages/agent-core/src/daemon/`

**Files Analyzed**:
- `rpc-server.ts` (165 lines) - Cleaner server with lifecycle callbacks
- `rpc-message-handler.ts` (86 lines) - Separate message handling
- `socket-path.ts` - Socket path resolution
- `common/types/daemon.ts` (790 lines) - TypeScript type definitions

**Key Patterns to Adopt**:
1. `DaemonRpcServerOptions` interface with `socketPath`, `onConnection`, `onDisconnection`
2. Lifecycle callbacks for connection/disconnection events
3. Separate message handler (`handleRpcLine()`) for cleaner separation of concerns
4. TypeScript types exported in `common/types/daemon.ts`
5. Built-in `daemon.ping` method with status, uptime, buildId
6. No authentication or rate limiting (local trust model)

### v0.5.0 Current State

**Existing Files**:
- `packages/agent-core/src/daemon/socket-path.ts` (7 lines) - Only has `getPidFilePath()`
- `packages/agent-core/src/daemon/pid-lock.ts` - PID lock management
- `packages/agent-core/src/daemon/index.ts` - Export barrel

**Missing Files** (need to be created):
- `packages/agent-core/src/daemon/rpc-server.ts`
- `packages/agent-core/src/daemon/socket-transport.ts`
- `packages/agent-core/src/daemon/rpc-message-handler.ts`
- `packages/types/src/daemon.ts` (extended with JSON-RPC types)

## Technical Context

**Language/Version**: TypeScript 5.7+ (ESM modules)  
**Primary Dependencies**: node:net, node:crypto, pino (structured logger)  
**Storage**: N/A (IPC transport only)  
**Testing**: Vitest (unit, integration, contract tests)  
**Target Platform**: Node.js 18+ (POSIX-compliant systems + Windows named pipes)  
**Project Type**: daemon/lib (JSON-RPC server component)  
**Performance Goals**: Handle 100+ concurrent connections, <100ms response time for simple requests  
**Constraints**: 1 MB maximum message size, NDJSON framing, local trust model (no auth)  
**Scale/Scope**: Daemon IPC for MyBot Team agent system

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ PASS | Spec exists with user stories, requirements, success criteria |
| II. Test-First Quality | ✅ PASS | Unit, integration, contract tests specified |
| III. Simplicity & Surgical Changes | ✅ PASS | Following Accomplish patterns, minimal implementation |
| IV. Human Oversight & Goal-Driven Execution | ✅ PASS | Clear success criteria, SYNC/ASYNC classification planned |
| V. Observability, Security & Immutability | ✅ PASS | Structured logging, input validation, no auth required |
| VI. Code Structure & Cleanliness | ✅ PASS | Single responsibility, files under 200 lines |
| VII. Source Reference (MANDATORY) | ✅ PASS | Reference: v0.2.0 and Accomplish implementations analyzed |

## Project Structure

### Documentation (this feature)

```text
specs/006-json-rpc-unix-socket/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/spec.tasks command)
```

### Source Code (repository root)

```text
packages/agent-core/src/daemon/
├── rpc-server.ts        # Main RPC server implementation
├── socket-transport.ts  # Socket transport abstraction
├── socket-path.ts       # Socket path resolution (EXISTING - needs enhancement)
├── rpc-message-handler.ts # JSON-RPC message parsing and dispatch
├── pid-lock.ts          # PID lock management (EXISTING)
└── index.ts             # Export barrel (EXISTING - needs updates)

packages/types/src/
└── daemon.ts            # TypeScript types for RPC API (NEW)

tests/
├── contract/            # Contract tests for RPC methods
├── integration/         # Integration tests for server
└── unit/                # Unit tests for components
```

**Structure Decision**: Follow existing agent-core package structure. Implementation in packages/agent-core/src/daemon/ directory. Types exported in packages/types/src/daemon.ts.

## Triage Framework: [SYNC] vs [ASYNC] Classification

**Execution Strategy**: Hybrid execution model combining human expertise ([SYNC]) with autonomous agent delegation ([ASYNC]).

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Business Logic | 2 | 3 | Core server logic needs review; handler registration is straightforward |
| Data Operations | 0 | 2 | Message parsing/validation is mechanical |
| UI Components | 0 | 0 | No UI components |
| Integrations | 1 | 2 | Transport abstraction needs review; testing is delegatable |
| Infrastructure | 1 | 1 | Socket cleanup needs review; path resolution is straightforward |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**
- Core RPC server implementation (security-critical, error handling)
- Transport abstraction layer (cross-platform compatibility)

**Agent-Delegated [ASYNC] Classifications:**
- Message parsing and validation logic
- Handler registration API
- Unit test creation
- Contract test creation

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Implement DaemonRpcServer class | SYNC | Security/Complexity | High | Core server logic with error handling |
| Implement SocketTransport | SYNC | Cross-platform | High | Unix/Windows compatibility |
| Add daemon.ping method | ASYNC | Simplicity | Low | Simple health check implementation |
| Create message parser | ASYNC | Mechanical | Low | JSON parsing with validation |
| Write unit tests | ASYNC | Mechanical | Low | Test creation is delegatable |

## Complexity Tracking

> No constitution violations detected. All principles satisfied.
