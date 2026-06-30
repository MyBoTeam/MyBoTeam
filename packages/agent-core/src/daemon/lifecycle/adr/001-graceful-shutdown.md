# ADR-001: Graceful Shutdown with 30s Timeout

## Status

Accepted

## Date

2026-06-28

## Context

Daemon processes need to shut down gracefully to prevent data loss and ensure task completion. However, some tasks may hang indefinitely, preventing the daemon from shutting down.

## Decision

Implement graceful shutdown with a 30-second timeout:

1. **SIGTERM triggers graceful shutdown**: Daemon stops accepting new tasks and begins draining active tasks
2. **30-second timeout**: If tasks don't complete within 30 seconds, force kill the daemon
3. **Force kill on timeout**: Use `process.kill(pid, 'SIGKILL')` to immediately terminate the daemon
4. **Ignore subsequent signals**: If shutdown is already in progress, ignore additional SIGTERM signals

## Consequences

### Positive
- Prevents data loss by allowing tasks to complete
- Ensures daemon can always shut down (timeout prevents hanging)
- Clear behavior for monitoring and debugging

### Negative
- 30-second timeout may be too long for some use cases (configurable)
- Force kill may leave tasks in inconsistent state

## Alternatives Considered

1. **Immediate exit on SIGTERM**: Rejected - causes data loss
2. **No timeout**: Rejected - daemon may hang indefinitely
3. **Custom timeout per task**: Considered for future enhancement

## Implementation Notes

- Default timeout: 30 seconds (configurable via `shutdownTimeoutMs`)
- Timeout starts when SIGTERM is received
- If tasks complete before timeout, daemon exits immediately
- If timeout is reached, daemon is force killed with exit code 2

## References

- Spec: FR-002, FR-011, FR-014
- Accomplish: Immediate exit on SIGTERM (intentionally deviated)