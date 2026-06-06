import type { BrowserFramePayload } from '../../common/types/browser-view.js';
import type { OpenCodeMessage } from '../../common/types/opencode.js';
import type { PermissionResponse } from '../../common/types/permission.js';
import type {
  Task,
  TaskConfig,
  TaskMessage,
  TaskResult,
  TaskStatus,
} from '../../common/types/task.js';
import type { TodoItem } from '../../common/types/todo.js';
import { createConsoleLogger } from '../../utils/logging.js';
import type { AdapterOptions } from './adapter-types.js';
import { type OpenCodeAdapter, OpenCodeCliNotFoundError } from './open-code-adapter.js';
import {
  executeTask,
  type ManagedTask,
  type QueuedTask,
  queueTask,
} from './task-manager-execution.js';
import {
  cancelAllTasks as lifecycleCancelAllTasks,
  cancelQueuedTask as lifecycleCancelQueuedTask,
  cancelTask as lifecycleCancelTask,
  cleanupTask as lifecycleCleanupTask,
  dispose as lifecycleDispose,
  interruptTask as lifecycleInterruptTask,
  processQueue as lifecycleProcessQueue,
} from './task-manager-lifecycle.js';

const log = createConsoleLogger({ prefix: 'TaskManager' });

export interface TaskProgressEvent {
  stage: string;
  message?: string;
  isFirstTask?: boolean;
  modelName?: string;
}

export interface TaskCallbacks {
  onMessage?: (message: OpenCodeMessage) => void;
  onBatchedMessages?: (messages: TaskMessage[]) => void;
  onProgress: (progress: TaskProgressEvent) => void;
  onPermissionRequest: (
    request: import('../../common/types/permission.js').PermissionRequest,
  ) => void;
  onComplete: (result: TaskResult) => void;
  onError: (error: Error) => void;
  onStatusChange?: (status: TaskStatus) => void;
  onDebug?: (log: { type: string; message: string; data?: unknown }) => void;
  onTodoUpdate?: (todos: TodoItem[]) => void;
  onAuthError?: (error: { providerId: string; message: string }) => void;
  onBrowserFrame?: (data: BrowserFramePayload) => void;
  onReasoning?: (text: string) => void;
  onToolUse?: (toolName: string, toolInput: unknown) => void;
  onToolCallComplete?: (data: {
    toolName: string;
    toolInput: unknown;
    toolOutput: string;
    sessionId?: string;
  }) => void;
  onStepFinish?: (data: {
    reason: string;
    model?: string;
    tokens?: {
      input: number;
      output: number;
      reasoning: number;
      cache?: { read: number; write: number };
    };
    cost?: number;
  }) => void;
}

export interface TaskManagerOptions {
  adapterOptions: AdapterOptions;
  defaultWorkingDirectory: string;
  maxConcurrentTasks?: number;
  isCliAvailable: () => Promise<boolean>;
  onBeforeTaskStart?: (callbacks: TaskCallbacks, isFirstTask: boolean) => Promise<void>;
}

const DEFAULT_MAX_CONCURRENT_TASKS = 10;

export class TaskManager {
  private activeTasks: Map<string, ManagedTask> = new Map();
  private taskQueue: QueuedTask[] = [];
  private maxConcurrentTasks: number;
  private options: TaskManagerOptions;
  private isFirstTaskRef: { value: boolean } = { value: true };

  constructor(options: TaskManagerOptions) {
    this.options = options;
    this.maxConcurrentTasks = options.maxConcurrentTasks ?? DEFAULT_MAX_CONCURRENT_TASKS;
  }

  getIsFirstTask(): boolean {
    return this.isFirstTaskRef.value;
  }

  async startTask(taskId: string, config: TaskConfig, callbacks: TaskCallbacks): Promise<Task> {
    const cliInstalled = await this.options.isCliAvailable();
    if (!cliInstalled) {
      throw new OpenCodeCliNotFoundError();
    }

    if (this.activeTasks.has(taskId) || this.taskQueue.some((q) => q.taskId === taskId)) {
      throw new Error(`Task ${taskId} is already running or queued`);
    }

    if (this.activeTasks.size >= this.maxConcurrentTasks) {
      log.info(
        `[TaskManager] At max concurrent tasks (${this.maxConcurrentTasks}). Queueing task ${taskId}`,
      );
      return queueTask(this.taskQueue, taskId, config, callbacks, this.maxConcurrentTasks);
    }

    return this.executeTaskInternal(taskId, config, callbacks);
  }

  private executeTaskInternal(
    taskId: string,
    config: TaskConfig,
    callbacks: TaskCallbacks,
  ): Promise<Task> {
    return executeTask(
      this.options.adapterOptions,
      taskId,
      config,
      callbacks,
      this.options.defaultWorkingDirectory,
      this.activeTasks,
      this.isFirstTaskRef,
      this.options.onBeforeTaskStart,
      (id) => lifecycleCleanupTask(id, this.activeTasks),
      () => this.processQueueInternal(),
    );
  }

  private processQueueInternal(): void {
    lifecycleProcessQueue(
      this.taskQueue,
      this.activeTasks,
      this.maxConcurrentTasks,
      (taskId, config, callbacks) => this.executeTaskInternal(taskId, config, callbacks),
    );
  }

  async cancelTask(taskId: string): Promise<void> {
    return lifecycleCancelTask(
      taskId,
      this.taskQueue,
      this.activeTasks,
      (id) => lifecycleCleanupTask(id, this.activeTasks),
      () => this.processQueueInternal(),
    );
  }

  async interruptTask(taskId: string): Promise<void> {
    return lifecycleInterruptTask(taskId, this.activeTasks);
  }

  cancelQueuedTask(taskId: string): boolean {
    return lifecycleCancelQueuedTask(taskId, this.taskQueue);
  }

  async sendResponse(taskId: string, response: PermissionResponse): Promise<void> {
    const managedTask = this.activeTasks.get(taskId);
    if (!managedTask) {
      throw new Error(`Task ${taskId} not found or not active`);
    }

    await managedTask.adapter.sendResponse(response);
  }

  getSessionId(taskId: string): string | null {
    const managedTask = this.activeTasks.get(taskId);
    return managedTask?.adapter.getSessionId() ?? null;
  }

  isTaskRunning(taskId: string): boolean {
    const managedTask = this.activeTasks.get(taskId);
    return managedTask?.adapter.running ?? false;
  }

  getTask(taskId: string): OpenCodeAdapter | undefined {
    return this.activeTasks.get(taskId)?.adapter;
  }

  hasActiveTask(taskId: string): boolean {
    return this.activeTasks.has(taskId);
  }

  hasRunningTask(): boolean {
    return this.activeTasks.size > 0;
  }

  isTaskQueued(taskId: string): boolean {
    return this.taskQueue.some((q) => q.taskId === taskId);
  }

  getQueueLength(): number {
    return this.taskQueue.length;
  }

  get runningTaskCount(): number {
    return this.activeTasks.size;
  }

  getActiveTaskIds(): string[] {
    return Array.from(this.activeTasks.keys());
  }

  getActiveTaskId(): string | null {
    const firstActive = this.activeTasks.keys().next();
    return firstActive.done ? null : firstActive.value;
  }

  getActiveTaskCount(): number {
    return this.activeTasks.size;
  }

  cancelAllTasks(): void {
    lifecycleCancelAllTasks(this.taskQueue, this.activeTasks, (taskId) => this.cancelTask(taskId));
  }

  dispose(): void {
    lifecycleDispose(this.taskQueue, this.activeTasks);
  }
}

export function createTaskManager(options: TaskManagerOptions): TaskManager {
  return new TaskManager(options);
}
