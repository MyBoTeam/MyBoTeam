import type {
  PermissionResponse,
  StorageAPI,
  Task,
  TaskManagerAPI,
  TaskSource,
  TaskStatus,
} from '@myboteam/agent-core';
import type { OpenCodeServerManager } from './opencode/server-manager.js';

export function listTasksFromStorage(
  storage: StorageAPI,
  workspaceId?: string,
  includeUnassigned = false,
): Task[] {
  return storage.getTasks(workspaceId, includeUnassigned) as Task[];
}

export function getTaskStatusFromStorage(
  storage: StorageAPI,
  taskId: string,
): { taskId: string; status: TaskStatus; prompt: string; createdAt: string } | null {
  const task = storage.getTask(taskId);
  if (!task) {
    return null;
  }
  return { taskId: task.id, status: task.status, prompt: task.prompt, createdAt: task.createdAt };
}

export function getActiveTaskIdFromManager(taskManager: TaskManagerAPI): string | null {
  return taskManager.getActiveTaskId();
}

export function hasActiveTaskInManager(taskManager: TaskManagerAPI, taskId: string): boolean {
  return taskManager.hasActiveTask(taskId);
}

export function getActiveTaskCountFromManager(taskManager: TaskManagerAPI): number {
  return taskManager.getActiveTaskCount();
}

export async function sendResponseViaManager(
  taskManager: TaskManagerAPI,
  taskId: string,
  response: PermissionResponse,
): Promise<void> {
  await taskManager.sendResponse(taskId, response);
}

export function getTaskSourceFromMap(
  taskSources: Map<string, TaskSource>,
  taskId: string,
): TaskSource {
  return taskSources.get(taskId) ?? 'ui';
}

export function disposeTaskService(
  serverManager: OpenCodeServerManager,
  taskManager: TaskManagerAPI,
): void {
  serverManager.dispose();
  taskManager.dispose();
}
