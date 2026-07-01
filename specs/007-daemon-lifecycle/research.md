# Research: Daemon Lifecycle (MAO-148)

## CDR Rules to Follow

### Architecture Rules

1. **CDR-2026-061: Immediate Close on Shutdown**
   - Use `socket.destroy()` instead of `socket.end()` for immediate cleanup on daemon shutdown
   - Prevents hanging during shutdown and ensures clean resource cleanup
   - Evidence: `packages/agent-core/src/daemon/rpc-server.ts:145-160`
   - **Applies to**: Our daemon shutdown implementation

2. **CDR-2026-060: Source Reference Analysis Before Planning**
   - Every feature plan MUST include "Source Reference Analysis" section
   - Document specific files, line numbers, and patterns to adopt/avoid
   - **Applies to**: Our plan.md generation (Phase 1)

### DevOps Rules

3. **CDR-2026-062: Lint Compliance Without Config Changes**
   - Fix code to match existing lint rules, never modify configs
   - Use type assertions instead of `!` operator
   - Prefix unused parameters with `_`
   - Use `process.stdout.write` in performance-sensitive code
   - **Applies to**: All implementation tasks

## Architecture Decisions

### Process Relationship: Independent (Not Child)

**Decision**: Daemon runs as independent process, not a child process

**Rationale**:
- CLI process should not hold daemon lifecycle dependency
- Daemon continues running after CLI exits
- CLI reconnects to existing daemon if already running
- Enables multi-session daemon usage

**Accomplish Pattern**: Uses child process with exec/fork

**Our Enhancement**: Use spawn with detached option, or use system-level daemonization

### Shutdown Behavior: 30s Timeout with Task Draining

**Decision**: Graceful shutdown with 30-second timeout, drain active tasks, discard queued

**Rationale**:
- Allows in-flight tasks to complete
- Prevents indefinite hanging with timeout
- Clear policy for queued tasks on shutdown

**Accomplish Pattern**: Exit immediately on SIGTERM, force kill immediately

**Our Enhancement**: More robust production behavior with timeout

### Auto-Restart: Exponential Backoff

**Decision**: Auto-restart with exponential backoff on unexpected exit

**Rationale**:
- Provides availability for long-running daemon
- Prevents rapid restart loops
- Better than no auto-restart for production

**Accomplish Pattern**: No auto-restart (requires manual intervention)

**Our Enhancement**: System-level watchdog with exponential backoff

## Intentional Deviations from Accomplish

### Deviation 1: Process Relationship
- **Accomplish**: CLI spawns daemon as child process
- **Ours**: Daemon runs as independent process
- **Rationale**: Better multi-session support, daemon persists after CLI exit

### Deviation 2: Graceful Shutdown
- **Accomplish**: Immediate exit on SIGTERM
- **Ours**: 30s timeout with task draining
- **Rationale**: Production robustness, prevent data loss

### Deviation 3: Auto-Restart
- **Accomplish**: No auto-restart
- **Ours**: Exponential backoff auto-restart
- **Rationale**: High availability for production daemon

### Deviation 4: Task Draining
- **Accomplish**: No task draining
- **Ours**: Drain active tasks, discard queued
- **Rationale**: Graceful task completion on shutdown

### Deviation 5: Resource Cleanup
- **Accomplish**: Not specified
- **Ours**: All IPC-related resources (sockets, timers, file descriptors)
- **Rationale**: Prevent resource leaks

## Resolved Questions

| Question | Resolution | Rationale |
|----------|------------|-----------|
| How does daemon get restarted on crash? | Auto-restart with exponential backoff | Production availability requirement |
| Is daemon PID tracked? | Yes, PID file for single instance | Prevent multiple daemon instances |
| What happens to tasks on shutdown? | Drain active, discard queued | Clear shutdown policy |
| What happens to queued tasks if daemon dies? | Tasks lost (acceptable for local IPC) | Simplest correct behavior |

## Open Questions

None remaining - all 31 clarification questions resolved.

## Source References

### Accomplish (Reference Implementation - Intentionally Deviated)

- `apps/desktop/src/main/daemon/manager.ts` - DaemonManager class
- `apps/desktop/src/main/daemon/ipc-client.ts` - IPC communication patterns
- `apps/desktop/src/main/daemon/watcher.ts` - Watcher for daemon monitoring

### myboteam_v0.5.0 (Base for Enhancement)

- `packages/agent-core/src/daemon/rpc-server.ts:145-160` - Current stop() method
- `packages/agent-core/src/daemon/rpc-server.ts` - Daemon RPC server implementation
