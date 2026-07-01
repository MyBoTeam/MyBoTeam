import { listTasks, updateTask } from '@myboteam/agent-core';
import { createAgentTracker, createChildLogger } from '@myboteam/agent-core/daemon';
import type Database from 'better-sqlite3';

const log = createChildLogger('daemon');

const DRAIN_POLL_INTERVAL_MS = 1000;

/**
 * FR-003/FR-004: Mark all stale running tasks as failed after a crash.
 */
export function markStaleTasksAsFailed(db: Database.Database): void {
  const logger = createChildLogger('crash-recovery');

  const runningTasks = listTasks(db, logger, { status: 'running' });

  if (runningTasks.length === 0) {
    return;
  }

  const tx = db.transaction(() => {
    for (const task of runningTasks) {
      logger.warn(`Crash recovery: marking stale task ${task.id} as failed`);
      updateTask(db, logger, task.id, { status: 'failed' });
    }
  });
  tx();

  logger.warn(`Crash recovery: marked ${runningTasks.length} stale task(s) as failed`);
}

/**
 * FR-008/FR-009: Drain active tasks with polling, then force-stop on timeout.
 * G5: Ensures agent cleanup completes before process.exit().
 *
 * Known behavior: poll interval is 1s, so worst-case response to task
 * completion is ~1s delay before early exit. Acceptable for M3 scope.
 */
export function performDrain(
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
      log.info('All tasks completed, shutting down');
      cleanup();
      gracefulExit(agentTracker, lockHandle);
      return;
    }

    if (Date.now() >= deadline) {
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

  const onSignal = () => {
    cleanup();
    gracefulExit(agentTracker, lockHandle);
  };
  process.on('SIGTERM', onSignal);
  process.on('SIGINT', onSignal);
}

/**
 * G5: Perform cleanup and exit. Ensures agent processes are terminated
 * before releasing the lock and exiting.
 */
function gracefulExit(
  agentTracker: ReturnType<typeof createAgentTracker>,
  lockHandle: { release: () => void },
): void {
  agentTracker.cleanupProcesses();
  lockHandle.release();
  log.info('Daemon shutdown complete');
  process.exit(0);
}
