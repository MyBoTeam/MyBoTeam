import type { EventEmitter } from 'node:events';
import {
  createMessageId,
  createTaskId,
  type FileAttachmentInfo,
  type StorageAPI,
  type Task,
  type TaskCallbacks,
  type TaskConfig,
  type TaskManagerAPI,
  type TaskMessage,
  type TaskSource,
  validateTaskConfig,
} from '@myboteam/agent-core';
import { createTaskCallbacks, type TaskCallbackExtras } from './task-callbacks.js';
import { runTaskSummaryGeneration } from './task-config-builder.js';

export interface StartTaskParams {
  prompt: string;
  taskId?: string;
  modelId?: string;
  sessionId?: string;
  workingDirectory?: string;
  workspaceId?: string;
  systemPromptAppend?: string;
  attachments?: FileAttachmentInfo[];
  source?: TaskSource;
  allowedTools?: string[];
  outputSchema?: object;
}

interface ResumeSessionParams {
  sessionId: string;
  prompt: string;
  existingTaskId?: string;
  attachments?: FileAttachmentInfo[];
  workspaceId?: string;
}

export function buildStartTaskConfig(
  params: StartTaskParams,
  storage: StorageAPI,
): { taskId: string; validatedConfig: TaskConfig; initialUserMessage: TaskMessage } {
  const taskId = params.taskId || createTaskId();
  const config: TaskConfig = {
    prompt: params.prompt,
    taskId,
    modelId: params.modelId,
    sessionId: params.sessionId,
    workingDirectory: params.workingDirectory,
    workspaceId: params.workspaceId,
    systemPromptAppend: params.systemPromptAppend,
    files: params.attachments,
    allowedTools: params.allowedTools,
    outputSchema: params.outputSchema,
    source: params.source,
  };
  const validatedConfig = validateTaskConfig(config);
  const activeModel = storage.getActiveProviderModel();
  const selectedModel = activeModel || storage.getSelectedModel();
  if (selectedModel?.model && !validatedConfig.modelId) {
    validatedConfig.modelId = selectedModel.model;
  }
  if (selectedModel?.provider && !validatedConfig.provider) {
    validatedConfig.provider = selectedModel.provider;
  }

  const initialUserMessage: TaskMessage = {
    id: createMessageId(),
    type: 'user',
    content: validatedConfig.prompt,
    timestamp: new Date().toISOString(),
  };

  return { taskId, validatedConfig, initialUserMessage };
}

export async function executeTask(
  taskId: string,
  config: TaskConfig,
  taskManager: TaskManagerAPI,
  storage: StorageAPI,
  emitter: EventEmitter,
  extras: TaskCallbackExtras,
): Promise<Task> {
  const callbacks: TaskCallbacks = createTaskCallbacks(
    taskId,
    emitter,
    storage,
    taskManager,
    extras,
  );
  return taskManager.startTask(taskId, config, callbacks);
}

export function runPostTaskSetup(
  task: Task,
  taskId: string,
  validatedConfig: TaskConfig,
  initialUserMessage: TaskMessage,
  storage: StorageAPI,
  workspaceId: string | undefined,
  emitSummary: (summary: string) => void,
): void {
  task.messages = [initialUserMessage];
  storage.saveTask(task, workspaceId);

  runTaskSummaryGeneration(taskId, validatedConfig.prompt, storage, emitSummary);
}
