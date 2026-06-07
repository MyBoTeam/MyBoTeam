import type { PermissionResponse, TaskManagerAPI, TaskSource } from '@myboteam/agent-core';
import type { OpenCodeServerManager } from './opencode/server-manager.js';

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
