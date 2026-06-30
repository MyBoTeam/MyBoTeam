# Feature Specification: Crash Recovery — PID Detection, Stale Tasks

**Feature Branch**: `007-crash-recovery-stale-tasks`

**Created**: 2026-06-29

**Status**: Draft

**Input**: User description: "I want to address https://linear.app/maor-innovations-ltd/issue/MAO-149/m3-3-crash-recovery-pid-detection-stale-tasks"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Daemon Recovers from Crash (Priority: P1)

As a daemon operator, I need the system to automatically detect and recover from crashes by marking stale running tasks as failed so that the daemon can restart cleanly without manual intervention.

**Why this priority**: Without crash recovery, the daemon cannot restart after a crash because stale locks and running tasks block startup. This is foundational for daemon reliability.

**Independent Test**: Can be fully tested by force-stopping the daemon, restarting it, and verifying that stale tasks are marked as failed.

**Acceptance Scenarios**:

1. **Given** the daemon is running with active tasks, **When** the daemon process is terminated unexpectedly, **Then** the lock file remains on disk
2. **Given** a stale lock file exists from a crashed daemon, **When** the daemon starts, **Then** it detects the stale lock, removes it, and acquires a new lock
3. **Given** the daemon restarts after a crash, **When** checking the task database, **Then** all tasks with status `running` are marked as `failed`
4. **Given** the daemon restarts after a crash, **When** checking the daemon logs, **Then** a warning is logged for each stale task that was marked as failed

---

### User Story 2 - Graceful Shutdown with Task Drain (Priority: P1)

As a daemon operator, I need the daemon to gracefully shut down by draining active tasks before exiting so that in-progress work is not lost unexpectedly.

**Why this priority**: Graceful shutdown prevents data loss and ensures tasks complete or fail cleanly. Combined with crash recovery, this provides full lifecycle management.

**Independent Test**: Can be tested by invoking the shutdown RPC method and verifying it waits for active tasks to complete (up to timeout) before exiting.

**Acceptance Scenarios**:

1. **Given** the daemon has active tasks, **When** a shutdown request is received via RPC, **Then** the scheduler stops accepting new tasks
2. **Given** the daemon is shutting down, **When** new task requests arrive, **Then** they are rejected immediately
3. **Given** the daemon is shutting down with active tasks, **When** tasks are still running, **Then** the daemon waits up to 30 seconds for them to complete
4. **Given** the daemon is shutting down with active tasks, **When** the drain timeout is reached, **Then** the daemon force-stops remaining tasks and exits
5. **Given** the daemon is shutting down gracefully, **When** all tasks complete, **Then** the lock file is released and the process exits cleanly

---

### User Story 3 - Agent Process Cleanup on Shutdown (Priority: P2)

As a daemon operator, I need the system to track and terminate agent child processes on shutdown so that orphaned processes do not consume resources.

**Why this priority**: Agent processes spawned by the daemon must be cleaned up to prevent resource leaks. This is secondary to the core crash recovery functionality.

**Independent Test**: Can be tested by starting the daemon with agent processes, sending SIGTERM, and verifying the agent processes receive SIGTERM.

**Acceptance Scenarios**:

1. **Given** the daemon has running agent child processes, **When** the daemon shuts down, **Then** each agent process receives SIGTERM
2. **Given** agent processes are tracked in the agent.pids file, **When** the daemon shuts down, **Then** it reads the file and terminates each listed PID
3. **Given** an agent PID in the file refers to a dead process, **When** the daemon shuts down, **Then** the dead process is skipped without error

---

### Edge Cases

- What happens when the lock file exists but is corrupted or empty? The system MUST treat it as a stale lock and remove it.
- What happens when two daemons start simultaneously and both detect a stale lock? The system MUST use atomic file operations to ensure only one succeeds.
- What happens when the system clock changes between lock creation and staleness check? The system MUST rely on process liveness checks rather than file timestamps.
- What happens when the drain timeout is reached but tasks are still running? The system MUST force-stop remaining tasks and exit.
- What happens when the daemon receives multiple shutdown requests? The system MUST ignore subsequent requests during shutdown (idempotent shutdown).
- What happens when the agent PIDs file is missing or empty? The system MUST proceed with shutdown without error.
- What happens when the `MYBOTEAM_DRAIN_TIMEOUT_MS` environment variable is not set? The system MUST use the default 30-second timeout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST detect daemon crashes by checking for stale lock files on startup
- **FR-002**: System MUST automatically remove stale locks from crashed processes and acquire a new lock
- **FR-003**: System MUST mark all tasks with status `running` as `failed` on daemon restart after a crash
- **FR-004**: System MUST log a warning for each stale task that is marked as failed during crash recovery
- **FR-005**: System MUST support graceful shutdown via RPC method (cross-platform, works on Windows and Unix)
- **FR-006**: System MUST stop the scheduler immediately on shutdown to prevent new tasks from being launched
- **FR-007**: System MUST reject new task requests immediately when shutdown is initiated
- **FR-008**: System MUST drain active tasks with a configurable timeout (default 30 seconds, configurable via `MYBOTEAM_DRAIN_TIMEOUT_MS` environment variable) before force-stopping
- **FR-009**: System MUST force-stop remaining tasks and exit if the drain timeout is reached
- **FR-010**: System MUST release the lock file on graceful shutdown
- **FR-011**: System MUST track agent child process identifiers and terminate them on shutdown
- **FR-012**: System MUST handle multiple shutdown requests idempotently (ignore subsequent requests during shutdown)

### Key Entities

- **Lock File**: File containing process identifier, creation timestamp, and start time. Used for crash detection and single-instance enforcement.
- **Task**: Database entity with status field (`pending`, `running`, `completed`, `failed`, `cancelled`). Stale tasks have `running` status after a daemon crash.
- **Agent PIDs File**: File containing list of agent child process identifiers for cleanup on shutdown.
- **Drain Timeout**: Configurable duration (default 30 seconds, configurable via `MYBOTEAM_DRAIN_TIMEOUT_MS` environment variable) to wait for active tasks to complete during graceful shutdown.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Daemon detects and recovers from crashes within 100ms of startup
- **SC-002**: 100% of stale `running` tasks are marked as `failed` on daemon restart after crash
- **SC-003**: Graceful shutdown completes within 30 seconds (drain timeout) for all task states
- **SC-004**: Agent processes are terminated within 5 seconds of shutdown request
- **SC-005**: Lock operations do not interfere with database operations or other file operations
- **SC-006**: Crash recovery and graceful shutdown are covered by unit and integration tests
- **SC-007**: New task requests are rejected within 100ms of shutdown initiation

## Assumptions

- Single-user desktop application — no multi-user lock conflicts expected
- The PID lock manager (004-pid-lock-manager) is already implemented and provides lock acquisition and stale detection
- The task CRUD module (packages/agent-core/src/storage/crud/task.ts) provides task listing and update functions
- Agent processes are spawned as child processes of the daemon (same user context)
- The data directory is initialized before the daemon starts

## Clarifications

### Session 2026-06-29

- Q: Should the daemon attempt to auto-restart after a crash? → A: No, crash detection + stale task cleanup only (no auto-restart). Auto-restart is a separate concern in M3-4.
- Q: Which terminology should be used for forcibly stopping tasks? → A: Use "force-stop" consistently throughout the spec.
- Q: How should the drain timeout be configured? → A: Environment variable (e.g., `MYBOTEAM_DRAIN_TIMEOUT_MS`).
- Q: How should graceful shutdown work on Windows? → A: RPC shutdown method only (works cross-platform). Signal handling is a Unix-specific optimization.
- Q: What should happen to new task requests during drain? → A: Reject new tasks immediately when shutdown starts.
