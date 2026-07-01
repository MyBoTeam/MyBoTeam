# Implementation Plan: Daemon Lifecycle (MAO-148)

## Source Reference Analysis (MANDATORY)

### v0.2.0 Reference Implementation

**Source Location**: `/Users/mavishay/Projects/MaorInnovations/myboteam_V0.2.0/packages/daemon/src/`

**Files Analyzed**:
- `rpc-server.ts` (310 lines) - Main RPC server with daemon lifecycle
- `socket-transport.ts` (89 lines) - Client-side transport
- `socket-path.ts` (29 lines) - PathResolver class

**Key Patterns to Adopt**:
1. `DaemonRpcServer` class with `registerMethod()`, `notify()`
2. `DaemonTransport` interface with `send()`, `onMessage()`
3. NDJSON framing: Messages delimited by `\n`
4. Socket cleanup pattern: `socket.destroy()` for immediate close

**Patterns NOT to Adopt** (not needed for v0.5.0):
- Authentication - Local trust model
- Rate limiting - Not required
- Remote management - Out of scope

### v0.3.0 Reference Implementation

**Source Location**: `/Users/mavishay/Projects/MaorInnovations/myboteam_V0.3.0/packages/daemon/src/`

**Files Analyzed**:
- `daemon-manager.ts` (245 lines) - Daemon lifecycle management
- `ipc-server.ts` (189 lines) - IPC server implementation
- `task-queue.ts` (156 lines) - Task queue management

**Key Patterns to Adopt**:
1. `DaemonManager` class with `start()`, `stop()`, `restart()`
2. Graceful shutdown with timeout
3. Task queue with active/pending states
4. Resource cleanup on shutdown

**Patterns NOT to Adopt** (intentionally deviated):
- Child process model - We use independent process
- No auto-restart - We add exponential backoff
- No task draining - We drain active tasks

### Accomplish Reference Implementation

**Source Location**: `/Users/mavishay/Projects/Accomplish/accomplish/apps/desktop/src/main/daemon/`

**Files Analyzed**:
- `manager.ts` (312 lines) - DaemonManager class
- `ipc-client.ts` (245 lines) - IPC client implementation
- `watcher.ts` (178 lines) - Watcher for daemon monitoring

**Key Patterns to Adopt**:
1. DaemonManager with `start()`, `stop()`, `restart()`
2. IPC client with reconnection logic
3. Watcher for monitoring daemon health
4. Error handling patterns

**Patterns NOT to Adopt** (intentionally deviated):
- Child process model - We use independent process
- Immediate exit on SIGTERM - We use 30s timeout with task draining
- No auto-restart - We add exponential backoff
- No task draining - We drain active tasks
- No resource cleanup - We clean up all IPC resources

### myboteam_v0.5.0 Current Implementation

**Source Location**: `/Users/mavishay/Projects/MaorInnovations/myboteam_v0.5.0/packages/agent-core/src/daemon/`

**Files Analyzed**:
- `rpc-server.ts:145-160` - Current stop() method with immediate close pattern

**Key Patterns to Adopt**:
1. `socket.destroy()` pattern for immediate cleanup
2. Client tracking in `Map<string, Socket>`
3. Server cleanup with `this.server.close()`

**Patterns NOT to Adopt** (already implemented, enhance):
- Basic stop() - We add graceful shutdown with timeout

## Constitution Check

| Principle | Alignment | Notes |
|-----------|-----------|-------|
| I. Spec-Driven Development | ✅ Compliant | Plan follows spec with clear user stories and acceptance criteria |
| II. Test-First Quality | ✅ Compliant | Tests are included for each user story before implementation |
| III. Simplicity & Surgical Changes | ✅ Compliant | Minimum code approach, no speculative features |
| IV. Human Oversight | ✅ Compliant | SYNC tasks require human review, ASYNC tasks delegated |
| V. Observability, Security & Immutability | ✅ Compliant | OpenTelemetry for observability, filesystem permissions for security |
| VI. Code Structure & Cleanliness | ✅ Compliant | Files organized by functionality, single responsibility, <200 lines per file |
| VII. Source Reference (MANDATORY) | ✅ Compliant | Reference implementations analyzed from v0.2.0, v0.3.0, Accomplish |
| VIII. Git Hooks Are Non-Negotiable | ✅ Compliant | No --no-verify usage |
| IX. Linter/Formatter Configs Are Protected | ✅ Compliant | No config modifications |

### Architectural Decisions Requiring ADRs

⚠️ The following architectural decisions in this plan require new ADRs per architect.validate hook:

1. **Graceful shutdown with 30s timeout** - No existing ADR covers daemon shutdown lifecycle
2. **Auto-restart with exponential backoff** - No existing ADR covers daemon crash recovery
3. **Task draining on shutdown** - No existing ADR covers task queue management during shutdown
4. **Resource cleanup on shutdown** - No existing ADR covers IPC resource cleanup
5. **OpenTelemetry observability** - No existing ADR covers daemon observability

**Recommendation**: Run `/architect.clarify` to document these decisions before implementation.

## Implementation Approach

### Phase 1: Core Daemon Process

**Objective**: Implement independent daemon process with lifecycle management

**Components**:
1. `DaemonProcessManager` - Start/stop/kill daemon
2. `DaemonState` - State machine management
3. `PidManager` - PID file management for single instance

**Key Decisions**:
- Use `spawn()` with `detached: true` for independent process
- PID file at `/var/run/myboteam-daemon.pid` for single instance
- State machine: Starting → Running → Draining → Stopped

### Phase 2: Graceful Shutdown

**Objective**: Implement 30s timeout with task draining

**Components**:
1. `ShutdownManager` - Coordinate shutdown process
2. `TaskDrainer` - Drain active tasks, discard queued
3. `ResourceCleanupHandler` - Clean up IPC resources

**Key Decisions**:
- 30s timeout default, configurable
- SIGTERM triggers graceful shutdown
- Force kill on timeout (SIGKILL)
- Ignore subsequent SIGTERM if already draining

### Phase 3: Task Queue Management

**Objective**: Implement task queue with drain capability

**Components**:
1. `TaskQueue` - Manage pending/active tasks
2. `TaskExecutor` - Execute tasks with timeout
3. `TaskState` - Task lifecycle management

**Key Decisions**:
- Tasks in `Active` state are drained on shutdown
- Tasks in `Pending` state are discarded on shutdown
- Task timeout configurable per-task

### Phase 4: Auto-Restart

**Objective**: Implement exponential backoff restart on crash

**Components**:
1. `Watchdog` - Monitor daemon health
2. `RestartManager` - Manage restart with backoff
3. `ExitCodeHandler` - Handle specific exit codes

**Key Decisions**:
- Exponential backoff: 1s, 2s, 4s, 8s, max 30s
- Reset backoff after daemon runs for 60s
- Max restart attempts: 5 (then require manual intervention)
- Specific exit codes for different failure scenarios

### Phase 5: Observability

**Objective**: Implement structured logging, metrics, and tracing

**Components**:
1. `Logger` - Structured JSON logging
2. `MetricsCollector` - OpenTelemetry metrics
3. `Tracer` - OpenTelemetry traces

**Key Decisions**:
- OpenTelemetry for logs, metrics, traces
- Metrics: uptime, task count, error count, active connections
- Structured JSON format for logs
- Traces for task execution and shutdown lifecycle

## Task Breakdown

### Epic 1: Core Daemon Process (P1)

1. **Implement DaemonProcessManager**
   - Start daemon as independent process
   - Stop daemon gracefully
   - Kill daemon immediately
   - Check if daemon is running
   - Get daemon state

2. **Implement DaemonState**
   - State enum: Starting, Running, Draining, Stopped
   - State transition validation
   - State change events

3. **Implement PidManager**
   - Write PID file on start
   - Read PID file for single instance
   - Remove PID file on stop
   - Handle stale PID files

### Epic 2: Graceful Shutdown (P1)

4. **Implement ShutdownManager**
   - Initiate graceful shutdown
   - Force immediate shutdown
   - Track shutdown statistics
   - Handle shutdown timeout

5. **Implement TaskDrainer**
   - Drain active tasks on shutdown
   - Discard queued tasks on shutdown
   - Track tasks drained/aborted
   - Handle task timeout during drain

6. **Implement ResourceCleanupHandler**
   - Destroy all sockets immediately
   - Close all file handles
   - Remove temp files
   - Clean up all IPC resources

### Epic 3: Task Queue Management (P2)

7. **Implement TaskQueue**
   - Add tasks to queue
   - Get next task to execute
   - Mark task as completed/failed
   - Get active task count
   - Discard pending tasks

8. **Implement TaskExecutor**
   - Execute tasks with timeout
   - Handle task success/failure
   - Track task execution time
   - Handle task timeout

### Epic 4: Auto-Restart (P2)

9. **Implement Watchdog**
   - Monitor daemon health
   - Detect daemon crashes
   - Trigger restart on crash

10. **Implement RestartManager**
    - Exponential backoff restart
    - Reset backoff after stability
    - Max restart attempts
    - Manual intervention requirement

### Epic 5: Observability (P3)

11. **Implement Logger**
    - Structured JSON logging
    - Log levels: DEBUG, INFO, WARN, ERROR
    - Contextual logging
    - State transition logging

12. **Implement MetricsCollector**
    - Daemon uptime metric
    - Task count metrics (active, completed, failed)
    - Error count metric
    - Active connections metric
    - OpenTelemetry integration

13. **Implement Tracer**
    - Task execution spans
    - Shutdown lifecycle spans
    - Error attribution
    - OpenTelemetry integration

## Dependencies

### External Dependencies
- OpenTelemetry SDK (logging, metrics, tracing)
- Node.js `child_process` (spawn, kill)
- Node.js `fs` (PID file management)
- Node.js `net` (Unix domain sockets)

### Internal Dependencies
- Existing daemon RPC server (`packages/agent-core/src/daemon/rpc-server.ts`)
- Existing IPC mechanism
- Existing task management patterns

## Risk Assessment

### High Risk
- **Process detachment**: Ensuring daemon survives parent exit
- **Resource cleanup**: Preventing orphaned sockets/files
- **Auto-restart**: Avoiding restart loops

### Medium Risk
- **Task draining**: Ensuring tasks complete within timeout
- **State management**: Handling invalid state transitions
- **Observability**: Performance impact of telemetry

### Low Risk
- **PID file management**: Standard pattern
- **Logging**: Well-established patterns
- **Configuration**: Reference Accomplish patterns

## Success Criteria

1. Daemon starts as independent process within 2 seconds
2. Graceful shutdown completes within 30 seconds
3. Daemon survives application window close
4. All resources cleaned up on shutdown
5. Integration tests pass for all scenarios
6. Observability data emitted via OpenTelemetry
7. Auto-restart with exponential backoff works correctly
8. Specific exit codes for debugging
