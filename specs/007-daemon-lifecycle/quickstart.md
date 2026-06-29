# Quick Start: Daemon Lifecycle (MAO-148)

## Overview

Daemon Lifecycle Management provides start/stop/graceful shutdown for background daemon processes that run independently of the host application.

## Key Concepts

### Daemon Process
- Runs as independent process (not child of host app)
- Survives application window close
- Communicates via Unix domain sockets

### Lifecycle States
```
Starting → Running → Draining → Stopped
```

### Graceful Shutdown
- Triggered by SIGTERM signal
- 30-second timeout for task completion
- Drains active tasks, discards queued tasks
- Cleans up all IPC resources

## Usage Examples

### Starting the Daemon
```typescript
import { DaemonProcessManager } from './contracts';

const manager = new DaemonProcessManager();
const pid = await manager.start();
console.log(`Daemon started with PID: ${pid}`);
```

### Stopping the Daemon
```typescript
// Graceful shutdown (30s timeout)
const graceful = await manager.stop();
console.log(`Shutdown graceful: ${graceful}`);

// Force immediate shutdown
await manager.kill();
```

### Checking Daemon Status
```typescript
if (manager.isRunning()) {
  console.log(`Daemon state: ${manager.getState()}`);
}
```

## Configuration

### Default Settings
- **Shutdown Timeout**: 30,000ms (30 seconds)
- **Socket Path**: `/tmp/myboteam-daemon.sock`
- **Auto-restart**: Enabled with exponential backoff

### Custom Configuration
```typescript
const manager = new DaemonProcessManager({
  shutdownTimeout: 60000, // 60 seconds
  socketPath: '/custom/path/socket.sock',
  autoRestart: false
});
```

## Error Handling

### Daemon Fails to Start
```typescript
try {
  await manager.start();
} catch (error) {
  console.error(`Failed to start daemon: ${error.message}`);
  // Host application handles failure
}
```

### Shutdown Timeout
```typescript
const graceful = await manager.stop();
if (!graceful) {
  console.warn('Shutdown timed out, daemon was force-killed');
}
```

## Testing

### Unit Tests
```typescript
describe('Daemon Lifecycle', () => {
  it('should start daemon as independent process', async () => {
    const manager = new DaemonProcessManager();
    const pid = await manager.start();
    expect(pid).toBeGreaterThan(0);
    expect(manager.isRunning()).toBe(true);
  });

  it('should gracefully shutdown within timeout', async () => {
    const manager = new DaemonProcessManager();
    await manager.start();
    const graceful = await manager.stop();
    expect(graceful).toBe(true);
    expect(manager.isRunning()).toBe(false);
  });
});
```

### Integration Tests
- Normal start/stop cycle
- Graceful shutdown with active tasks
- Forced shutdown on timeout
- Crash recovery with auto-restart

## Architecture

### State Machine
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Starting ──▶ Running ──▶ Draining ──▶ Stopped          │
│     │            │            │            │             │
│     │            │            │            │             │
│     ▼            ▼            ▼            ▼             │
│  (error)      (SIGTERM)   (tasks done   (clean)         │
│                          or timeout)                    │
└─────────────────────────────────────────────────────────┘
```

### Resource Cleanup
On shutdown, the daemon cleans up:
- All connected sockets (immediate destroy)
- File handles
- Temp files
- Process resources

## Observability

### Logs
- Structured JSON format
- Levels: DEBUG, INFO, WARN, ERROR
- Context: state transitions, errors, metrics

### Metrics (OpenTelemetry)
- `daemon.uptime` - Time since daemon started
- `daemon.tasks.active` - Currently executing tasks
- `daemon.tasks.completed` - Total completed tasks
- `daemon.tasks.failed` - Total failed tasks
- `daemon.connections.active` - Active IPC connections
- `daemon.errors.total` - Total errors

### Traces
- Task execution spans
- Shutdown lifecycle spans
- Error attribution

## Troubleshooting

### Daemon Won't Start
- Check socket path permissions
- Verify no other daemon is running
- Check for port conflicts

### Shutdown Hangs
- Check for stuck tasks
- Verify timeout configuration
- Review logs for blocking operations

### Resource Leaks
- Monitor open file descriptors
- Check socket cleanup in logs
- Verify temp file removal

## Reference

- **Spec**: `specs/007-daemon-lifecycle/spec.md`
- **Research**: `specs/007-daemon-lifecycle/research.md`
- **Data Model**: `specs/007-daemon-lifecycle/data-model.md`
- **Contracts**: `specs/007-daemon-lifecycle/contracts/`
