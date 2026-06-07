import { ipcRenderer } from 'electron';
import { analyticsInvoke } from '../ipc-bridge';

export const analyticsHandlers = {
  analytics: {
    track: (eventName: string, params?: Record<string, string | number | boolean>): Promise<void> =>
      analyticsInvoke('analytics:track', eventName, params),
    trackPageView: (pagePath: string, pageTitle?: string): Promise<void> =>
      analyticsInvoke('analytics:page-view', pagePath, pageTitle),

    trackSubmitTask: (): Promise<void> => analyticsInvoke('analytics:submit-task'),
    trackNewTask: (): Promise<void> => analyticsInvoke('analytics:new-task'),
    trackOpenSettings: (): Promise<void> => analyticsInvoke('analytics:open-settings'),

    trackSaveApiKey: (
      provider: string,
      success: boolean,
      connectionMethod?: string,
    ): Promise<void> =>
      analyticsInvoke('analytics:save-api-key', provider, success, connectionMethod),
    trackSelectProvider: (provider: string): Promise<void> =>
      analyticsInvoke('analytics:select-provider', provider),
    trackSelectModel: (model: string, provider?: string): Promise<void> =>
      analyticsInvoke('analytics:select-model', model, provider),
    trackToggleDebugMode: (enabled: boolean): Promise<void> =>
      analyticsInvoke('analytics:toggle-debug-mode', enabled),

    trackTaskStart: (taskId: string, sessionId: string, taskType: string): Promise<void> =>
      analyticsInvoke('analytics:task-start', taskId, sessionId, taskType),
    trackTaskComplete: (
      taskId: string,
      sessionId: string,
      taskType: string,
      durationMs: number,
      totalSteps: number,
      hadErrors: boolean,
    ): Promise<void> =>
      ipcRenderer.invoke(
        'analytics:task-complete',
        taskId,
        sessionId,
        taskType,
        durationMs,
        totalSteps,
        hadErrors,
      ),
    trackTaskError: (
      taskId: string,
      sessionId: string,
      taskType: string,
      durationMs: number,
      totalSteps: number,
      errorType: string,
    ): Promise<void> =>
      ipcRenderer.invoke(
        'analytics:task-error',
        taskId,
        sessionId,
        taskType,
        durationMs,
        totalSteps,
        errorType,
      ),
    trackPermissionRequested: (
      taskId: string,
      sessionId: string,
      taskType: string,
      permissionType: string,
    ): Promise<void> =>
      ipcRenderer.invoke(
        'analytics:permission-requested',
        taskId,
        sessionId,
        taskType,
        permissionType,
      ),
    trackPermissionResponse: (
      taskId: string,
      sessionId: string,
      taskType: string,
      permissionType: string,
      granted: boolean,
    ): Promise<void> =>
      ipcRenderer.invoke(
        'analytics:permission-response',
        taskId,
        sessionId,
        taskType,
        permissionType,
        granted,
      ),
    trackToolUsed: (
      taskId: string,
      sessionId: string,
      taskType: string,
      toolName: string,
    ): Promise<void> =>
      analyticsInvoke('analytics:tool-used', taskId, sessionId, taskType, toolName),
    trackUserInteraction: (
      taskId: string,
      sessionId: string,
      taskType: string,
      interactionType: string,
      usedSuggestion: boolean,
    ): Promise<void> =>
      ipcRenderer.invoke(
        'analytics:user-interaction',
        taskId,
        sessionId,
        taskType,
        interactionType,
        usedSuggestion,
      ),

    trackAppClose: (): Promise<void> => analyticsInvoke('analytics:app-close'),
    trackAppBackgrounded: (): Promise<void> => analyticsInvoke('analytics:app-backgrounded'),
    trackAppForegrounded: (): Promise<void> => analyticsInvoke('analytics:app-foregrounded'),

    trackModelSelectionStep: (
      step: string,
      isOnboarding: boolean,
      provider?: string,
      model?: string,
    ): Promise<void> =>
      analyticsInvoke('analytics:model-selection-step', step, isOnboarding, provider, model),
    trackModelSelectionComplete: (
      provider: string,
      isOnboarding: boolean,
      model?: string,
    ): Promise<void> =>
      analyticsInvoke('analytics:model-selection-complete', provider, isOnboarding, model),
    trackModelSelectionAbandoned: (lastStep: string, isOnboarding: boolean): Promise<void> =>
      analyticsInvoke('analytics:model-selection-abandoned', lastStep, isOnboarding),

    trackHistoryViewed: (): Promise<void> => analyticsInvoke('analytics:history-viewed'),
    trackTaskFromHistory: (): Promise<void> => analyticsInvoke('analytics:task-from-history'),
    trackHistoryCleared: (): Promise<void> => analyticsInvoke('analytics:history-cleared'),
    trackTaskDetailsExpanded: (): Promise<void> =>
      analyticsInvoke('analytics:task-details-expanded'),
    trackOutputCopied: (): Promise<void> => analyticsInvoke('analytics:output-copied'),

    trackProviderDisconnected: (provider: string): Promise<void> =>
      analyticsInvoke('analytics:provider-disconnected', provider),
    trackHelpLinkClicked: (provider: string): Promise<void> =>
      analyticsInvoke('analytics:help-link-clicked', provider),

    trackSkillAction: (params: {
      action: string;
      skill_name?: string;
      enabled?: boolean;
      filter?: string;
      source?: string;
    }): Promise<void> => analyticsInvoke('analytics:skill-action', params),

    trackSaveVoiceApiKey: (success: boolean): Promise<void> =>
      analyticsInvoke('analytics:save-voice-api-key', success),

    trackExportLogs: (): Promise<void> => analyticsInvoke('analytics:export-logs'),
    trackThreadExported: (): Promise<void> => analyticsInvoke('analytics:thread-exported'),

    trackTaskLauncherAction: (action: string): Promise<void> =>
      analyticsInvoke('analytics:task-launcher-action', action),

    trackTaskFeedback: (
      taskId: string,
      sessionId: string,
      rating: string,
      taskStatus: string,
      feedbackStage: string,
      feedbackReason?: string,
      feedbackText?: string,
    ): Promise<void> =>
      ipcRenderer.invoke(
        'analytics:task-feedback',
        taskId,
        sessionId,
        rating,
        taskStatus,
        feedbackStage,
        feedbackReason,
        feedbackText,
      ),

    trackStopAgent: (taskId: string, sessionId: string): Promise<void> =>
      analyticsInvoke('analytics:stop-agent', taskId, sessionId),

    trackProviderBoxClicked: (params: {
      provider_id: string;
      is_connected: boolean;
      is_onboarding: boolean;
    }): Promise<void> => analyticsInvoke('analytics:provider-box-clicked', params),
  },
};
