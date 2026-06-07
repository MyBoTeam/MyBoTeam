import { createConsoleLogger } from '../../utils/logging.js';
import type { ManagedTask, QueuedTask } from './task-manager-types.js';

const log = createConsoleLogger({ prefix: 'TaskManager' });

export async function processQueue(
  taskQueue: QueuedTask[],
  activeTasks: Map<string, ManagedTask>,
  maxConcurrentTasks: number,
  executeTaskFn: (
    taskId: string,
    config: import('../../common/types/task.js').TaskConfig,
    callbacks: import('./task-manager-types.js').TaskCallbacks,
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
