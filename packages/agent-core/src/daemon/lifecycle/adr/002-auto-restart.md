# ADR-002: Auto-Restart with Exponential Backoff

## Status

Accepted

## Date

2026-06-28

## Context

Daemon processes may crash due to various reasons (memory leaks, unhandled exceptions, etc.). Without auto-restart, the daemon would remain down until manually restarted.

## Decision

Implement auto-restart with exponential backoff:

1. **Detect crashes**: Monitor daemon process exit codes and signals
2. **Exponential backoff**: Restart delays: 1s, 2s, 4s, 8s, max 30s
3. **Reset backoff after stability**: If daemon runs for 60 seconds, reset backoff to initial value
4. **Max restart attempts**: 5 attempts before requiring manual intervention
5. **Exit code handling**: Different exit codes trigger different restart behavior

## Consequences

### Positive
- High availability - daemon recovers from crashes automatically
- Prevents restart storms with exponential backoff
- Clear escalation path after max attempts

### Negative
- May mask underlying issues if daemon keeps crashing
- Exponential backoff may delay recovery for transient issues

## Alternatives Considered

1. **No auto-restart**: Rejected - poor availability
2. **Fixed delay restart**: Rejected - may cause restart storms
3. **Immediate restart**: Rejected - may cause resource exhaustion

## Implementation Notes

- Base delay: 1 second (configurable via `baseRestartDelayMs`)
- Max delay: 30 seconds (configurable via `maxRestartDelayMs`)
- Stability period: 60 seconds (configurable via `stabilityPeriodMs`)
- Max attempts: 5 (configurable via `maxRestartAttempts`)
- Exit codes 4 (startup failed) and 5 (crash) trigger auto-restart
- Exit codes 2 (timeout) and 3 (task aborted) do not trigger auto-restart

## References

- Spec: FR-010
- Accomplish: No auto-restart (intentionally deviated)