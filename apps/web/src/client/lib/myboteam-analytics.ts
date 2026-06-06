export interface MyBoTeamAnalytics {
  track(event: string, params?: Record<string, string | number | boolean>): Promise<void>;
  trackPageView(pagePath: string, pageTitle?: string): Promise<void>;
  trackSubmitTask(): Promise<void>;
  trackNewTask(): Promise<void>;
  trackOpenSettings(): Promise<void>;
  trackSaveApiKey(provider: string, success: boolean, connectionMethod?: string): Promise<void>;
  trackSelectProvider(provider: string): Promise<void>;
  trackSelectModel(model: string, provider?: string): Promise<void>;
  trackToggleDebugMode(enabled: boolean): Promise<void>;
  trackTaskStart(taskId: string, sessionId: string, taskType: string): Promise<void>;
  trackTaskComplete(
    taskId: string,
    sessionId: string,
    taskType: string,
    durationMs: number,
    totalSteps: number,
    hadErrors: boolean,
  ): Promise<void>;
  trackTaskError(
    taskId: string,
    sessionId: string,
    taskType: string,
    durationMs: number,
    totalSteps: number,
    errorType: string,
  ): Promise<void>;
  trackPermissionRequested(
    taskId: string,
    sessionId: string,
    taskType: string,
    permissionType: string,
  ): Promise<void>;
  trackPermissionResponse(
    taskId: string,
    sessionId: string,
    taskType: string,
    permissionType: string,
    granted: boolean,
  ): Promise<void>;
  trackToolUsed(
    taskId: string,
    sessionId: string,
    taskType: string,
    toolName: string,
  ): Promise<void>;
  trackUserInteraction(
    taskId: string,
    sessionId: string,
    taskType: string,
    interactionType: string,
    usedSuggestion: boolean,
  ): Promise<void>;
  trackAppClose(): Promise<void>;
  trackAppBackgrounded(): Promise<void>;
  trackAppForegrounded(): Promise<void>;
  trackModelSelectionStep(
    step: string,
    isOnboarding: boolean,
    provider?: string,
    model?: string,
  ): Promise<void>;
  trackModelSelectionComplete(
    provider: string,
    isOnboarding: boolean,
    model?: string,
  ): Promise<void>;
  trackModelSelectionAbandoned(lastStep: string, isOnboarding: boolean): Promise<void>;
  trackHistoryViewed(): Promise<void>;
  trackTaskFromHistory(): Promise<void>;
  trackHistoryCleared(): Promise<void>;
  trackTaskDetailsExpanded(): Promise<void>;
  trackOutputCopied(): Promise<void>;
  trackProviderDisconnected(provider: string): Promise<void>;
  trackHelpLinkClicked(provider: string): Promise<void>;
  trackSkillAction(params: {
    action: string;
    skill_name?: string;
    enabled?: boolean;
    filter?: string;
    source?: string;
  }): Promise<void>;
  trackSaveVoiceApiKey(success: boolean): Promise<void>;
  trackExportLogs(): Promise<void>;
  trackThreadExported(): Promise<void>;
  trackTaskLauncherAction(action: string): Promise<void>;
  trackTaskFeedback(
    taskId: string,
    sessionId: string,
    rating: string,
    taskStatus: string,
    feedbackStage: string,
    feedbackReason?: string,
    feedbackText?: string,
  ): Promise<void>;
  trackStopAgent(taskId: string, sessionId: string): Promise<void>;
  trackProviderBoxClicked(params: {
    provider_id: string;
    is_connected: boolean;
    is_onboarding: boolean;
  }): Promise<void>;
}
