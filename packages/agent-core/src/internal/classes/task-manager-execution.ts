import type { Task, TaskConfig } from '../../common/types/task.js';
import { createConsoleLogger } from '../../utils/logging.js';
import { type AdapterOptions, OpenCodeAdapter } from './open-code-adapter.js';
import type { ManagedTask, QueuedTask, TaskCallbacks } from './task-manager-types.js';
import { setupAdapterEvents } from './task-manager-utils.js';

const log = createConsoleLogger({ prefix: 'TaskManager' });

export function queueTask(
  taskQueue: QueuedTask[],
  taskId: string,
  config: TaskConfig,
  callbacks: TaskCallbacks,
  maxConcurrentTasks: number,
): Task {
  if (taskQueue.length >= maxConcurrentTasks) {
    throw new Error(
      `Maximum queued tasks (${maxConcurrentTasks}) reached. Please wait for tasks to complete.`,
    );
  }

  const queuedTask: QueuedTask = {
    taskId,
    config,
    callbacks,
    createdAt: new Date(),
  };

  taskQueue.push(queuedTask);
  log.info(`[TaskManager] Task ${taskId} queued. Queue length: ${taskQueue.length}`);

  return {
    id: taskId,
    prompt: config.prompt,
    status: 'queued' as const,
    messages: [],
    createdAt: new Date().toISOString(),
  };
}

export async function executeTask(
  adapterOptions: AdapterOptions,
  taskId: string,
  config: TaskConfig,
  callbacks: TaskCallbacks,
  defaultWorkingDirectory: string,
  activeTasks: Map<string, ManagedTask>,
  isFirstTaskRef: { value: boolean },
  onBeforeTaskStart:
    | ((callbacks: TaskCallbacks, isFirstTask: boolean) => Promise<void>)
    | undefined,
  cleanupTask: (taskId: string) => void,
  processQueue: () => void,
): Promise<Task> {
  const adapter = new OpenCodeAdapter(adapterOptions, taskId);

  const cleanup = setupAdapterEvents(adapter, taskId, callbacks, cleanupTask, processQueue);

  const managedTask: ManagedTask = {
    taskId,
    adapter,
    callbacks,
    cleanup,
    createdAt: new Date(),
  };
  activeTasks.set(taskId, managedTask);

  log.info(`[TaskManager] Executing task ${taskId}. Active tasks: ${activeTasks.size}`);

  const task: Task = {
    id: taskId,
    prompt: config.prompt,
    status: 'running' as const,
    messages: [],
    createdAt: new Date().toISOString(),
  };

  const isFirstTask = isFirstTaskRef.value;

  (async () => {
    try {
      callbacks.onProgress({ stage: 'starting', message: 'Starting task...', isFirstTask });

      if (onBeforeTaskStart) {
        await onBeforeTaskStart(callbacks, isFirstTask);
      }

      if (isFirstTaskRef.value) {
        isFirstTaskRef.value = false;
      }

      callbacks.onProgress({
        stage: 'environment',
        message: 'Setting up environment...',
        isFirstTask,
      });

      await adapter.startTask({
        ...config,
        taskId,
        workingDirectory: config.workingDirectory || defaultWorkingDirectory,
      });
    } catch (error) {
      log.error(`[TaskManager] Task startup failed for ${taskId}: ${error}`);
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
      cleanupTask(taskId);
      processQueue();
    }
  })();

  return task;
}
