import { trackEvent } from './analytics-service';
import type { HardwareProperties } from './event-types';

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
