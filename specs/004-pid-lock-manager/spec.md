# Feature Specification: PID Lock Manager

**Feature Branch**: `004-pid-lock-manager`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "I want to address https://linear.app/maor-innovations-ltd/issue/MAO-145/m2-4-pid-lock-manager"

**Demo Sentence**: After this feature, the daemon prevents multiple instances from running simultaneously by acquiring an exclusive PID lock on startup, detecting and cleaning stale locks from crashed processes, and releasing the lock on graceful shutdown.

## Mission Brief

**Goal**: Implement a PID lock manager that prevents multiple daemon instances from running simultaneously by writing and validating a PID file with atomic operations and stale lock detection.

**Success Criteria**:
- Daemon acquires an exclusive PID lock on startup and fails fast if another instance is running
- Stale locks from crashed processes are automatically detected and cleaned
- Lock is released on graceful shutdown (SIGINT/SIGTERM)
- Agent child process PIDs are tracked for cleanup on shutdown
- Lock operations use atomic file operations to prevent race conditions

**Constraints**:
- Milestone M2 — Data Layer
- Effort: S (Small)
- Blocked by: M2-5 (Data Directory Manager) for lock file path resolution
- Blocks: M3-1 (Daemon Startup/Shutdown)
- Source reference: v0.2.0 (`packages/daemon/src/pid-lock.ts`) — class-based with plain-text PID
- Source reference: v0.3.0 (`packages/agent-core/src/daemon/pid-lock.ts`) — functional API with JSON payload and atomic linkSync

## Out of Scope

- Socket/RPC server port conflict detection — separate feature
- Database locking (WAL mode) — handled by SQLite storage layer
- Encrypted PID files — not required for local desktop app
- Remote process detection (checking PID across machines) — single-user local app
- Agent process lifecycle management (spawn/kill) — separate feature

## Boundary Map

### Produces

| Artifact | Type | Exports |
|----------|------|---------|
| acquirePidLock() | Function | Returns PidLockHandle with release() method |
| PidLockHandle | Type | release() for graceful shutdown, isAcquired for status |
| PidLockPayload | Type | JSON structure stored in lock file (pid, createdAt, startTime) |
| PidLockError | Error class | Typed error with optional existingPid for conflict detection |
| saveAgentPids() | Function | Persists agent child PIDs for cleanup |
| cleanupAgentProcesses() | Function | Sends SIGTERM to tracked agent PIDs |

### Consumes

| From Feature | Artifact | Imports |
|--------------|----------|---------|
| M2-5 Data Directory Manager | Lock file path | getPidFilePath(dataDir) for lock file location (provided by socket-path.ts) |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acquire PID Lock on Startup (Priority: P1)

As a daemon operator, I need the daemon to acquire an exclusive PID lock on startup so that only one instance runs at a time and data corruption from concurrent access is prevented.

**Why this priority**: Without a PID lock, multiple daemon instances could run simultaneously, causing database corruption, port conflicts, and inconsistent state. This is the foundation for safe daemon lifecycle management.

**Independent Test**: Can be fully tested by starting the daemon twice and verifying the second instance fails with a clear error message.

**Acceptance Scenarios**:

1. **Given** no existing PID file, **When** the daemon starts, **Then** a PID file is created containing the current process ID, creation timestamp, and start time
2. **Given** an existing PID file with a live process, **When** the daemon starts, **Then** it fails fast with a PidLockError indicating the existing PID
3. **Given** an existing PID file with a dead process (stale lock), **When** the daemon starts, **Then** the stale lock is removed and a new lock is acquired
4. **Given** the PID lock is acquired, **When** checking the lock file, **Then** the contents are valid JSON with pid, createdAt, and startTime fields

---

### User Story 2 - Release PID Lock on Shutdown (Priority: P1)

As a daemon operator, I need the daemon to release its PID lock on graceful shutdown so that subsequent daemon starts can acquire the lock without stale lock cleanup.

**Why this priority**: Proper lock release ensures clean restarts without unnecessary stale lock detection. Combined with P1 acquisition, this completes the basic lifecycle.

**Independent Test**: Can be tested by starting the daemon, sending SIGTERM, and verifying the PID file is removed.

**Acceptance Scenarios**:

1. **Given** the daemon has acquired the PID lock, **When** a SIGINT or SIGTERM signal is received, **Then** the PID file is deleted before the process exits
2. **Given** the daemon has acquired the PID lock, **When** the process crashes unexpectedly, **Then** the PID file remains and is detected as stale on next startup
3. **Given** the PID lock is released, **When** checking the lock file path, **Then** no file exists

---

### User Story 3 - Stale Lock Detection and Cleanup (Priority: P1)

As a daemon operator, I need the system to automatically detect and clean stale locks from crashed processes so that the daemon can recover without manual intervention.

**Why this priority**: Stale locks from crashes are common. Automatic recovery ensures the daemon is self-healing and operators don't need to manually delete PID files.

**Independent Test**: Can be tested by creating a PID file with a non-existent PID, then starting the daemon and verifying it acquires the lock.

**Acceptance Scenarios**:

1. **Given** a PID file containing a PID that no longer exists, **When** the daemon starts, **Then** the stale lock is detected and removed
2. **Given** a PID file containing a PID belonging to a different user, **When** the daemon starts, **Then** the lock is considered valid (not stale) and acquisition fails
3. **Given** a PID file that is empty or contains invalid data, **When** the daemon starts, **Then** the corrupted lock is removed and a new lock is acquired

---

### User Story 4 - Agent PID Tracking (Priority: P2)

As a daemon operator, I need the system to track agent child process PIDs so that they can be cleaned up on daemon shutdown, preventing orphaned processes.

**Why this priority**: Agent processes spawned by the daemon must be terminated when the daemon shuts down. This is secondary to the core lock functionality.

**Independent Test**: Can be tested by saving agent PIDs, shutting down the daemon, and verifying the agent processes receive SIGTERM.

**Acceptance Scenarios**:

1. **Given** the daemon has running agent child processes, **When** saveAgentPids() is called with their PIDs, **Then** the PIDs are persisted to an agent.pids file
2. **Given** agent PIDs are saved, **When** cleanupAgentProcesses() is called, **Then** each agent process receives SIGTERM
3. **Given** an agent PID in the file refers to a dead process, **When** cleanupAgentProcesses() is called, **Then** the dead process is skipped without error

---

### Edge Cases

- What happens when the PID file exists but the current process has root privileges and the file owner is a different user? The system MUST treat the lock as valid and fail acquisition (EPERM handling).
- What happens when the system clock changes between lock creation and staleness check? The system MUST rely on process liveness (kill(pid, 0)) rather than file timestamps for staleness detection.
- What happens when the daemon is killed with SIGKILL (unclean shutdown)? The PID file remains and is treated as stale on next startup — this is the expected behavior.
- What happens when the lock file path directory does not exist? The system MUST fail fast with a clear error indicating the data directory is not initialized.
- What happens when the file system does not support POSIX permissions (e.g., mounted volume)? The system MUST attempt to set 0o600 but proceed without failure if chmod is unsupported.
- What happens when two daemons start simultaneously and both detect a stale lock? The system MUST use atomic operations (linkSync) to ensure only one succeeds.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an `acquirePidLock(dataDir)` function that returns a `PidLockHandle` with a `release()` method
- **FR-002**: System MUST write a PID file at `{dataDir}/daemon.pid` with owner-read-only permissions (0o600) containing a JSON payload with pid, createdAt, and startTime
- **FR-003**: System MUST use atomic file operations (write temp file + linkSync) to prevent race conditions during lock acquisition
- **FR-004**: System MUST detect stale locks by checking if the recorded PID is alive via `process.kill(pid, 0)`
- **FR-005**: System MUST automatically clean stale locks and retry acquisition (max 2 attempts)
- **FR-006**: System MUST throw `PidLockError` with an `existingPid` property when another instance is running
- **FR-007**: System MUST delete the PID file when `release()` is called
- **FR-007a**: System MUST make `release()` idempotent — multiple calls must not throw and the PID file MUST be deleted only once
- **FR-008**: System MUST provide `saveAgentPids(pids)` to persist agent child process PIDs to `{dataDir}/agent.pids`
- **FR-009**: System MUST provide `cleanupAgentProcesses()` to send SIGTERM to all tracked agent PIDs
- **FR-010**: System MUST be located in the packages/agent-core shared package
- **FR-011**: System MUST export all types and functions from a barrel file (daemon/index.ts)
- **FR-012**: System MUST handle empty, corrupted, or invalid PID files by treating them as stale locks

### Key Entities

- **PidLockHandle**: Returned by acquirePidLock(), exposes `release()` for graceful shutdown and `isAcquired` for status checking
- **PidLockPayload**: JSON structure stored in the lock file: `{ pid: number, createdAt: string, startTime: number }`
- **PidLockError**: Custom error class thrown on lock acquisition failure, with optional `existingPid` property
- **daemon.pid**: The lock file located at `{dataDir}/daemon.pid`, contains JSON-encoded PidLockPayload, created with owner-read-only permissions (0o600)
- **agent.pids**: File at `{dataDir}/agent.pids`, contains JSON array of agent child process PIDs

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Daemon fails to start within 100ms when another instance is already running
- **SC-002**: Stale locks from crashed processes are detected and cleaned in under 50ms
- **SC-003**: Lock acquisition and release complete in under 50ms under normal conditions
- **SC-004**: Unit tests cover: acquire, release, stale detection, corrupted files, agent PID cleanup, race condition prevention
- **SC-005**: PID lock operations do not interfere with database WAL mode or other file operations
- **SC-006**: Agent processes are terminated within 5 seconds of daemon shutdown signal

## Assumptions

- Single-user desktop application — no multi-user PID lock conflicts expected
- The data directory is initialized by M2-5 Data Directory Manager before the PID lock is acquired
- Node.js `process.kill(pid, 0)` is reliable for checking process liveness on macOS/Linux
- `linkSync` atomic operation is available on the target platform (macOS, Linux)
- Agent processes are spawned as child processes of the daemon (same user context)
- The daemon receives SIGINT/SIGTERM for graceful shutdown (standard Node.js behavior)
- PID files do not need to be encrypted or tamper-proof (local trust model)

## Clarifications

### Session 2026-06-26

- Q: Which API style should the PID lock manager use? → A: Functional API with handle — `acquirePidLock(dataDir)` returns a `PidLockHandle` with `release()` method (v0.3.0 style)
- Q: Should the PID file have restrictive permissions? → A: Owner-read-only (0o600) — prevents other users/processes from modifying the lock file
