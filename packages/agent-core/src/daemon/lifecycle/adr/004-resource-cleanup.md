# ADR-004: Resource Cleanup on Shutdown

## Status

Accepted

## Date

2026-06-28

## Context

Daemon processes use various resources (sockets, file handles, temp files) that need to be cleaned up on shutdown to prevent resource leaks.

## Decision

Implement comprehensive resource cleanup on shutdown:

1. **Destroy all sockets immediately**: Use `socket.destroy()` pattern for immediate cleanup
2. **Close all file handles**: Close all open file descriptors
3. **Remove temp files**: Clean up any temporary files created during operation
4. **Track resources**: Maintain a registry of all resources for cleanup
5. **Cleanup before exit**: Ensure all cleanup completes before process exits

## Consequences

### Positive
- Prevents resource leaks
- Clean shutdown leaves no orphaned resources
- System stability maintained

### Negative
- Immediate socket destruction may cause data loss (acceptable for shutdown)
- Cleanup may take time if many resources are open

## Alternatives Considered

1. **No resource cleanup**: Rejected - causes resource leaks
2. **Graceful socket close**: Rejected - may hang if client unresponsive
3. **OS-level cleanup**: Rejected - not reliable for all resource types

## Implementation Notes

- Socket cleanup: Use `socket.destroy()` (not `socket.end()`)
- File handle tracking: Maintain `Set<fs.FileHandle>` for open handles
- Temp file tracking: Maintain `Set<string>` for temp file paths
- Cleanup order: Sockets → File handles → Temp files
- Cleanup timing: After task draining, before process exit

## References

- Spec: FR-005
- Accomplish: No resource cleanup (intentionally deviated)
- CDR-2026-061: Immediate Close on Shutdown for Daemons