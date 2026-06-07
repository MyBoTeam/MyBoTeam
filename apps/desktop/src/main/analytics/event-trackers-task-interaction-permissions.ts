import { trackEvent } from './analytics-service';
import type { TaskContext } from './event-types';

export function trackPermissionRequested(
  context: TaskContext,
  permissionType: string,
  model?: string,
  provider?: string,
): void {
  trackEvent('permission_requested', {
    event_category: 'task_lifecycle',
    task_id: context.taskId,
    opencode_session_id: context.sessionId,
    task_type: context.taskType,
    permission_type: permissionType,
    model,
    provider,
  });
}

export function trackPermissionResponse(
  context: TaskContext,
  permissionType: string,
  granted: boolean,
  model?: string,
  provider?: string,
): void {
  trackEvent('permission_response', {
    event_category: 'task_lifecycle',
    task_id: context.taskId,
    opencode_session_id: context.sessionId,
    task_type: context.taskType,
    permission_type: permissionType,
    granted,
    model,
    provider,
  });
}
