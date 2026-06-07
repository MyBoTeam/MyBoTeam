import { trackEvent } from './analytics-service';

export function trackUpdateCheck(): void {
  trackEvent('update_check', { event_category: 'updates' });
}

export function trackUpdateAvailable(currentVersion: string, newVersion: string): void {
  trackEvent('update_available', {
    event_category: 'updates',
    current_version: currentVersion,
    new_version: newVersion,
  });
}

export function trackUpdateNotAvailable(): void {
  trackEvent('update_not_available', { event_category: 'updates' });
}
