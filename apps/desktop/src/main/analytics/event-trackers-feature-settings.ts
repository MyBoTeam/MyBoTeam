import { trackEvent } from './analytics-service';

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
