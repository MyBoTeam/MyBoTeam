import type {
  FileAttachmentInfo,
  TaskMessage,
  TaskSource,
  TaskStatus,
} from '@myboteam/agent-core';

export interface TaskServiceEvents {
  progress: [data: { taskId: string; stage: string; message?: string }];
  message: [data: { taskId: string; messages: TaskMessage[] }];
  complete: [data: { taskId: string }];
  error: [data: { taskId: string; error: string }];
  permission: [data: unknown];
  statusChange: [data: { taskId: string; status: TaskStatus }];
  summary: [data: { taskId: string; summary: string }];
}

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

export interface ResumeSessionParams {
  sessionId: string;
  prompt: string;
  existingTaskId?: string;
  attachments?: FileAttachmentInfo[];
  workspaceId?: string;
}

export interface TaskServiceOptions {
  userDataPath: string;
  mcpToolsPath: string;
  isPackaged?: boolean;
  resourcesPath?: string;
  appPath?: string;

  rpcConnectivityProbe?: { hasConnectedClients(): boolean };
}
