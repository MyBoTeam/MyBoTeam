import { trackEvent } from './analytics-service';

export function trackHelpLinkClicked(provider: string): void {
  trackEvent('help_link_clicked', { event_category: 'settings', provider });
}

export function trackSaveVoiceApiKey(success: boolean): void {
  trackEvent('save_voice_api_key', { event_category: 'settings', success });
}
