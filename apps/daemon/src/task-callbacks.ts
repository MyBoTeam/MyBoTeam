import type { EventEmitter } from 'node:events';
import {
  type BrowserFramePayload,
  mapResultToStatus,
  type PermissionRequest,
  type PermissionResponse,
  type StorageAPI,
  type TaskCallbacks,
  type TaskManagerAPI,
  type TaskMessage,
  type TaskResult,
  type TaskSource,
  type TaskStatus,
  type TodoItem,
} from '@myboteam/agent-core';

export interface RpcConnectivityProbe {
  hasConnectedClients(): boolean;
}

export interface TaskCallbackExtras {
  rpc: RpcConnectivityProbe;

  getTaskSource: (taskId: string) => TaskSource;

  sendPermissionResponse: (taskId: string, response: PermissionResponse) => Promise<void>;
}

export function createTaskCallbacks(
  taskId: string,
  emitter: EventEmitter,
  storage: StorageAPI,
  taskManager: TaskManagerAPI,
  extras: TaskCallbackExtras,
): TaskCallbacks {
  return {
    onBatchedMessages: (messages: TaskMessage[]) => {
      emitter.emit('message', { taskId, messages });
      for (const msg of messages) {
        storage.addTaskMessage(taskId, msg);
      }
    },
    onProgress: (progress) => {
      emitter.emit('progress', { taskId, ...progress });
    },
    onPermissionRequest: (request: PermissionRequest) => {
      const source = extras.getTaskSource(taskId);
      const autoDeny = (): void => {
        extras
          .sendPermissionResponse(taskId, {
            taskId,
            requestId: request.id,
            decision: 'deny',
          })
          .catch(() => {});
      };

      if (source === 'whatsapp') {
        const listenerCount = emitter.listenerCount('permission');
        if (listenerCount <= 1) {
          autoDeny();
          return;
        }
        emitter.emit('permission', request);
        return;
      }

      if (!extras.rpc.hasConnectedClients()) {
        autoDeny();
        return;
      }

      emitter.emit('permission', request);
    },
    onComplete: (result: TaskResult) => {
      emitter.emit('complete', { taskId, result });
      const taskStatus = mapResultToStatus(result);
      storage.updateTaskStatus(taskId, taskStatus, new Date().toISOString());
      const sessionId = result.sessionId || taskManager.getSessionId(taskId);
      if (sessionId) {
        storage.updateTaskSessionId(taskId, sessionId);
      }
      if (result.status === 'success') {
        storage.clearTodosForTask(taskId);
      }
    },
    onError: (error: Error) => {
      emitter.emit('error', { taskId, error: error.message });
      storage.updateTaskStatus(taskId, 'failed', new Date().toISOString());
    },
    onStatusChange: (status: TaskStatus) => {
      emitter.emit('statusChange', { taskId, status });
      storage.updateTaskStatus(taskId, status, new Date().toISOString());
    },
    onTodoUpdate: (todos: TodoItem[]) => {
      // so TaskManager forwarded the adapter's `todo:update` into the

      // `daemon-bootstrap` already listens for `todo.update` RPC

      storage.saveTodosForTask(taskId, todos);
      emitter.emit('todo:update', { taskId, todos });
    },
    onAuthError: (error: { providerId: string; message: string }) => {
      emitter.emit('auth:error', { taskId, ...error });
    },
    onBrowserFrame: (data: BrowserFramePayload) => {
      emitter.emit('browser:frame', { taskId, ...data });
    },
  };
}
