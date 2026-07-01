# Feature Specification: Daemon Lifecycle Management

**Feature Branch**: `007-daemon-lifecycle`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "I want to address https://linear.app/maor-innovations-ltd/issue/MAO-148/m3-2-daemon-lifecycle-startstopgraceful-shutdown make sure to check the source like said in @AGENTS.md"

## Clarifications

### Session 2026-06-28

- Q: Should the daemon emit structured logs and metrics for operational monitoring? → A: Full observability (logs + metrics + tracing) with OpenTelemetry
- Q: Should we explicitly define daemon state transitions (e.g., Starting → Running → Draining → Stopped)? → A: Simple state enum: Starting, Running, Draining, Stopped
- Q: Should the daemon restrict access to its IPC interface (e.g., filesystem permissions, authentication)? → A: Filesystem permissions only (standard for local daemons)
- Q: What is explicitly OUT OF SCOPE for this feature? → A: Local daemon lifecycle only (start/stop/graceful shutdown)
- Q: What are the reliability/availability expectations for the daemon? → A: Auto-restart on crash with exponential backoff. **Note: This intentionally deviates from Accomplish (no auto-restart) for enhanced high availability.**
- Q: Which IPC mechanism should the daemon use? → A: Unix domain sockets (already implemented in previous spec)
- Q: What should happen when the graceful shutdown timeout (30s) is reached? → A: Force kill the daemon process immediately (Option B). **Note: This intentionally deviates from Accomplish's immediate exit for enhanced data integrity.**
- Q: Should we define a limit on concurrent IPC connections to the daemon? → A: No limit (OS-level limits apply)
- Q: There's a potential contradiction: FR-001 says daemon is child process, but FR-004 says it should survive window close. How to resolve? → A: Daemon is independent process (spawned but not parented). **Note: This intentionally deviates from Accomplish's child process model for enhanced reliability.**
- Q: What should happen if the daemon fails to start (e.g., port already in use, socket path conflict)? → A: Return error to caller (host application handles)
- Q: What should happen when the daemon is shut down while a task is in a critical state (e.g., writing to database)? → A: Abort task and log warning
- Q: What should happen to queued tasks (not yet started) during graceful shutdown? → A: Discard queued tasks (only drain active tasks). **Note: This intentionally deviates from Accomplish (no task draining) for enhanced data integrity.**
- Q: Should we define specific non-zero exit codes for different failure scenarios (e.g., timeout exceeded, task aborted)? → A: Yes, define specific exit codes for debugging
- Q: What scenarios should be covered by integration tests for start/stop lifecycle? → A: All scenarios: normal start/stop, graceful shutdown, forced shutdown, crash recovery
- Q: What specific metrics should the daemon emit for operational monitoring? → A: Basic metrics: uptime, task count, error count, active connections
- Q: What specific resources should be cleaned up on shutdown (FR-005)? → A: All IPC-related resources: sockets, connections, file handles, temp files. **Note: This intentionally deviates from Accomplish (no resource cleanup) for enhanced stability.**
- Q: How should we ensure the daemon survives parent application exit (FR-004)? → A: Reference Accomplish implementation for process detachment pattern
- Q: How should we implement "immediately destroy all sockets" (FR-006)? → A: Use socket.destroy() pattern (immediate TCP reset)
- Q: What triggers each state transition in the daemon lifecycle? → A: Define triggers: Starting→Running (init complete), Running→Draining (SIGTERM), Draining→Stopped (tasks complete or timeout). Reference Accomplish implementation.
- Q: What error messages should be logged during daemon lifecycle events? → A: Log descriptive error messages with context (e.g., "Failed to start daemon: socket path already in use")
- Q: Are there any performance requirements for the daemon (e.g., max latency for IPC calls, max concurrent tasks)? → A: Reference Accomplish performance requirements
- Q: What documentation should be provided for the daemon lifecycle feature? → A: Reference Accomplish documentation
- Q: Should we define specific test cases for integration tests, or just test scenarios? → A: Define specific test cases for each scenario
- Q: Should we specify versioning requirements for the daemon (e.g., API versioning, backward compatibility)? → A: Reference Accomplish versioning patterns
- Q: Should we specify deployment requirements for the daemon (e.g., how to install, update, remove)? → A: Reference Accomplish deployment patterns or keep technology-agnostic
- Q: Should we specify monitoring requirements beyond observability (e.g., health checks, alerting)? → A: Reference Accomplish monitoring patterns or keep technology-agnostic
- Q: Should we specify security requirements beyond filesystem permissions (e.g., input validation, rate limiting)? → A: Reference Accomplish security patterns
- Q: Should we specify logging levels or formats for the daemon? → A: Reference Accomplish logging patterns, fallback to defining logging levels (DEBUG, INFO, WARN, ERROR)
- Q: Should we specify configuration requirements for the daemon (e.g., config files, environment variables)? → A: Reference Accomplish configuration patterns
- All remaining clarifications (error handling, testing frameworks, documentation formats, etc.) should reference Accomplish implementation patterns.
- Q: How should the system handle forced shutdown (SIGKILL) vs graceful shutdown (SIGTERM)? → A: SIGKILL ignored (can't be caught), SIGTERM triggers graceful shutdown
- Q: How should the system handle multiple shutdown signals sent in quick succession? → A: Ignore subsequent signals (shutdown already in progress)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Daemon Start and Stop (Priority: P1)

As a system administrator, I want to start and stop the daemon process as an independent process of the host application, so that the daemon lifecycle is managed reliably.

**Why this priority**: This is the core functionality without which the daemon cannot operate. Starting and stopping the daemon are fundamental operations that must work correctly.

**Independent Test**: Can be fully tested by launching the host application and verifying the daemon process starts independently, then closing the app and verifying the daemon process terminates cleanly.

**Acceptance Scenarios**:

1. **Given** the host application is running, **When** the app initializes, **Then** the daemon starts as an independent process.
2. **Given** the daemon is running, **When** the app sends a stop signal, **Then** the daemon terminates within 5 seconds (force kill if graceful shutdown timeout exceeded).
3. **Given** the daemon is running, **When** the application window is closed, **Then** the daemon continues running (survives window close).

---

### User Story 2 - Graceful Shutdown with Task Drain (Priority: P2)

As a user, I want the daemon to gracefully shut down by draining active tasks before terminating, so that no data is lost and tasks complete successfully.

**Why this priority**: This ensures data integrity and prevents task loss during shutdown. It's critical for reliability but depends on the basic start/stop functionality.

**Independent Test**: Can be tested by starting a long-running task (e.g., processing a batch), then initiating shutdown, and verifying the task completes within the timeout period.

**Acceptance Scenarios**:

1. **Given** the daemon has active tasks, **When** a shutdown signal is received, **Then** the daemon stops accepting new tasks and drains existing tasks within 30 seconds.
2. **Given** the daemon is draining tasks, **When** the 30-second timeout is reached, **Then** any remaining tasks are abandoned and the daemon terminates.
3. **Given** the daemon is idle, **When** a shutdown signal is received, **Then** the daemon terminates immediately.

---

### User Story 3 - Clean Resource Cleanup (Priority: P3)

As a developer, I want the daemon to clean up all resources (sockets, connections, file handles) on shutdown, so that no orphaned resources remain.

**Why this priority**: This prevents resource leaks and ensures system stability. It's important but secondary to the core lifecycle operations.

**Independent Test**: Can be tested by monitoring system resources before and after daemon shutdown, verifying all sockets and connections are closed.

**Acceptance Scenarios**:

1. **Given** the daemon is running, **When** shutdown completes, **Then** all sockets are immediately destroyed without waiting for pending writes.
2. **Given** the daemon is running, **When** shutdown completes, **Then** all file handles and connections are closed.
3. **Given** the daemon is running, **When** shutdown completes, **Then** the process exits with code 0.

---

### Edge Cases

- What happens when the daemon is shut down while a task is in a critical state (e.g., writing to database)?
- How does the system handle a forced shutdown (SIGKILL) vs graceful shutdown (SIGTERM)?
- What happens if the daemon fails to start (e.g., port already in use)?
- How does the system handle multiple shutdown signals sent in quick succession?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST start the daemon as an independent process of the host application.
- **FR-002**: System MUST allow graceful shutdown via SIGTERM signal with 30-second timeout.
- **FR-003**: System MUST drain active tasks before termination during graceful shutdown (queued tasks are discarded).
- **FR-004**: System MUST survive application window close (daemon continues running).
- **FR-005**: System MUST clean up all IPC-related resources on shutdown, including: (a) immediately destroy all sockets using socket.destroy() pattern without waiting for pending writes, (b) close all file handles and connections, (c) remove temp files.
- **FR-006**: System MUST provide unit tests for all lifecycle components (daemon state, task state, PID manager, shutdown manager, task drainer, resource cleanup handler, restart manager, watchdog, logger, metrics collector, tracer).
- **FR-007**: System MUST exit with code 0 on successful shutdown.
- **FR-008**: System MUST provide integration tests for start/stop lifecycle covering: normal start/stop, graceful shutdown, forced shutdown, crash recovery. Specific test cases must be defined for each scenario.
- **FR-009**: System MUST emit structured logs, metrics (uptime, task count, error count, active connections), and traces using OpenTelemetry for operational monitoring.
- **FR-010**: System MUST auto-restart the daemon on crash with exponential backoff.
- **FR-011**: System MUST force kill the daemon process immediately when graceful shutdown timeout (30s) is reached.
- **FR-012**: System MUST return error to caller if daemon fails to start (host application handles failure).
- **FR-013**: System MUST abort tasks in critical state during shutdown and log warning.
- **FR-014**: System MUST ignore subsequent shutdown signals if shutdown is already in progress.
- **FR-015**: System MUST define specific non-zero exit codes for different failure scenarios (e.g., timeout exceeded, task aborted).
- **FR-016**: System MUST start the daemon process within 2 seconds of host application initialization.
- **FR-017**: System MUST store PID file at configurable path (default: `/var/run/myboteam-daemon.pid`) for single instance enforcement.

### Key Entities

- **DaemonProcess**: The background process that runs independently of the host application UI, managing tasks and services.
- **TaskQueue**: Queue of active tasks being processed by the daemon, with concurrency limits.
- **ShutdownManager**: Component responsible for coordinating graceful shutdown, draining tasks, and cleaning up resources.
- **DaemonState**: Simple state enum: Starting, Running, Draining, Stopped. Transitions: Starting→Running (on init complete), Running→Draining (on SIGTERM), Draining→Stopped (when tasks complete or timeout). Reference Accomplish implementation for state management patterns.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Daemon starts as independent process within 2 seconds of host application initialization.
- **SC-002**: Graceful shutdown completes within 30 seconds for idle daemon.
- **SC-003**: Graceful shutdown completes within 30 seconds for daemon with active tasks (tasks complete within timeout).
- **SC-004**: Daemon survives application window close and continues running.
- **SC-005**: All resources are cleaned up on shutdown (no orphaned sockets or connections).
- **SC-006**: Integration tests pass for start/stop lifecycle scenarios.
- **SC-007**: System handles forced shutdown (SIGKILL) without leaving resources in inconsistent state.
- **SC-008**: Daemon emits structured logs, metrics, and traces via OpenTelemetry for operational monitoring.

## Assumptions

- The daemon process will be implemented using the existing project technology stack.
- The daemon will communicate with the host application via the existing IPC mechanism.
- The 30-second timeout for graceful shutdown is sufficient for typical tasks.
- The daemon will be responsible for managing its own task queue and concurrency limits.
- Source code from previous versions (v0.2.0, v0.3.0) will be referenced for implementation patterns.
- The daemon will implement OpenTelemetry for observability (logs, metrics, traces).
- The daemon will rely on filesystem permissions for IPC interface security (local trust model).
- Test framework: Vitest (project standard). Unit tests in `tests/unit/`, integration tests in `tests/integration/`.
- The daemon will handle concurrent IPC connections without explicit limits (OS-level limits apply).
- SIGKILL cannot be caught (OS limitation), SIGTERM triggers graceful shutdown.
- Process detachment pattern will reference Accomplish implementation (apps/desktop/src/main/daemon/).
- Error messages will be descriptive with context for debugging (e.g., "Failed to start daemon: socket path already in use").
- Performance requirements: Daemon startup ≤ 2s, IPC call latency ≤ 100ms, graceful shutdown ≤ 30s, task execution overhead ≤ 5ms per task.
- Documentation will reference Accomplish v2.3.0 documentation for daemon lifecycle patterns.
- Versioning will reference Accomplish v2.3.0 versioning patterns (no explicit versioning requirements defined in spec).
- Deployment will reference Accomplish v2.3.0 deployment patterns or remain technology-agnostic.
- Monitoring will reference Accomplish v2.3.0 monitoring patterns or remain technology-agnostic.
- Security will reference Accomplish v2.3.0 security patterns beyond filesystem permissions.
- Logging will use structured JSON format with fields: timestamp, level, message, context, correlationId. Fallback to text format for development.
- Configuration will reference Accomplish v2.3.0 configuration patterns.

### Intentional Deviations from Accomplish

**Decision: Enhanced Spec (Option B)** - Our spec intentionally diverges from Accomplish for a more robust daemon lifecycle:

| Feature | Accomplish | Our Spec | Rationale |
|---------|------------|----------|-----------|
| **Process Relationship** | Child process (exits on disconnect) | Independent process (survives parent exit) | Better reliability - daemon continues if app crashes |
| **Graceful Shutdown** | Immediate exit on SIGTERM | 30s timeout with task draining | Data integrity - allows tasks to complete |
| **Auto-restart** | Not implemented | Exponential backoff restart | High availability - recovers from crashes |
| **Task Draining** | Not implemented | Drain active tasks, discard queued | Prevents data loss during shutdown |
| **Resource Cleanup** | Not implemented | Clean up all IPC resources | Prevents resource leaks |

**Note:** While we reference Accomplish for patterns (logging, config, security), these core lifecycle features are intentionally enhanced for production robustness.

## Out of Scope

- Remote daemon management capabilities
- Daemon health monitoring dashboard
- Daemon configuration management
- Multi-tenant or distributed daemon architectures

## Exit Codes

The daemon MUST use the following exit codes for debugging:

| Exit Code | Meaning | Scenario |
|-----------|---------|----------|
| 0 | Success | Normal shutdown completed |
| 1 | General error | Unspecified error |
| 2 | Timeout exceeded | Graceful shutdown timeout (30s) reached |
| 3 | Task aborted | Task in critical state aborted during shutdown |
| 4 | Startup failed | Daemon failed to start (e.g., socket path conflict) |
| 5 | Crash | Daemon crashed unexpectedly |