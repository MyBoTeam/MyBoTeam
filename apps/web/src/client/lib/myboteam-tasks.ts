import type {
  BrowserFramePayload,
  BrowserNavigatePayload,
  BrowserStatusPayload,
  FileAttachmentInfo,
  PermissionRequest,
  PermissionResponse,
  StoredFavorite,
  Task,
  TaskConfig,
  TaskMessage,
  TaskProgress,
  TaskStatus,
  TaskUpdateEvent,
  TodoItem,
} from '@myboteam/agent-core';
import type { AxtreeResult, BugReportResult, ScreenshotResult } from './myboteam-types';

export interface MyBoTeamAPITasks {
  startTask(config: TaskConfig): Promise<Task>;
  cancelTask(taskId: string): Promise<void>;
  interruptTask(taskId: string): Promise<void>;
  getTask(taskId: string): Promise<Task | null>;
  listTasks(): Promise<Task[]>;
  deleteTask(taskId: string): Promise<void>;
  clearTaskHistory(): Promise<void>;
  respondToPermission(response: PermissionResponse): Promise<void>;
  resumeSession(
    sessionId: string,
    prompt: string,
    taskId?: string,
    attachments?: FileAttachmentInfo[],
  ): Promise<Task>;
  getTodosForTask(taskId: string): Promise<TodoItem[]>;
  addFavorite(taskId: string): Promise<void>;
  removeFavorite(taskId: string): Promise<void>;
  listFavorites(): Promise<StoredFavorite[]>;
  pickFolder(): Promise<string | null>;
  pickFiles(): Promise<FileAttachmentInfo[]>;
  getFilePath(file: File): string;
  processDroppedFiles(paths: string[]): Promise<FileAttachmentInfo[]>;
  onTaskUpdate(callback: (event: TaskUpdateEvent) => void): () => void;
  onTaskUpdateBatch?(
    callback: (event: { taskId: string; messages: TaskMessage[] }) => void,
  ): () => void;
  onPermissionRequest(callback: (request: PermissionRequest) => void): () => void;
  onTaskProgress(callback: (progress: TaskProgress) => void): () => void;
  onDebugLog(callback: (log: unknown) => void): () => void;
  onDebugModeChange?(callback: (data: { enabled: boolean }) => void): () => void;
  onTaskStatusChange?(callback: (data: { taskId: string; status: TaskStatus }) => void): () => void;
  onTaskSummary?(callback: (data: { taskId: string; summary: string }) => void): () => void;
  onTodoUpdate?(callback: (data: { taskId: string; todos: TodoItem[] }) => void): () => void;
  onAuthError?(callback: (data: { providerId: string; message: string }) => void): () => void;
  onBrowserFrame?(callback: (event: BrowserFramePayload & { taskId: string }) => void): () => void;
  onBrowserNavigate?(
    callback: (event: BrowserNavigatePayload & { taskId: string; pageName: string }) => void,
  ): () => void;
  onBrowserStatus?(
    callback: (
      event: BrowserStatusPayload & { taskId: string; pageName: string; message?: string },
    ) => void,
  ): () => void;
  startBrowserPreview?(taskId: string, pageName?: string): Promise<{ success: boolean }>;
  stopBrowserPreview?(taskId: string): Promise<{ stopped: boolean }>;
  getBrowserPreviewStatus?(): Promise<{ active: boolean }>;
  logEvent(payload: {
    level?: string;
    message: string;
    context?: Record<string, unknown>;
  }): Promise<unknown>;
  exportLogs(): Promise<BugReportResult>;
  captureScreenshot(): Promise<ScreenshotResult>;
  captureAxtree(): Promise<AxtreeResult>;
  generateBugReport(data: {
    taskId?: string;
    taskPrompt?: string;
    taskStatus?: string;
    taskCreatedAt?: string;
    taskCompletedAt?: string;
    taskError?: string;
    messages?: unknown[];
    debugLogs?: unknown[];
    screenshot?: string;
    axtree?: string;
    appVersion?: string;
    platform?: string;
  }): Promise<BugReportResult>;
  onCloseRequested?(callback: () => void): () => void;
  respondToClose?(decision: 'keep-daemon' | 'stop-daemon' | 'cancel'): void;
  onDaemonDisconnected(callback: () => void): () => void;
  onDaemonReconnected(callback: () => void): () => void;
  onDaemonReconnectFailed(callback: () => void): () => void;
}
