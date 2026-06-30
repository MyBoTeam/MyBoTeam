# Quickstart: Crash Recovery — PID Detection, Stale Tasks

**Date**: 2026-06-29
**Feature**: 007-crash-recovery-stale-tasks
**Status**: Complete

## Overview

This feature adds crash recovery and graceful shutdown to the myboteam daemon. It detects stale running tasks after crashes, marks them as failed, and supports graceful shutdown with task drain.

## Key Components

### 1. Crash Detection (Daemon Startup)

**File**: `apps/daemon/src/index.ts`

On startup, the daemon:
1. Checks for stale lock file from crashed instance
2. Removes stale lock if detected
3. Acquires new lock
4. Marks stale `running` tasks as `failed`
5. Logs warnings for each stale task

**Configuration**: None required (automatic)

### 2. Graceful Shutdown (RPC Method)

**File**: `apps/daemon/src/index.ts`

**RPC Method**: `daemon.shutdown`

**Parameters**:
- `timeoutMs` (optional, default 30000): Drain timeout in milliseconds

**Behavior**:
1. Stops scheduler (rejects new tasks)
2. Drains active tasks (waits for completion)
3. Force-stops remaining tasks after timeout
4. Terminates agent child processes
5. Releases lock file
6. Exits process

**Cross-platform**: Works on Windows, macOS, Linux

### 3. Agent Process Cleanup

**File**: `packages/agent-core/src/daemon/agent-tracker.ts`

**File**: `{dataDir}/agent.pids`

On shutdown, the daemon:
1. Reads agent PIDs from file
2. Sends SIGTERM to each agent process
3. Skips dead processes without error
4. Removes PID file

### 4. Drain Timeout Configuration

**Environment Variable**: `MYBOTEAM_DRAIN_TIMEOUT_MS`

**Default**: 30000 (30 seconds)

**Usage**:
```bash
# Set custom drain timeout (60 seconds)
MYBOTEAM_DRAIN_TIMEOUT_MS=60000 myboteam-daemon

# Use default (30 seconds)
myboteam-daemon
```

## Usage Examples

### Example 1: Graceful Shutdown via RPC

```typescript
// Client code (Electron main process)
const response = await rpcClient.call('daemon.shutdown', {
  timeoutMs: 60000 // 60 second drain timeout
});

console.log(response);
// {
//   success: true,
//   drainTimeout: 60000
// }
```

### Example 2: Check Shutdown Status

```typescript
const status = await rpcClient.call('daemon.getShutdownStatus', {});
console.log(status);
// {
//   isShuttingDown: false,
//   shutdownStartTime: null,
//   drainTimeoutMs: 30000
// }
```

### Example 3: Crash Recovery (Automatic)

```bash
# Daemon is running with active tasks
# Kill the daemon process (simulating crash)
kill -9 <daemon-pid>

# Restart the daemon
myboteam-daemon

# Output:
# [WARN] Stale lock detected from previous daemon instance
# [WARN] Task abc-123 marked as failed (stale after daemon crash)
# [WARN] Task def-456 marked as failed (stale after daemon crash)
# [INFO] Daemon started successfully
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Lock file corrupted | Treated as stale; removed and new lock acquired |
| Two daemons start simultaneously | Atomic file operations ensure only one succeeds |
| System clock changes | Process liveness checks (not timestamps) used for staleness |
| Drain timeout reached | Tasks force-stopped; daemon exits |
| Multiple shutdown requests | Idempotent; subsequent requests ignored |
| Agent PIDs file missing | Cleanup skipped without error |
| Dead agent process | Skipped without error |
| Drain timeout env var not set | Default 30 seconds used |

## Testing

### Unit Tests

```bash
# Run unit tests for crash recovery
pnpm test:unit -- --filter="*crash*"

# Run unit tests for graceful shutdown
pnpm test:unit -- --filter="*shutdown*"
```

### Integration Tests

```bash
# Run integration tests
pnpm test:integration -- --filter="*daemon*"
```

### Manual Testing

1. **Crash Recovery Test**:
   - Start daemon with active tasks
   - Kill daemon process (`kill -9`)
   - Restart daemon
   - Verify stale tasks are marked as `failed`

2. **Graceful Shutdown Test**:
   - Start daemon with active tasks
   - Call `daemon.shutdown` RPC method
   - Verify tasks drain within timeout
   - Verify lock file is released

## Monitoring

### Logs

- `[WARN] Stale lock detected from previous daemon instance`
- `[WARN] Task {id} marked as failed (stale after daemon crash)`
- `[INFO] Daemon shutting down gracefully`
- `[INFO] Draining {n} active tasks...`
- `[WARN] Drain timeout reached; force-stopping remaining tasks`
- `[INFO] Daemon shutdown complete`

### Metrics

- `daemon.crash_recovery.count` — Number of stale tasks marked as failed
- `daemon.shutdown.duration` — Total shutdown duration in milliseconds
- `daemon.shutdown.tasks_drained` — Number of tasks completed during drain
- `daemon.shutdown.tasks_force_stopped` — Number of tasks force-stopped

## Related Features

- **004-pid-lock-manager**: PID lock manager (dependency)
- **M3-4: Auto-restart**: Auto-restart after crash (separate concern)
- **M3-2: Daemon Startup/Shutdown**: Daemon lifecycle management
