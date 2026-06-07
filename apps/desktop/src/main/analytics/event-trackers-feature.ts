import { trackEvent } from './analytics-service';
import type { HardwareProperties } from './event-types';

export function trackSaveApiKey(
  provider: string,
  success: boolean,
  connectionMethod?: string,
): void {
  trackEvent('save_api_key', {
    event_category: 'settings',
    provider,
    success,
    ...(connectionMethod && { connection_method: connectionMethod }),
  });
}

export function trackSelectProvider(provider: string): void {
  trackEvent('select_provider', {
    event_category: 'settings',
    provider,
  });
}

export function trackSelectModel(model: string, provider?: string): void {
  trackEvent('select_model', {
    event_category: 'settings',
    model,
    provider,
  });
}

export function trackToggleDebugMode(enabled: boolean): void {
  trackEvent('toggle_debug_mode', {
    event_category: 'settings',
    enabled,
  });
}

export function trackProviderDisconnected(provider: string): void {
  trackEvent('provider_disconnected', { event_category: 'settings', provider });
}

export function trackHelpLinkClicked(provider: string): void {
  trackEvent('help_link_clicked', { event_category: 'settings', provider });
}

export function trackContextSizeChanged(
  params: {
    old_value: number | null;
    new_value: number | null;
    provider: string;
    model_id?: string;
  } & Partial<HardwareProperties>,
): void {
  const { old_value, new_value, ...rest } = params;
  trackEvent('context_size_changed', {
    event_category: 'settings',
    old_value: old_value ?? undefined,
    new_value: new_value ?? undefined,
    ...rest,
  });
}

export function trackSaveVoiceApiKey(success: boolean): void {
  trackEvent('save_voice_api_key', { event_category: 'settings', success });
}

export function trackModelSelectionStep(
  step: string,
  isOnboarding: boolean,
  provider?: string,
  model?: string,
): void {
  trackEvent('model_selection_step', {
    event_category: 'model_selection',
    step,
    is_onboarding: isOnboarding,
    provider,
    model,
  });
}

export function trackModelSelectionComplete(
  provider: string,
  isOnboarding: boolean,
  model?: string,
): void {
  trackEvent('model_selection_complete', {
    event_category: 'model_selection',
    provider,
    is_onboarding: isOnboarding,
    model,
  });
}

export function trackModelSelectionAbandoned(lastStep: string, isOnboarding: boolean): void {
  trackEvent('model_selection_abandoned', {
    event_category: 'model_selection',
    last_step: lastStep,
    is_onboarding: isOnboarding,
  });
}

export function trackProviderBoxClicked(params: {
  provider_id: string;
  is_connected: boolean;
  is_onboarding: boolean;
}): void {
  trackEvent('provider_box_clicked', { event_category: 'model_selection', ...params });
}

export function trackHistoryViewed(): void {
  trackEvent('history_viewed', { event_category: 'feature_usage' });
}

export function trackTaskFromHistory(): void {
  trackEvent('task_from_history', { event_category: 'feature_usage' });
}

export function trackHistoryCleared(): void {
  trackEvent('history_cleared', { event_category: 'feature_usage' });
}

export function trackTaskDetailsExpanded(): void {
  trackEvent('task_details_expanded', { event_category: 'feature_usage' });
}

export function trackOutputCopied(): void {
  trackEvent('output_copied', { event_category: 'feature_usage' });
}

export function trackSkillAction(params: {
  action: string;
  skill_name?: string;
  enabled?: boolean;
  filter?: string;
  source?: string;
}): void {
  trackEvent('skill_action', { event_category: 'feature_usage', ...params });
}

export function trackExportLogs(): void {
  trackEvent('export_logs', { event_category: 'feature_usage' });
}

export function trackThreadExported(): void {
  trackEvent('thread_exported', { event_category: 'feature_usage' });
}

export function trackTaskLauncherAction(action: string): void {
  trackEvent('task_launcher_action', { event_category: 'feature_usage', action });
}
