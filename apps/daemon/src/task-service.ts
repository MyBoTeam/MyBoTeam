import { EventEmitter } from 'node:events';
import { homedir, tmpdir } from 'node:os';
import {
  createMessageId,
  createTaskId,
  createTaskManager,
  getModelDisplayName,
  type PermissionResponse,
  type StorageAPI,
  type Task,
  type TaskSource,
  type TaskStatus,
} from '@myboteam/agent-core';
import { OpenCodeServerManager } from './opencode/server-manager.js';
import {
  createOnBeforeTaskStart,
  isCliAvailable,
  onBeforeStart,
  type TaskConfigBuilderOptions,
} from './task-config-builder.js';
import type {
  ResumeSessionParams,
  StartTaskParams,
  TaskServiceOptions,
} from './task-service-events.js';
import { buildStartTaskConfig, executeTask, runPostTaskSetup } from './task-service-execution.js';
import {
  disposeTaskService,
  getActiveTaskCountFromManager,
  getActiveTaskIdFromManager,
  getTaskSourceFromMap,
  getTaskStatusFromStorage,
  hasActiveTaskInManager,
  listTasksFromStorage,
  sendResponseViaManager,
} from './task-service-utils.js';

export type { ResumeSessionParams, StartTaskParams, TaskServiceOptions };

export class TaskService extends EventEmitter {
  private taskManager: ReturnType<typeof createTaskManager>;
  private storage: StorageAPI;
  private opts: TaskConfigBuilderOptions;
  private rpcConnectivityProbe: { hasConnectedClients(): boolean };
  private serverManager: OpenCodeServerManager;
  private taskSources = new Map<string, TaskSource>();
  constructor(storage: StorageAPI, options: TaskServiceOptions) {
    super();
    this.storage = storage;
    this.opts = {
      ...options,
      isPackaged: options.isPackaged ?? false,
      resourcesPath: options.resourcesPath ?? '',
      appPath: options.appPath ?? '',
      myboteamRuntime: options.myboteamRuntime,
    };
    this.rpcConnectivityProbe = options.rpcConnectivityProbe ?? { hasConnectedClients: () => true };
    this.on('complete', (data: { taskId: string }) => {
      this.taskSources.delete(data.taskId);
      this.serverManager.scheduleTaskRuntimeCleanup(data.taskId);
    });
    this.on('error', (data: { taskId: string }) => {
      this.taskSources.delete(data.taskId);
      this.serverManager.scheduleTaskRuntimeCleanup(data.taskId);
    });
    this.on('statusChange', (data: { taskId: string; status: string }) => {
      if (data.status === 'cancelled') {
        this.taskSources.delete(data.taskId);
        this.serverManager.scheduleTaskRuntimeCleanup(data.taskId);
      }
    });
    this.serverManager = new OpenCodeServerManager({
      storage,
      userDataPath: this.opts.userDataPath,
      mcpToolsPath: this.opts.mcpToolsPath,
      isPackaged: this.opts.isPackaged,
      resourcesPath: this.opts.resourcesPath,
      appPath: this.opts.appPath,
      myboteamRuntime: this.opts.myboteamRuntime,
    });
    this.taskManager = createTaskManager({
      adapterOptions: {
        platform: process.platform,
        isPackaged: this.opts.isPackaged,
        tempPath: tmpdir(),
        onBeforeStart: async (ctx) => {
          const result = await onBeforeStart(this.storage, this.opts, ctx);
          return {
            env: result.env,
            ...(result.workspaceInstructions
              ? { workspaceInstructions: result.workspaceInstructions }
              : {}),
          };
        },
        getServerUrl: async (taskId, ctx) => {
          await this.serverManager.ensureTaskRuntime(taskId, ctx);
          return this.serverManager.waitForServerUrl(taskId);
        },
        getModelDisplayName,
        setProxyTaskId: options.setProxyTaskId,
      },
      defaultWorkingDirectory: homedir(),
      maxConcurrentTasks: 10,
      isCliAvailable: () => isCliAvailable(this.opts),
      onBeforeTaskStart: createOnBeforeTaskStart(this.opts),
    });
  }
  async startTask(params: StartTaskParams): Promise<Task> {
    const { taskId, validatedConfig, initialUserMessage } = buildStartTaskConfig(
      params,
      this.storage,
    );
    this.taskSources.set(taskId, validatedConfig.source ?? 'ui');
    const task = await executeTask(taskId, validatedConfig, this.taskManager, this.storage, this, {
      rpc: this.rpcConnectivityProbe,
      getTaskSource: (id) => this.getTaskSource(id),
      sendPermissionResponse: (id, response) => this.sendResponse(id, response),
    });
    runPostTaskSetup(
      task,
      taskId,
      validatedConfig,
      initialUserMessage,
      this.storage,
      params.workspaceId,
      (summary) => this.emit('summary', { taskId, summary }),
    );
    return task;
  }
  async stopTask(params: { taskId: string }): Promise<void> {
    const { taskId } = params;
    const completedAt = new Date().toISOString();
    if (this.taskManager.isTaskQueued(taskId)) {
      this.taskManager.cancelQueuedTask(taskId);
      this.storage.updateTaskStatus(taskId, 'cancelled', completedAt);
      this.emit('statusChange', { taskId, status: 'cancelled', completedAt });
      return;
    }
    if (this.taskManager.hasActiveTask(taskId)) {
      await this.taskManager.cancelTask(taskId);
      this.storage.updateTaskStatus(taskId, 'cancelled', completedAt);
      this.emit('statusChange', { taskId, status: 'cancelled', completedAt });
    }
  }
  async interruptTask(params: { taskId: string }): Promise<void> {
    const { taskId } = params;
    if (this.taskManager.hasActiveTask(taskId)) {
      await this.taskManager.interruptTask(taskId);
    }
  }
  async resumeSession(params: ResumeSessionParams): Promise<Task> {
    const { sessionId, prompt, existingTaskId, attachments } = params;
    const taskId = existingTaskId || createTaskId();
    if (existingTaskId) {
      const userMessage = {
        id: createMessageId(),
        type: 'user' as const,
        content: prompt,
        timestamp: new Date().toISOString(),
      };
      this.storage.addTaskMessage(existingTaskId, userMessage);
    }
    const activeModel = this.storage.getActiveProviderModel();
    const selectedModel = activeModel || this.storage.getSelectedModel();
    let workspaceId = params.workspaceId;
    if (!workspaceId && existingTaskId) {
      workspaceId = this.storage.getTask(existingTaskId)?.workspaceId;
    }
    const task = await executeTask(
      taskId,
      { prompt, sessionId, taskId, modelId: selectedModel?.model, files: attachments, workspaceId },
      this.taskManager,
      this.storage,
      this,
      {
        rpc: this.rpcConnectivityProbe,
        getTaskSource: (id) => this.getTaskSource(id),
        sendPermissionResponse: (id, response) => this.sendResponse(id, response),
      },
    );
    if (existingTaskId) {
      this.storage.updateTaskStatus(existingTaskId, task.status, new Date().toISOString());
    }
    return task;
  }
  listTasks = (workspaceId?: string, includeUnassigned = false): Task[] =>
    listTasksFromStorage(this.storage, workspaceId, includeUnassigned);
  getTaskStatus = (params: {
    taskId: string;
  }): { taskId: string; status: TaskStatus; prompt: string; createdAt: string } | null =>
    getTaskStatusFromStorage(this.storage, params.taskId);
  getActiveTaskId = (): string | null => getActiveTaskIdFromManager(this.taskManager);
  hasActiveTask = (taskId: string): boolean => hasActiveTaskInManager(this.taskManager, taskId);
  getActiveTaskCount = (): number => getActiveTaskCountFromManager(this.taskManager);
  sendResponse = async (taskId: string, response: PermissionResponse): Promise<void> =>
    sendResponseViaManager(this.taskManager, taskId, response);
  getTaskSource = (taskId: string): TaskSource => getTaskSourceFromMap(this.taskSources, taskId);
  dispose = (): void => disposeTaskService(this.serverManager, this.taskManager);
}
