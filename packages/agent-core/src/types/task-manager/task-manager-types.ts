import type { BrowserFramePayload } from '../../common/types/browser-view.js';
import type { OpenCodeMessage } from '../../common/types/opencode';
import type { PermissionRequest, PermissionResponse } from '../../common/types/permission';
import type { SandboxConfig, SandboxProvider } from '../../common/types/sandbox.js';
import type {
  Task,
  TaskConfig,
  TaskMessage,
  TaskResult,
  TaskStatus,
} from '../../common/types/task';
import type { TodoItem } from '../../common/types/todo';
import type {
  OnBeforeStartContext,
  OnBeforeStartResult,
  TaskProgressEvent,
} from './execution-types.js';

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

export interface TaskAdapterOptions {
  platform: NodeJS.Platform;
  isPackaged: boolean;
  tempPath: string;
  onBeforeStart?: (
    ctx: OnBeforeStartContext,
  ) => Promise<NodeJS.ProcessEnv | OnBeforeStartResult | undefined>;
  getModelDisplayName?: (modelId: string) => string;
  getServerUrl?: (taskId: string, ctx?: OnBeforeStartContext) => Promise<string | undefined>;
  setProxyTaskId?: (taskId: string | undefined) => void;
  sandboxFactory?: () => { provider: SandboxProvider; config: SandboxConfig };
  sandboxProvider?: SandboxProvider;
  sandboxConfig?: SandboxConfig;
}

export interface TaskManagerOptions {
  adapterOptions: TaskAdapterOptions;
  defaultWorkingDirectory: string;
  maxConcurrentTasks?: number;
  isCliAvailable: () => Promise<boolean>;
  onBeforeTaskStart?: (callbacks: TaskCallbacks, isFirstTask: boolean) => Promise<void>;
}

export interface TaskManagerAPI {
  startTask(taskId: string, config: TaskConfig, callbacks: TaskCallbacks): Promise<Task>;
  cancelTask(taskId: string): Promise<void>;
  interruptTask(taskId: string): Promise<void>;
  cancelQueuedTask(taskId: string): boolean;
  sendResponse(taskId: string, response: PermissionResponse): Promise<void>;
  getSessionId(taskId: string): string | null;
  isTaskRunning(taskId: string): boolean;
  hasActiveTask(taskId: string): boolean;
  hasRunningTask(): boolean;
  isTaskQueued(taskId: string): boolean;
  getQueueLength(): number;
  getActiveTaskIds(): string[];
  getActiveTaskId(): string | null;
  getActiveTaskCount(): number;
  getIsFirstTask(): boolean;
  cancelAllTasks(): void;
  dispose(): void;
}
