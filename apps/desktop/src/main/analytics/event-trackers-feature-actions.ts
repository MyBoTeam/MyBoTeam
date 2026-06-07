import { trackEvent } from './analytics-service';

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
