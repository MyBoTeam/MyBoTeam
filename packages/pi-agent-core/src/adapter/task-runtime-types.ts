export interface BrowserFramePayload {
  frame: string;
  pageName: string;
  timestamp: number;
  taskId?: string;
}

export interface PermissionRequest {
  id: string;
  taskId: string;
  type: 'tool' | 'question' | 'file';
  toolName?: string;
  toolInput?: unknown;
  createdAt: string;
}

export interface PermissionResponse {
  requestId: string;
  taskId: string;
  decision: 'allow' | 'deny';
  message?: string;
}

export interface TaskConfig {
  prompt: string;
  taskId?: string;
  workingDirectory?: string;
  systemPromptAppend?: string;
  sessionId?: string;
  modelId?: string;
  provider?: string;
  source?: string;
  workspaceId?: string;
}

export type TaskStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'waiting_permission'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'interrupted';

export type TaskResult = {
  status: 'success' | 'error' | 'interrupted';
  sessionId?: string;
  durationMs?: number;
  error?: string;
};

export interface Task {
  id: string;
  prompt: string;
  status: TaskStatus;
  sessionId?: string;
  messages: [];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: TaskResult;
  workspaceId?: string;
}

export interface OpenCodeMessageBase {
  type: string;
  timestamp?: number;
  sessionID?: string;
}

export interface OpenCodeTextMessage extends OpenCodeMessageBase {
  type: 'text';
  part: {
    id: string;
    sessionID: string;
    messageID: string;
    type: 'text';
    text: string;
  };
}

export interface OpenCodeToolUseMessage extends OpenCodeMessageBase {
  type: 'tool_use';
  part: {
    id: string;
    sessionID: string;
    messageID: string;
    type: 'tool';
    callID?: string;
    tool: string;
    state: {
      status: 'pending' | 'running' | 'completed' | 'error';
      input?: unknown;
      output?: string;
    };
  };
}

export type OpenCodeMessage = OpenCodeTextMessage | OpenCodeToolUseMessage;
