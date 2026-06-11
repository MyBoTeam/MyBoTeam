import type { BrowserFramePayload } from '../../common/types/browser-view.js';
import type { OpenCodeMessage } from '../../common/types/opencode.js';
import type { PermissionRequest } from '../../common/types/permission.js';
import type { TaskConfig, TaskMessage, TaskResult, TaskStatus } from '../../common/types/task.js';
import type { TodoItem } from '../../common/types/todo.js';
import type { AdapterOptions, TaskRuntimeAdapter } from './adapter-types.js';

export interface ManagedTask {
  taskId: string;
  adapter: TaskRuntimeAdapter;
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
  onPermissionRequest: (request: PermissionRequest) => void;
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
