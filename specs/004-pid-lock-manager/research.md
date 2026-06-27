# Research: PID Lock Manager

## Decision Log

### D1: API Style — Functional with Handle

**Decision**: Use functional API pattern (`acquirePidLock()` returns `PidLockHandle`) rather than class-based (`new PidLock()`).

**Rationale**: v0.3.0 already validated this pattern. Functional API with handle provides clean resource lifecycle — caller gets a handle with `release()`, no need to track class instances. Aligns with TypeScript functional idioms and simplifies testing.

**Alternatives considered**:
- Class-based (v0.2.0): More boilerplate, harder to test, mutable state on instance
- Singleton pattern: Overly complex for single-user desktop app

### D2: Lock File Format — JSON Payload

**Decision**: Store JSON payload in `daemon.pid` with `{ pid, createdAt, startTime }`.

**Rationale**: v0.3.0 validated this approach. JSON payload provides:
- Process liveness check via `pid` field
- Human-readable `createdAt` timestamp for debugging
- `startTime` (epoch ms) for ordering and staleness heuristics
- Extensible — future fields can be added without format change

**Alternatives considered**:
- Plain-text PID (v0.2.0): Less metadata, harder to debug, no timestamp
- Binary format: Unnecessary complexity for desktop app

### D3: Atomic Lock Acquisition — linkSync

**Decision**: Use `writeSync` to temp file + `linkSync` to atomically place at target path.

**Rationale**: `linkSync` creates a hard link atomically — on POSIX systems, if the target path already exists, `linkSync` throws `EEXIST`. This provides atomic "compare-and-swap" semantics without file locks. v0.3.0 validated this pattern works on macOS and Linux.

**Alternatives considered**:
- `fcntl` file locking (flock): Advisory locks, released on process crash, not portable to Windows
- `O_EXCL` flag on open: Only prevents creation, doesn't handle stale lock removal
- PID file with timeout: Relies on clock, fragile across system sleep/wake

### D4: Stale Lock Detection — Process Liveness

**Decision**: Use `process.kill(pid, 0)` to check if the recorded PID is alive. On `ESRCH` (no such process), treat as stale. On `EPERM` (permission denied), treat as valid (another user's process).

**Rationale**: v0.2.0 and v0.3.0 both use this approach. It's the standard Unix pattern for PID file staleness detection. Reliable across system clock changes and sleep/wake cycles.

**Alternatives considered**:
- File timestamp-based staleness: Fragile with system clock changes, NTP adjustments
- Heartbeat file: Adds complexity, still requires liveness check
- OS-level lock files (flock): Released on crash, but not cross-platform

### D5: File Permissions — 0o600

**Decision**: Set PID file permissions to owner-read-only (0o600) on creation.

**Rationale**: Security best practice — prevents other users on shared systems from reading or modifying the lock file. Low cost to implement. Graceful fallback if filesystem doesn't support POSIX permissions (e.g., mounted volumes).

**Alternatives considered**:
- Default umask: Insufficient protection on shared systems
- 0o644 (world-readable): Unnecessary exposure of PID information

### D6: Agent PID Tracking — Separate File

**Decision**: Store agent PIDs in a separate `agent.pids` file (not in the lock file).

**Rationale**: v0.2.0 uses this pattern. Separation of concerns — the lock file is for daemon lifecycle, agent PIDs are for cleanup. The agent PID file can be updated independently without touching the lock.

**Alternatives considered**:
- Store in lock file JSON: Couples agent lifecycle to lock, complicates atomic updates
- Store in database: Overkill for simple PID list, adds dependency on storage layer

### D7: Error Handling — Typed PidLockError

**Decision**: Throw `PidLockError` with optional `existingPid` property.

**Rationale**: Typed errors allow callers to distinguish lock conflicts from other filesystem errors. `existingPid` enables user-facing error messages ("Daemon already running with PID 12345").

**Alternatives considered**:
- Generic Error: Loses type information, harder to handle specifically
- Result type (ok/error): More TypeScript-idiomatic but adds complexity for synchronous API

### D8: Retry Strategy — Max 2 Attempts

**Decision**: Attempt lock acquisition up to 2 times (initial attempt + retry after stale removal).

**Rationale**: v0.3.0 uses this pattern. Two attempts handle the common case: first attempt detects stale lock, removes it, second attempt succeeds. More than 2 attempts adds complexity without practical benefit for single-user desktop app.

**Alternatives considered**:
- Exponential backoff: Unnecessary for single-user, adds latency
- Infinite retry: Could hang if persistent conflict
- Single attempt: Insufficient for stale lock recovery
