import type { PermissionResponse } from '../permission.js';
import type { FileAttachmentInfo, Task, TaskMessage, TaskStatus } from '../task.js';

export interface TaskStartParams {
  prompt: string;
  taskId?: string;
  modelId?: string;
  sessionId?: string;
  workingDirectory?: string;
  workspaceId?: string;
  attachments?: FileAttachmentInfo[];
  allowedTools?: string[];
  systemPromptAppend?: string;
  outputSchema?: object;
  source?: import('../task.js').TaskSource;
}

export interface TaskIdParams {
  taskId: string;
}

export interface TaskListParams {
  workspaceId?: string;
  includeUnassigned?: boolean;
}

export interface TaskSendResponseParams {
  taskId: string;
  response: string;
}

export type PermissionRespondParams = PermissionResponse;

export interface SessionResumeParams {
  sessionId: string;
  prompt: string;
  existingTaskId?: string;
  workspaceId?: string;
  attachments?: FileAttachmentInfo[];
}

export interface StorageSaveTaskParams {
  task: Task;
}

export interface StorageUpdateTaskStatusParams {
  taskId: string;
  status: TaskStatus;
  completedAt?: string;
}

export interface StorageUpdateTaskSummaryParams {
  taskId: string;
  summary: string;
}

export interface StorageAddTaskMessageParams {
  taskId: string;
  message: TaskMessage;
}

export interface StorageDeleteTaskParams {
  taskId: string;
}

export interface ScheduledTask {
  id: string;
  cron: string;
  prompt: string;
  workspaceId?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface TaskScheduleParams {
  cron: string;
  prompt: string;
  workspaceId?: string;
}

export interface TaskCancelScheduledParams {
  scheduleId: string;
}
