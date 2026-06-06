import { flushAndCleanupBatcher } from '../../opencode/message-processor.js';
import { stopAzureFoundryProxy } from '../../opencode/proxies/azure-foundry-proxy.js';
import { stopMoonshotProxy } from '../../opencode/proxies/moonshot-proxy.js';
import { createConsoleLogger } from '../../utils/logging.js';
import type { ManagedTask, QueuedTask } from './task-manager-execution.js';

const log = createConsoleLogger({ prefix: 'TaskManager' });

export async function cancelTask(
  taskId: string,
  taskQueue: QueuedTask[],
  activeTasks: Map<string, ManagedTask>,
  cleanupTask: (taskId: string) => void,
  processQueue: () => void,
): Promise<void> {
  const queueIndex = taskQueue.findIndex((q) => q.taskId === taskId);
  if (queueIndex !== -1) {
    log.info(`[TaskManager] Cancelling queued task ${taskId}`);
    taskQueue.splice(queueIndex, 1);
    return;
  }

  const managedTask = activeTasks.get(taskId);
  if (!managedTask) {
    log.warn(`[TaskManager] Task ${taskId} not found for cancellation`);
    return;
  }

  log.info(`[TaskManager] Cancelling running task ${taskId}`);

  try {
    await managedTask.adapter.cancelTask();
  } finally {
    cleanupTask(taskId);
    processQueue();
  }
}

export async function interruptTask(
  taskId: string,
  activeTasks: Map<string, ManagedTask>,
): Promise<void> {
  const managedTask = activeTasks.get(taskId);
  if (!managedTask) {
    log.warn(`[TaskManager] Task ${taskId} not found for interruption`);
    return;
  }

  log.info(`[TaskManager] Interrupting task ${taskId}`);
  await managedTask.adapter.interruptTask();
}

export function cancelQueuedTask(taskId: string, taskQueue: QueuedTask[]): boolean {
  const queueIndex = taskQueue.findIndex((q) => q.taskId === taskId);
  if (queueIndex === -1) {
    return false;
  }

  log.info(`[TaskManager] Removing task ${taskId} from queue`);
  taskQueue.splice(queueIndex, 1);
  return true;
}

export function cleanupTask(taskId: string, activeTasks: Map<string, ManagedTask>): void {
  const managedTask = activeTasks.get(taskId);
  if (managedTask) {
    log.info(`[TaskManager] Cleaning up task ${taskId}`);
    managedTask.cleanup();
    activeTasks.delete(taskId);
    log.info(`[TaskManager] Task ${taskId} cleaned up. Active tasks: ${activeTasks.size}`);
  }
}

export async function processQueue(
  taskQueue: QueuedTask[],
  activeTasks: Map<string, ManagedTask>,
  maxConcurrentTasks: number,
  executeTaskFn: (
    taskId: string,
    config: import('../../common/types/task.js').TaskConfig,
    callbacks: import('./TaskManager.js').TaskCallbacks,
  ) => Promise<import('../../common/types/task.js').Task>,
): Promise<void> {
  while (taskQueue.length > 0 && activeTasks.size < maxConcurrentTasks) {
    const nextTask = taskQueue.shift()!;
    log.info(
      `[TaskManager] Processing queue. Starting task ${nextTask.taskId}. Active: ${activeTasks.size}, Remaining in queue: ${taskQueue.length}`,
    );

    nextTask.callbacks.onStatusChange?.('running');

    try {
      await executeTaskFn(nextTask.taskId, nextTask.config, nextTask.callbacks);
    } catch (error) {
      log.error(`[TaskManager] Error starting queued task ${nextTask.taskId}: ${error}`);
      nextTask.callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  if (taskQueue.length === 0) {
    log.info('[TaskManager] Queue empty, no more tasks to process');
  }
}

export function cancelAllTasks(
  taskQueue: QueuedTask[],
  activeTasks: Map<string, ManagedTask>,
  cancelTaskFn: (taskId: string) => Promise<void>,
): void {
  log.info(`[TaskManager] Cancelling all ${activeTasks.size} active tasks`);

  taskQueue.length = 0;

  for (const [taskId] of activeTasks) {
    cancelTaskFn(taskId).catch((err) => {
      log.error(`[TaskManager] Error cancelling task ${taskId}: ${err}`);
    });
  }
}

export function dispose(taskQueue: QueuedTask[], activeTasks: Map<string, ManagedTask>): void {
  log.info(
    `[TaskManager] Disposing all tasks (${activeTasks.size} active, ${taskQueue.length} queued)`,
  );

  taskQueue.length = 0;

  for (const [taskId, managedTask] of activeTasks) {
    try {
      flushAndCleanupBatcher(taskId);
      managedTask.cleanup();
    } catch (error) {
      log.error(`[TaskManager] Error cleaning up task ${taskId}: ${error}`);
    }
  }

  activeTasks.clear();

  stopAzureFoundryProxy().catch((err) => {
    log.error(`[TaskManager] Failed to stop Azure Foundry proxy: ${err}`);
  });
  stopMoonshotProxy().catch((err) => {
    log.error(`[TaskManager] Failed to stop Moonshot proxy: ${err}`);
  });

  log.info('[TaskManager] All tasks disposed');
}
