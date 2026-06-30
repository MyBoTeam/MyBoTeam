# Data Model: Crash Recovery — PID Detection, Stale Tasks

**Date**: 2026-06-29
**Feature**: 007-crash-recovery-stale-tasks
**Status**: Complete

## Entities

### 1. Lock File

**Purpose**: Daemon instance identification and crash detection

| Field | Type | Description |
|-------|------|-------------|
| `pid` | number | Process ID of the daemon |
| `startTime` | string | ISO 8601 timestamp when lock was created |
| `hostname` | string | Hostname of the machine (optional, for debugging) |

**File Location**: `{dataDir}/daemon.lock`

**State Transitions**:
```
[No Lock] → acquire() → [Locked]
[Locked] → release() → [No Lock]
[Locked] → crash detected → [Stale Lock]
[Stale Lock] → removeStaleLock() → [No Lock]
[Stale Lock] → acquire() → [Locked] (new instance)
```

**Validation Rules**:
- Lock file MUST be created atomically (write to temp file, then rename)
- Lock file MUST be removed on graceful shutdown
- Stale lock detection MUST rely on process liveness (not file timestamps)
- Corrupted or empty lock file MUST be treated as stale

### 2. Task (Extended)

**Purpose**: Track task execution state; mark stale tasks on crash recovery

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `agentId` | UUID | Foreign key to agent |
| `status` | enum | `pending`, `running`, `completed`, `failed`, `cancelled` |
| `verificationStatus` | string | Verification state |
| `continuationCount` | number | Number of continuations |

**State Transitions (Crash Recovery)**:
```
[Running] → crash detected → [Failed] (with warning log)
```

**Validation Rules**:
- Tasks with `running` status MUST be marked as `failed` on daemon restart after crash
- Warning log MUST include task ID and reason (stale after daemon crash)
- Status update MUST be atomic (transaction)

### 3. Agent PIDs File

**Purpose**: Track agent child processes for cleanup on shutdown

| Field | Type | Description |
|-------|------|-------------|
| `pid` | number | Process ID of agent child process |

**File Location**: `{dataDir}/agent.pids`

**Format**: One PID per line (text file)

**State Transitions**:
```
[Agent Started] → addPid() → [PID Added]
[Daemon Shutdown] → terminateAll() → [All PIDs Terminated]
[Daemon Shutdown] → file missing → [Skip Cleanup]
```

**Validation Rules**:
- Dead processes MUST be skipped without error
- Missing or empty file MUST be treated as no agents to clean up
- PIDs MUST be terminated with SIGTERM

### 4. Shutdown State

**Purpose**: Track daemon shutdown state for idempotency

| Field | Type | Description |
|-------|------|-------------|
| `isShuttingDown` | boolean | Whether shutdown is in progress |
| `shutdownStartTime` | Date | When shutdown was initiated |
| `drainTimeoutMs` | number | Configurable timeout (default 30000) |

**State Transitions**:
```
[Running] → shutdown request → [Draining]
[Draining] → all tasks complete → [Exiting]
[Draining] → timeout reached → [Force-Stopping]
[Force-Stopping] → cleanup complete → [Exiting]
```

**Validation Rules**:
- Multiple shutdown requests MUST be ignored (idempotent)
- New task requests MUST be rejected immediately when `isShuttingDown = true`
- Drain timeout MUST be configurable via `MYBOTEAM_DRAIN_TIMEOUT_MS` env var

## Relationships

```
┌─────────────┐      ┌─────────────┐
│  Lock File  │─────▶│    Task     │
│  (daemon)   │      │  (stale)    │
└─────────────┘      └─────────────┘
       │                    │
       ▼                    ▼
┌─────────────┐      ┌─────────────┐
│ Agent PIDs  │      │  Shutdown   │
│  (cleanup)  │      │   State     │
└─────────────┘      └─────────────┘
```

- Lock File is created on daemon startup; Task status is checked after lock acquisition
- Agent PIDs are tracked during execution; cleaned up on shutdown
- Shutdown State governs the transition from Running to Exiting

## Database Schema Changes

**None** — This feature uses existing schema:
- `tasks` table with `status` column (already supports `running`, `failed`)
- No new tables or columns required

## File System Changes

**New files**:
- `{dataDir}/agent.pids` — Agent child process tracking (created at runtime)

**Modified files**:
- `{dataDir}/daemon.lock` — Enhanced with atomic creation/removal

## Indexes

**None** — No new indexes required:
- Task status queries use existing indexes
- Lock file is a single file (no indexing needed)
