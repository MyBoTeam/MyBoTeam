import {
  acquirePidLock,
  createAgentTracker,
  createChildLogger,
  createShutdownManager,
  DaemonRpcServer,
  detectStaleLock,
  removeStaleLock,
} from '@myboteam/agent-core/daemon';
import type Database from 'better-sqlite3';
import { markStaleTasksAsFailed, performDrain } from './crash-recovery.js';
import { getDataDirectory } from './data-directory.js';
import { createScheduler } from './scheduler.js';

const log = createChildLogger('daemon');

export async function startDaemon(db: Database.Database, dataDir?: string): Promise<void> {
  const resolvedDataDir = dataDir || getDataDirectory();

  log.info('Starting daemon...');

  // 1. Check for stale lock from crashed daemon
  if (detectStaleLock(resolvedDataDir)) {
    log.warn('Stale lock detected from previous daemon instance');
    removeStaleLock(resolvedDataDir);

    // FR-003: Mark stale running tasks as failed after crash recovery
    markStaleTasksAsFailed(db);
  }

  // 2. Acquire lock (synchronous — blocks event loop; acceptable for M3 scope.
  //    SC-001 target is <100ms; on slow filesystems this may exceed target.
  //    Future optimization: async lock acquisition with retry.)
  const lockHandle = acquirePidLock(resolvedDataDir);
  log.info(`Acquired daemon lock at ${lockHandle.pidPath}`);

  // 3. Initialize shutdown manager, scheduler, and agent tracker
  const shutdownManager = createShutdownManager();
  const scheduler = createScheduler();
  const agentTracker = createAgentTracker(resolvedDataDir);

  // 4. Initialize RPC server
  const rpc = new DaemonRpcServer();

  // FR-005: Register daemon.shutdown RPC method
  rpc.registerMethod('daemon.shutdown', (params: unknown) => {
    const { isShuttingDown } = shutdownManager.getState();
    if (isShuttingDown) {
      // FR-012: Idempotent shutdown handling
      return { success: true, message: 'Shutdown already in progress' };
    }

    const initiated = shutdownManager.initiateShutdown();
    if (!initiated) {
      return { success: true, message: 'Shutdown already in progress' };
    }

    // FR-006: Stop scheduler immediately
    scheduler.stop();

    const raw = (params || {}) as { timeoutMs?: unknown };
    let drainTimeout: number;
    if (raw.timeoutMs !== undefined && raw.timeoutMs !== null) {
      if (
        typeof raw.timeoutMs !== 'number' ||
        !Number.isFinite(raw.timeoutMs) ||
        raw.timeoutMs < 0
      ) {
        return { success: false, error: 'Invalid timeoutMs: must be a finite non-negative number' };
      }
      drainTimeout = raw.timeoutMs;
    } else {
      drainTimeout = shutdownManager.getDrainTimeout();
    }
    log.info(`Shutdown initiated, draining for up to ${drainTimeout}ms`);

    // G2/G5: Drain loop with proper cleanup
    performDrain(db, agentTracker, lockHandle, drainTimeout);

    return { success: true, drainTimeout };
  });

  // FR-007: Register task submission with shutdown rejection.
  // Note: Actual task submission logic is delegated to the caller.
  // This method only handles shutdown-state rejection per FR-007.
  rpc.registerMethod('task.submit', (params: unknown) => {
    const { agent_id, title } = (params || {}) as { agent_id?: string; title?: string };
    if (!agent_id || !title) {
      return { success: false, error: 'Missing required params: agent_id, title' };
    }

    const { isShuttingDown } = shutdownManager.getState();
    if (isShuttingDown) {
      return { success: false, error: 'Daemon is shutting down, new tasks are rejected' };
    }
    // Task submission logic delegated to caller
    return { success: true, message: 'Task submitted' };
  });

  // Register daemon.getShutdownStatus RPC method
  rpc.registerMethod('daemon.getShutdownStatus', () => {
    const state = shutdownManager.getState();
    return {
      isShuttingDown: state.isShuttingDown,
      shutdownStartTime: state.shutdownStartTime?.toISOString() || null,
      drainTimeoutMs: state.drainTimeoutMs,
    };
  });

  // 5. Start RPC server
  await rpc.start();
  log.info('RPC server started');

  log.info('Daemon started successfully');
}
