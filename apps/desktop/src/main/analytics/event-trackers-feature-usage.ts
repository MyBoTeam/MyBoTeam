import { trackEvent } from './analytics-service';

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
