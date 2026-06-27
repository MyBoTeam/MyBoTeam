# Quickstart: PID Lock Manager

## Prerequisites

- Node.js 20+ installed
- `packages/agent-core` package available (from pnpm workspace)
- Data directory initialized (by M2-5 Data Directory Manager)

## Usage

### Acquire a PID Lock

```typescript
import { acquirePidLock, PidLockError } from '@myboteam/agent-core/daemon';

try {
  const handle = acquirePidLock('/path/to/data/dir');
  console.log(`Lock acquired at ${handle.pidPath}`);

  // ... daemon work ...

  handle.release(); // Clean up on shutdown
} catch (err) {
  if (err instanceof PidLockError) {
    console.error(`Daemon already running (PID: ${err.existingPid})`);
    process.exit(1);
  }
  throw err;
}
```

### Graceful Shutdown

```typescript
import { acquirePidLock } from '@myboteam/agent-core/daemon';

const handle = acquirePidLock(dataDir);

process.on('SIGINT', () => {
  handle.release();
  process.exit(0);
});

process.on('SIGTERM', () => {
  handle.release();
  process.exit(0);
});
```

### Agent PID Tracking

```typescript
import { saveAgentPids, cleanupAgentProcesses } from '@myboteam/agent-core/daemon';

// Save agent child PIDs before shutdown
saveAgentPids(dataDir, [agent1.pid, agent2.pid]);

// On startup, clean up any orphaned agents from previous session
const cleaned = cleanupAgentProcesses(dataDir);
console.log(`Cleaned up ${cleaned} orphaned agent processes`);
```

## Testing

```bash
# Run unit tests
pnpm --filter @myboteam/agent-core test -- --filter pid-lock

# Run integration tests
pnpm --filter @myboteam/agent-core test:integration -- --filter pid-lock
```

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| No existing PID file | Creates new lock |
| Existing PID file, process alive | Throws `PidLockError(existingPid)` |
| Existing PID file, process dead | Removes stale lock, creates new lock |
| Empty/corrupted PID file | Treats as stale, removes and creates new lock |
| PID file directory missing | Throws error indicating data dir not initialized |
| Two daemons start simultaneously | `linkSync` ensures only one succeeds |
| Release called multiple times | Idempotent — no error |
| Agent PID refers to dead process | Skipped without error during cleanup |
