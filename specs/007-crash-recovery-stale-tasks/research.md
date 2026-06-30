# Research: Crash Recovery — PID Detection, Stale Tasks

**Date**: 2026-06-29
**Feature**: 007-crash-recovery-stale-tasks
**Status**: Complete

## Research Questions

| Question | Status | Resolution |
|----------|--------|------------|
| How does Accomplish implement crash detection? | ✅ Resolved | Lines 111-117 in apps/daemon/src/index.ts |
| How does Accomplish implement graceful shutdown? | ✅ Resolved | Lines 305-347 in apps/daemon/src/index.ts |
| What is the PID lock manager interface? | ✅ Resolved | packages/agent-core/src/daemon/pid-lock.ts |
| How should drain timeout be configured? | ✅ Resolved | Environment variable MYBOTEAM_DRAIN_TIMEOUT_MS (default 30s) |
| How should shutdown work cross-platform? | ✅ Resolved | RPC shutdown method only (not OS signals) |

## Findings

### 1. Accomplish Crash Detection Pattern

**Decision**: Follow Accomplish pattern with enhancements

**Rationale**: Accomplish provides a proven crash recovery implementation that:
- Checks for stale lock file on startup (lines 111-117)
- Removes stale lock and acquires new lock
- Marks stale running tasks as failed
- Logs warnings for each stale task

**Alternatives considered**:
- Using OS signals (SIGUSR1) for crash detection — rejected: not cross-platform
- Auto-resuming tasks — rejected: out of scope (M3-4 concern)

**Source**: `/Users/mavishay/Projects/Accomplish/accomplish/apps/daemon/src/index.ts` (lines 111-117)

**Pattern to adopt**:
```typescript
// Check for stale lock on startup
const staleLockDetected = await pidLock.detectStaleLock();
if (staleLockDetected) {
  console.warn('Stale lock detected from previous daemon instance');
  await pidLock.removeStaleLock();
}

// Mark stale running tasks as failed
const staleTasks = await taskCrud.listTasks({ status: 'running' });
for (const task of staleTasks) {
  await taskCrud.updateTask(task.id, { status: 'failed' });
  console.warn(`Task ${task.id} marked as failed (stale after daemon crash)`);
}
```

### 2. Accomplish Graceful Shutdown Pattern

**Decision**: Follow Accomplish pattern with RPC method (not OS signals)

**Rationale**: Accomplish implements graceful shutdown with:
- Signal handler for SIGTERM/SIGINT (lines 305-347)
- Drain timeout (configurable)
- Force-stop remaining tasks
- Lock file cleanup

**Enhancement for myboteam**:
- Use RPC method instead of OS signals (cross-platform, works on Windows)
- Use `socket.destroy()` instead of `socket.end()` for immediate cleanup (CDR-2026-061)

**Alternatives considered**:
- OS signal handling (SIGTERM/SIGINT) — rejected: not cross-platform (Windows)
- Single-process shutdown — rejected: daemon must outlive Electron shell

**Source**: `/Users/mavishay/Projects/Accomplish/accomplish/apps/daemon/src/index.ts` (lines 305-347)

**Pattern to adopt**:
```typescript
async function gracefulShutdown() {
  if (isShuttingDown) return; // Idempotent
  isShuttingDown = true;
  
  // Stop accepting new tasks
  scheduler.stop();
  
  // Drain active tasks with timeout
  const drainTimeout = parseInt(process.env.MYBOTEAM_DRAIN_TIMEOUT_MS || '30000');
  await drainActiveTasks(drainTimeout);
  
  // Force-stop remaining tasks
  await forceStopRemainingTasks();
  
  // Terminate agent processes
  await terminateAgentProcesses();
  
  // Release lock and exit
  await pidLock.release();
  process.exit(0);
}
```

### 3. PID Lock Manager Interface

**Decision**: Use existing PID lock manager interface

**Rationale**: The PID lock manager (004-pid-lock-manager) already provides:
- `acquire()` — acquire lock with stale detection
- `release()` — release lock
- `isLocked()` — check if lock exists
- `isStale()` — check if lock is stale (process not running)

**Enhancement needed**: Add `detectStaleLock()` and `removeStaleLock()` methods for explicit crash recovery.

**Source**: `packages/agent-core/src/daemon/pid-lock.ts` (existing implementation)

**Interface**:
```typescript
interface PidLockManager {
  acquire(): Promise<boolean>;
  release(): Promise<void>;
  isLocked(): Promise<boolean>;
  isStale(): Promise<boolean>;
  detectStaleLock(): Promise<boolean>; // NEW
  removeStaleLock(): Promise<void>; // NEW
}
```

### 4. Drain Timeout Configuration

**Decision**: Environment variable with default

**Rationale**:
- Environment variable allows runtime configuration without code changes
- Default 30 seconds matches Accomplish behavior
- Cross-platform (works on Windows, macOS, Linux)

**Alternatives considered**:
- Config file — rejected: more complex, requires file parsing
- Hardcoded value — rejected: not configurable
- Command-line argument — rejected: daemon is started by Electron, not CLI

**Pattern**:
```typescript
const DRAIN_TIMEOUT_MS = parseInt(process.env.MYBOTEAM_DRAIN_TIMEOUT_MS || '30000');
```

### 5. Cross-Platform Shutdown

**Decision**: RPC shutdown method only

**Rationale**:
- Works on Windows and Unix (cross-platform)
- Consistent with existing JSON-RPC architecture (ADR-001)
- No OS-specific signal handling required

**Alternatives considered**:
- OS signals (SIGTERM/SIGINT) — rejected: not cross-platform (Windows)
- HTTP shutdown endpoint — rejected: introduces new protocol; Unix socket is simpler

**Pattern**:
```typescript
// Add shutdown method to RPC server
rpcServer.register('daemon.shutdown', async (params) => {
  await gracefulShutdown();
  return { success: true };
});
```

### 6. Agent Process Cleanup

**Decision**: Track agent PIDs in file; terminate on shutdown

**Rationale**:
- Agent processes are spawned as child processes of the daemon
- Must be cleaned up on shutdown to prevent resource leaks
- PID file allows cleanup even if daemon crashes

**Alternatives considered**:
- Process group termination — rejected: not cross-platform; may kill unrelated processes
- Orphan process detection — rejected: complex; PID tracking is simpler

**Pattern**:
```typescript
// Agent PIDs file: {dataDir}/agent.pids
// Each line contains a PID

async function terminateAgentProcesses() {
  const pidsFile = path.join(dataDir, 'agent.pids');
  if (!fs.existsSync(pidsFile)) return;
  
  const pids = fs.readFileSync(pidsFile, 'utf-8')
    .split('\n')
    .filter(line => line.trim());
  
  for (const pid of pids) {
    try {
      process.kill(parseInt(pid), 'SIGTERM');
    } catch (e) {
      // Process already dead; skip
    }
  }
  
  fs.unlinkSync(pidsFile);
}
```

## Key Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Crash detection | Accomplish pattern (stale lock + task marking) | Proven pattern; minimal complexity |
| Graceful shutdown | RPC method (not OS signals) | Cross-platform (Windows + Unix) |
| Drain timeout | Environment variable (default 30s) | Configurable; cross-platform |
| Agent cleanup | PID file tracking | Simple; cross-platform |
| Socket cleanup | `socket.destroy()` (not `socket.end()`) | CDR-2026-061: immediate cleanup |
| Task status update | Mark as `failed` (not `cancelled`) | Accomplish pattern; clear semantics |
