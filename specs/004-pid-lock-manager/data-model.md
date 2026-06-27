# Data Model: PID Lock Manager

## Entities

### PidLockPayload

**Purpose**: Metadata stored in the PID lock file to identify the owning process and enable staleness detection.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pid` | `number` | Yes | Process ID of the daemon that owns the lock |
| `createdAt` | `string` | Yes | ISO 8601 timestamp of when the lock was created |
| `startTime` | `number` | Yes | Epoch milliseconds (`Date.now()`) for ordering and debugging |

**Validation Rules**:
- `pid` MUST be a positive integer
- `createdAt` MUST be a valid ISO 8601 string
- `startTime` MUST be a positive number (epoch ms)

**Storage**: JSON-encoded in `{dataDir}/daemon.pid`

### PidLockHandle

**Purpose**: Opaque handle returned by `acquirePidLock()` that manages the lock lifecycle.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pidPath` | `string` | Yes | Absolute path to the PID lock file |
| `isAcquired` | `boolean` | Yes | Whether the lock is currently held (true after acquire, false after release) |
| `release` | `() => void` | Yes | Function to release the lock (delete PID file) |

**Behavior**:
- `isAcquired` MUST be `true` after `acquirePidLock()` returns successfully
- `isAcquired` MUST be set to `false` after `release()` is called
- `release()` MUST be idempotent — calling it multiple times is safe
- `release()` MUST silently ignore errors if the file is already deleted
- The handle MUST NOT be used after `release()` is called

### PidLockError

**Purpose**: Typed error thrown when lock acquisition fails.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | `string` | Yes | Human-readable error description |
| `existingPid` | `number \| undefined` | No | PID of the process holding the lock (when conflict detected) |
| `name` | `string` | Yes | Always `"PidLockError"` |

**Error Scenarios**:
- `existingPid` present: Another daemon instance is running with that PID
- `existingPid` undefined: Filesystem error or stale lock removal failure

## Files

### daemon.pid

**Location**: `{dataDir}/daemon.pid`
**Format**: JSON-encoded `PidLockPayload`
**Permissions**: 0o600 (owner-read-only)
**Lifecycle**: Created on acquire, deleted on release

```
{"pid":12345,"createdAt":"2026-06-26T12:00:00.000Z","startTime":1750958400000}
```

### agent.pids

**Location**: `{dataDir}/agent.pids`
**Format**: JSON array of numbers
**Permissions**: Default (umask)
**Lifecycle**: Created/updated by `saveAgentPids()`, deleted by `cleanupAgentProcesses()`

```
[12346,12347,12348]
```

## State Transitions

### Lock Lifecycle

```
[No Lock] --acquirePidLock()--> [Lock Acquired] --release()--> [No Lock]
                                      |
                                      v
                              [Lock Acquired] --SIGKILL/crash--> [Stale Lock]
                                      ^                               |
                                      |                               v
                              [Stale Lock] --acquirePidLock()--> [Lock Acquired]
```

### Acquire Attempt Flow

```
acquirePidLock()
  ├── Write temp file (0o600)
  ├── linkSync(tmp, target)
  │     ├── Success → return handle
  │     └── EEXIST → read existing payload
  │           ├── Stale (pid dead) → unlink existing → retry (max 2)
  │           └── Alive → throw PidLockError(existingPid)
  └── Other error → throw PidLockError
```

## Relationships

- `PidLockPayload` is stored in `daemon.pid`
- `PidLockHandle.pidPath` points to `daemon.pid`
- `PidLockHandle.release()` deletes `daemon.pid`
- `saveAgentPids()` writes to `agent.pids`
- `cleanupAgentProcesses()` reads from `agent.pids` and sends SIGTERM
