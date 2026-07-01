# Data Model: Daemon Lifecycle (MAO-148)

## Entities

### DaemonProcess

The background process that runs independently of the host application UI.

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| `pid` | integer | Unique, non-null | OS process ID |
| `socketPath` | string | Unique, non-null, validated | Path to Unix domain socket |
| `state` | DaemonState | Non-null, defaults to `Starting` | Current lifecycle state |
| `startTime` | ISO-8601 timestamp | Non-null | When daemon was started |
| `shutdownTimeout` | integer (ms) | Default: 30000 | Graceful shutdown timeout |
| `exitCode` | integer | Nullable | Process exit code (null if running) |

**Invariants**:
- `socketPath` must be unique across all daemon instances
- `state` must follow valid transitions (see DaemonState)
- `exitCode` is only set when state is `Stopped`

### TaskQueue

Queue of active tasks being processed by the daemon.

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| `taskId` | string | Unique, non-null | Unique task identifier |
| `state` | TaskState | Non-null, defaults to `Pending` | Task lifecycle state |
| `createdAt` | ISO-8601 timestamp | Non-null | When task was created |
| `startedAt` | ISO-8601 timestamp | Nullable | When task execution began |
| `completedAt` | ISO-8601 timestamp | Nullable | When task completed or failed |
| `timeout` | integer (ms) | Nullable | Task-specific timeout |

**Invariants**:
- Tasks in `Active` state must have `startedAt` set
- Tasks in `Completed` or `Failed` state must have `completedAt` set
- Maximum concurrent active tasks limited by concurrency configuration

### ShutdownManager

Coordinates graceful shutdown, draining tasks, and cleaning up resources.

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| `shutdownInitiated` | boolean | Non-null, default: false | Whether shutdown has started |
| `shutdownTimestamp` | ISO-8601 timestamp | Nullable | When shutdown was initiated |
| `activeTasksDrained` | integer | Non-null, default: 0 | Count of tasks drained during shutdown |
| `tasksAborted` | integer | Non-null, default: 0 | Count of tasks aborted due to timeout |
| `resourcesCleanedUp` | boolean | Non-null, default: false | Whether all resources were cleaned |

**Invariants**:
- If `shutdownInitiated` is true, `shutdownTimestamp` must be set
- `activeTasksDrained` + `tasksAborted` = total tasks that were active when shutdown started
- `resourcesCleanedUp` is only true after state reaches `Stopped`

## Enums

### DaemonState

```typescript
enum DaemonState {
  Starting = 'Starting',
  Running = 'Running',
  Draining = 'Draining',
  Stopped = 'Stopped'
}
```

**Valid Transitions**:
- `Starting` → `Running` (initialization complete)
- `Running` → `Draining` (SIGTERM received)
- `Draining` → `Stopped` (all tasks completed OR timeout reached)
- Any → `Stopped` (fatal error or SIGKILL)

### TaskState

```typescript
enum TaskState {
  Pending = 'Pending',
  Active = 'Active',
  Completed = 'Completed',
  Failed = 'Failed'
}
```

**Valid Transitions**:
- `Pending` → `Active` (task execution starts)
- `Active` → `Completed` (task succeeds)
- `Active` → `Failed` (task fails or aborted)
- `Pending` → `Failed` (discarded during shutdown)

## Relationships

### DaemonProcess → TaskQueue
- **Cardinality**: One-to-many
- **Description**: A daemon process manages one task queue with multiple tasks
- **Constraint**: Tasks are owned by exactly one daemon process

### ShutdownManager → DaemonProcess
- **Cardinality**: One-to-one
- **Description**: Each daemon process has exactly one shutdown manager
- **Constraint**: ShutdownManager lifecycle is bound to DaemonProcess

### ShutdownManager → TaskQueue
- **Cardinality**: One-to-one
- **Description**: ShutdownManager coordinates draining of the associated task queue
- **Constraint**: ShutdownManager must drain all active tasks before completing shutdown

## State Transition Diagram

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
            ┌──────────────┐                                 │
            │   Starting   │                                 │
            └──────────────┘                                 │
                    │                                         │
                    │ initialization complete                 │
                    ▼                                         │
            ┌──────────────┐                                 │
            │   Running    │◄────────────────────────────────┤
            └──────────────┘                                 │
                    │                                         │
                    │ SIGTERM received                        │
                    ▼                                         │
            ┌──────────────┐                                 │
            │   Draining   │                                 │
            └──────────────┘                                 │
                    │                                         │
                    │ tasks complete OR timeout reached       │
                    ▼                                         │
            ┌──────────────┐                                 │
            │   Stopped    │─────────────────────────────────┘
            └──────────────┘                                 │
                    │                                         │
                    │ fatal error OR SIGKILL                  │
                    └─────────────────────────────────────────┘
```

## Invariants Summary

1. **State Validity**: DaemonState must always be a valid enum value
2. **Transition Validity**: State transitions must follow the defined paths
3. **Task Count**: `activeTasksDrained` + `tasksAborted` = total tasks active at shutdown start
4. **Resource Cleanup**: All IPC resources must be cleaned before state reaches `Stopped`
5. **PID Uniqueness**: Each daemon process must have a unique PID
6. **Socket Path Uniqueness**: Socket paths must be unique across all daemon instances
