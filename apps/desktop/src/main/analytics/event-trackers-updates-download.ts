import { trackEvent } from './analytics-service';

export function trackUpdateDownloadStart(newVersion: string): void {
  trackEvent('update_download_start', { event_category: 'updates', new_version: newVersion });
}

export function trackUpdateDownloadComplete(newVersion: string): void {
  trackEvent('update_download_complete', { event_category: 'updates', new_version: newVersion });
}

export function trackUpdateInstallStart(newVersion: string): void {
  trackEvent('update_install_start', { event_category: 'updates', new_version: newVersion });
}

export function trackUpdateFailed(errorType: string, errorMessage: string): void {
  trackEvent('update_failed', {
    event_category: 'updates',
    error_type: errorType,
    error_message: errorMessage,
  });
}
