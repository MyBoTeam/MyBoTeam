import { trackEvent } from './analytics-service';

export function trackPageView(pagePath: string, pageTitle?: string): void {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
    event_category: 'navigation',
  });
}

export function trackSubmitTask(model?: string, provider?: string): void {
  trackEvent('submit_task', {
    event_category: 'engagement',
    model,
    provider,
  });
}

export function trackNewTask(): void {
  trackEvent('new_task', {
    event_category: 'engagement',
  });
}

export function trackOpenSettings(): void {
  trackEvent('open_settings', {
    event_category: 'engagement',
  });
}
