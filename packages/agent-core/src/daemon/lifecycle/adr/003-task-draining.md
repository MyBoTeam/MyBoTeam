# ADR-003: Task Draining on Shutdown

## Status

Accepted

## Date

2026-06-28

## Context

Daemon processes may have active tasks running when shutdown is initiated. These tasks may be writing to databases, processing files, or performing other critical operations.

## Decision

Implement task draining on shutdown:

1. **Stop accepting new tasks**: When shutdown is initiated, daemon stops accepting new tasks from the queue
2. **Drain active tasks**: Allow currently running tasks to complete within the shutdown timeout
3. **Discard pending tasks**: Tasks in the pending queue are discarded (not executed)
4. **Abort critical tasks on timeout**: If shutdown timeout is reached, abort tasks in critical state
5. **Log warnings for aborted tasks**: Log warnings when tasks are aborted due to timeout

## Consequences

### Positive
- Prevents data loss by allowing active tasks to complete
- Clear behavior for task management
- Critical tasks are handled appropriately

### Negative
- Pending tasks are lost (by design - cannot execute after shutdown)
- May delay shutdown if tasks are long-running

## Alternatives Considered

1. **Execute all tasks before shutdown**: Rejected - may take too long
2. **Abort all tasks immediately**: Rejected - causes data loss
3. **No task management**: Rejected - poor task handling

## Implementation Notes

- Active tasks: Drained on shutdown (allowed to complete)
- Pending tasks: Discarded on shutdown (not executed)
- Critical tasks: Aborted on timeout with warning logged
- Task timeout: Configurable per-task (default: no timeout)
- Task state tracking: Use TaskState enum for lifecycle management

## References

- Spec: FR-003, FR-013
- Accomplish: No task draining (intentionally deviated)