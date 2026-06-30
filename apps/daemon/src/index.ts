import {
  acquirePidLock,
  createAgentTracker,
  createChildLogger,
  DaemonRpcServer,
  detectStaleLock,
  listTasks,
  removeStaleLock,
  updateTask,
} from '@myboteam/agent-core';
import type Database from 'better-sqlite3';
import { getDataDirectory } from './data-directory.js';
import { createScheduler } from './scheduler.js';
import { createShutdownManager } from './shutdown-manager.js';

const log = createChildLogger('daemon');

const DRAIN_POLL_INTERVAL_MS = 1000;

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
  rpc.registerMethod('daemon.shutdown', (params: { timeoutMs?: number }) => {
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

    const drainTimeout = params?.timeoutMs || shutdownManager.getDrainTimeout();
    log.info(`Shutdown initiated, draining for up to ${drainTimeout}ms`);

    // G2/G5: Drain loop with proper cleanup
    performDrain(db, agentTracker, lockHandle, drainTimeout);

    return { success: true, drainTimeout };
  });

  // FR-007: Register task submission with shutdown rejection.
  // Note: Actual task submission logic is delegated to the caller.
  // This method only handles shutdown-state rejection per FR-007.
  rpc.registerMethod('task.submit', (params: { agent_id: string; title: string }) => {
    if (!params?.agent_id || !params?.title) {
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

/**
 * FR-003/FR-004: Mark all stale running tasks as failed after a crash.
 */
export function markStaleTasksAsFailed(db: Database.Database): void {
  const logger = createChildLogger('crash-recovery');

  const runningTasks = listTasks(db, logger, { status: 'running' });

  for (const task of runningTasks) {
    logger.warn(`Crash recovery: marking stale task ${task.id} as failed`);
    updateTask(db, logger, task.id, { status: 'failed' });
  }

  if (runningTasks.length > 0) {
    logger.warn(`Crash recovery: marked ${runningTasks.length} stale task(s) as failed`);
  }
}

/**
 * FR-008/FR-009: Drain active tasks with polling, then force-stop on timeout.
 * G5: Ensures agent cleanup completes before process.exit().
 *
 * Known behavior: poll interval is 1s, so worst-case response to task
 * completion is ~1s delay before early exit. Acceptable for M3 scope.
 */
function performDrain(
  db: Database.Database,
  agentTracker: ReturnType<typeof createAgentTracker>,
  lockHandle: { release: () => void },
  drainTimeoutMs: number,
): void {
  const deadline = Date.now() + drainTimeoutMs;

  const cleanup = () => {
    clearInterval(checkInterval);
    process.removeListener('SIGTERM', cleanup);
    process.removeListener('SIGINT', cleanup);
  };

  const checkInterval = setInterval(() => {
    const runningTasks = listTasks(db, log, { status: 'running' });

    if (runningTasks.length === 0) {
      // FR-008: All tasks completed — exit early
      log.info('All tasks completed, shutting down');
      cleanup();
      gracefulExit(agentTracker, lockHandle);
      return;
    }

    if (Date.now() >= deadline) {
      // FR-009: Drain timeout reached — force-stop remaining tasks
      log.warn(`Drain timeout reached with ${runningTasks.length} task(s) still running`);

      for (const task of runningTasks) {
        log.warn(`Force-stopping stale task ${task.id}`);
        updateTask(db, log, task.id, { status: 'failed' });
      }

      cleanup();
      gracefulExit(agentTracker, lockHandle);
      return;
    }

    log.info(`Draining: ${runningTasks.length} task(s) still running`);
  }, DRAIN_POLL_INTERVAL_MS);

  // Ensure interval is cleaned up on external signals
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
}

/**
 * G5: Perform cleanup and exit. Ensures agent processes are terminated
 * before releasing the lock and exiting.
 */
function gracefulExit(
  agentTracker: ReturnType<typeof createAgentTracker>,
  lockHandle: { release: () => void },
): void {
  // FR-011: Cleanup agent processes
  agentTracker.cleanupProcesses();

  // FR-010: Release lock file
  lockHandle.release();

  log.info('Daemon shutdown complete');
  process.exit(0);
}
