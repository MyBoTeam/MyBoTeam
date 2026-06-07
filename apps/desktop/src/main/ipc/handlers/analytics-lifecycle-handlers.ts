/**
 * Analytics lifecycle IPC handlers — task execution, engagement, feedback,
 * and agent control events.
 */

import type { IpcMainInvokeEvent } from 'electron';
import {
  trackNewTask,
  trackOpenSettings,
  trackPermissionRequested,
  trackPermissionResponse,
  trackStopAgent,
  trackSubmitTask,
  trackTaskComplete,
  trackTaskError,
  trackTaskFeedback,
  trackTaskStart,
  trackToolUsed,
  trackUserInteraction,
} from '../../analytics';
import type { TaskErrorCategory } from '../../analytics/types';
import { isAnalyticsEnabled } from '../../config/build-config';
import { createHa, getSelectedModelContext } from './analytics-utils';

export function registerAnalyticsLifecycleHandlers(): void {
  const ha = createHa(isAnalyticsEnabled());

  // Engagement
  ha('analytics:submit-task', async () => {
    const { model, provider } = await getSelectedModelContext();
    trackSubmitTask(model, provider);
  });

  ha('analytics:new-task', async () => {
    trackNewTask();
  });

  ha('analytics:open-settings', async () => {
    trackOpenSettings();
  });

  // Task Lifecycle (from renderer)
  ha(
    'analytics:task-start',
    async (_event: IpcMainInvokeEvent, taskId: string, sessionId: string, taskType: string) => {
      const { model, provider } = await getSelectedModelContext();
      trackTaskStart({ taskId, sessionId, taskType }, model, provider);
    },
  );

  ha(
    'analytics:task-complete',
    async (
      _event: IpcMainInvokeEvent,
      taskId: string,
      sessionId: string,
      taskType: string,
      durationMs: number,
      totalSteps: number,
      hadErrors: boolean,
    ) => {
      const { model, provider } = await getSelectedModelContext();
      trackTaskComplete(
        { taskId, sessionId, taskType },
        durationMs,
        totalSteps,
        hadErrors,
        model,
        undefined,
        undefined,
        provider,
      );
    },
  );

  ha(
    'analytics:task-error',
    async (
      _event: IpcMainInvokeEvent,
      taskId: string,
      sessionId: string,
      taskType: string,
      durationMs: number,
      totalSteps: number,
      errorType: string,
    ) => {
      const { model, provider } = await getSelectedModelContext();
      trackTaskError(
        { taskId, sessionId, taskType },
        durationMs,
        totalSteps,
        errorType as TaskErrorCategory,
        model,
        undefined,
        undefined,
        provider,
      );
    },
  );

  ha(
    'analytics:permission-requested',
    async (
      _event: IpcMainInvokeEvent,
      taskId: string,
      sessionId: string,
      taskType: string,
      permissionType: string,
    ) => {
      trackPermissionRequested({ taskId, sessionId, taskType }, permissionType);
    },
  );

  ha(
    'analytics:permission-response',
    async (
      _event: IpcMainInvokeEvent,
      taskId: string,
      sessionId: string,
      taskType: string,
      permissionType: string,
      granted: boolean,
    ) => {
      trackPermissionResponse({ taskId, sessionId, taskType }, permissionType, granted);
    },
  );

  ha(
    'analytics:tool-used',
    async (
      _event: IpcMainInvokeEvent,
      taskId: string,
      sessionId: string,
      taskType: string,
      toolName: string,
    ) => {
      trackToolUsed({ taskId, sessionId, taskType }, toolName);
    },
  );

  ha(
    'analytics:user-interaction',
    async (
      _event: IpcMainInvokeEvent,
      taskId: string,
      sessionId: string,
      taskType: string,
      interactionType: string,
      usedSuggestion: boolean,
    ) => {
      trackUserInteraction({ taskId, sessionId, taskType }, interactionType, usedSuggestion);
    },
  );

  // Task Feedback
  ha(
    'analytics:task-feedback',
    async (
      _event: IpcMainInvokeEvent,
      taskId: string,
      sessionId: string,
      rating: string,
      taskStatus: string,
      feedbackStage: string,
      feedbackReason?: string,
      feedbackText?: string,
    ) => {
      trackTaskFeedback(
        taskId,
        sessionId,
        rating,
        taskStatus,
        feedbackStage,
        undefined,
        undefined,
        feedbackReason,
        feedbackText,
      );
    },
  );

  // Agent Control
  ha(
    'analytics:stop-agent',
    async (_event: IpcMainInvokeEvent, taskId: string, sessionId: string) => {
      trackStopAgent(taskId, sessionId);
    },
  );
}
