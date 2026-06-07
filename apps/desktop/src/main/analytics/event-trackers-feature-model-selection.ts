import { trackEvent } from './analytics-service';

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
