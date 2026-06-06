import type { BrowserFramePayload } from '../../common/types/browser-view.js';
import type { OpenCodeMessage } from '../../common/types/opencode.js';
import type { PermissionRequest } from '../../common/types/permission.js';
import type { Task, TaskConfig, TaskMessage, TaskResult } from '../../common/types/task.js';
import type { TodoItem } from '../../common/types/todo.js';
import {
  flushAndCleanupBatcher,
  type ModelContext,
  queueMessage,
  toTaskMessage,
} from '../../opencode/message-processor.js';
import { createConsoleLogger } from '../../utils/logging.js';
import { type AdapterOptions, OpenCodeAdapter } from './open-code-adapter.js';
import type { TaskCallbacks } from './TaskManager.js';

const log = createConsoleLogger({ prefix: 'TaskManager' });

export interface ManagedTask {
  taskId: string;
  adapter: OpenCodeAdapter;
  callbacks: TaskCallbacks;
  cleanup: () => void;
  createdAt: Date;
}

export interface QueuedTask {
  taskId: string;
  config: TaskConfig;
  callbacks: TaskCallbacks;
  createdAt: Date;
}

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

  const useInternalBatching = !!callbacks.onBatchedMessages;
  const batchForward = useInternalBatching
    ? (_channel: string, data: unknown) => {
        const batchData = data as { taskId: string; messages: TaskMessage[] };
        callbacks.onBatchedMessages?.(batchData.messages);
      }
    : undefined;

  const onMessage = (message: OpenCodeMessage) => {
    if (useInternalBatching && batchForward) {
      const modelContext =
        typeof (adapter as { getModelContext?: () => unknown }).getModelContext === 'function'
          ? (adapter as unknown as { getModelContext: () => ModelContext }).getModelContext()
          : undefined;
      const taskMessage = toTaskMessage(message, modelContext);
      if (taskMessage) {
        queueMessage(taskId, taskMessage, batchForward, () => {});
      }
    }
    callbacks.onMessage?.(message);
  };

  const onProgress = (progress: { stage: string; message?: string; modelName?: string }) => {
    callbacks.onProgress(progress);
  };

  const onPermissionRequest = (request: PermissionRequest) => {
    if (useInternalBatching) {
      flushAndCleanupBatcher(taskId);
    }
    callbacks.onPermissionRequest(request);
  };

  const onComplete = (result: TaskResult) => {
    if (useInternalBatching) {
      flushAndCleanupBatcher(taskId);
    }
    callbacks.onComplete(result);
    cleanupTask(taskId);
    processQueue();
  };

  const onError = (error: Error) => {
    if (useInternalBatching) {
      flushAndCleanupBatcher(taskId);
    }
    callbacks.onError(error);
    cleanupTask(taskId);
    processQueue();
  };

  const onDebug = (logData: { type: string; message: string; data?: unknown }) => {
    callbacks.onDebug?.(logData);
  };

  const onTodoUpdate = (todos: TodoItem[]) => {
    callbacks.onTodoUpdate?.(todos);
  };

  const onAuthError = (error: { providerId: string; message: string }) => {
    callbacks.onAuthError?.(error);
  };

  const onBrowserFrame = (data: BrowserFramePayload) => {
    callbacks.onBrowserFrame?.(data);
  };

  const onReasoning = (text: string) => {
    callbacks.onReasoning?.(text);
  };

  const onToolUse = (toolName: string, toolInput: unknown) => {
    callbacks.onToolUse?.(toolName, toolInput);
  };

  const onToolCallComplete = (data: {
    toolName: string;
    toolInput: unknown;
    toolOutput: string;
    sessionId?: string;
  }) => {
    callbacks.onToolCallComplete?.(data);
  };

  const onStepFinish = (data: {
    reason: string;
    model?: string;
    tokens?: {
      input: number;
      output: number;
      reasoning: number;
      cache?: { read: number; write: number };
    };
    cost?: number;
  }) => {
    callbacks.onStepFinish?.(data);
  };

  adapter.on('message', onMessage);
  adapter.on('progress', onProgress);
  adapter.on('permission-request', onPermissionRequest);
  adapter.on('complete', onComplete);
  adapter.on('error', onError);
  adapter.on('debug', onDebug);
  adapter.on('todo:update', onTodoUpdate);
  adapter.on('auth-error', onAuthError);
  adapter.on('reasoning', onReasoning);
  adapter.on('tool-use', onToolUse);
  adapter.on('tool-call-complete', onToolCallComplete);
  adapter.on('step-finish', onStepFinish);
  adapter.on('browser-frame', onBrowserFrame);

  const cleanup = () => {
    adapter.off('message', onMessage);
    adapter.off('progress', onProgress);
    adapter.off('permission-request', onPermissionRequest);
    adapter.off('complete', onComplete);
    adapter.off('error', onError);
    adapter.off('debug', onDebug);
    adapter.off('todo:update', onTodoUpdate);
    adapter.off('auth-error', onAuthError);
    adapter.off('reasoning', onReasoning);
    adapter.off('tool-use', onToolUse);
    adapter.off('tool-call-complete', onToolCallComplete);
    adapter.off('step-finish', onStepFinish);
    adapter.off('browser-frame', onBrowserFrame);
    adapter.dispose();
  };

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
