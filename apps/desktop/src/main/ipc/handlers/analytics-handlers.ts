import type { IpcMainInvokeEvent } from 'electron';
import {
  trackAppBackgrounded,
  trackAppClose,
  trackAppForegrounded,
  trackEvent,
  trackExportLogs,
  trackHelpLinkClicked,
  trackHistoryCleared,
  trackHistoryViewed,
  trackModelSelectionAbandoned,
  trackModelSelectionComplete,
  trackModelSelectionStep,
  trackOutputCopied,
  trackPageView,
  trackProviderBoxClicked,
  trackProviderDisconnected,
  trackSaveApiKey,
  trackSaveVoiceApiKey,
  trackSelectModel,
  trackSelectProvider,
  trackSkillAction,
  trackTaskDetailsExpanded,
  trackTaskFromHistory,
  trackTaskLauncherAction,
  trackThreadExported,
  trackToggleDebugMode,
} from '../../analytics/events';
import { isAnalyticsEnabled } from '../../config/build-config';
import { registerAnalyticsLifecycleHandlers } from './analytics-lifecycle-handlers';
import { createHa } from './analytics-utils';

export function registerAnalyticsHandlers(): void {
  registerAnalyticsLifecycleHandlers();

  const ha = createHa(isAnalyticsEnabled());

  ha(
    'analytics:track',
    async (
      _event: IpcMainInvokeEvent,
      eventName: string,
      params?: Record<string, string | number | boolean>,
    ) => {
      trackEvent(eventName, params);
    },
  );

  ha(
    'analytics:page-view',
    async (_event: IpcMainInvokeEvent, pagePath: string, pageTitle?: string) => {
      trackPageView(pagePath, pageTitle);
    },
  );

  ha(
    'analytics:save-api-key',
    async (
      _event: IpcMainInvokeEvent,
      provider: string,
      success: boolean,
      connectionMethod?: string,
    ) => {
      trackSaveApiKey(provider, success, connectionMethod);
    },
  );

  ha('analytics:select-provider', async (_event: IpcMainInvokeEvent, provider: string) => {
    trackSelectProvider(provider);
  });

  ha(
    'analytics:select-model',
    async (_event: IpcMainInvokeEvent, model: string, provider?: string) => {
      trackSelectModel(model, provider);
    },
  );

  ha('analytics:toggle-debug-mode', async (_event: IpcMainInvokeEvent, enabled: boolean) => {
    trackToggleDebugMode(enabled);
  });

  ha('analytics:app-close', async () => {
    await trackAppClose();
  });

  ha('analytics:app-backgrounded', async () => {
    trackAppBackgrounded();
  });

  ha('analytics:app-foregrounded', async () => {
    trackAppForegrounded();
  });

  ha(
    'analytics:model-selection-step',
    async (
      _event: IpcMainInvokeEvent,
      step: string,
      isOnboarding: boolean,
      provider?: string,
      model?: string,
    ) => {
      trackModelSelectionStep(step, isOnboarding, provider, model);
    },
  );

  ha(
    'analytics:model-selection-complete',
    async (_event: IpcMainInvokeEvent, provider: string, isOnboarding: boolean, model?: string) => {
      trackModelSelectionComplete(provider, isOnboarding, model);
    },
  );

  ha(
    'analytics:model-selection-abandoned',
    async (_event: IpcMainInvokeEvent, lastStep: string, isOnboarding: boolean) => {
      trackModelSelectionAbandoned(lastStep, isOnboarding);
    },
  );

  ha('analytics:history-viewed', async () => {
    trackHistoryViewed();
  });
  ha('analytics:task-from-history', async () => {
    trackTaskFromHistory();
  });
  ha('analytics:history-cleared', async () => {
    trackHistoryCleared();
  });
  ha('analytics:task-details-expanded', async () => {
    trackTaskDetailsExpanded();
  });
  ha('analytics:output-copied', async () => {
    trackOutputCopied();
  });

  ha('analytics:provider-disconnected', async (_event: IpcMainInvokeEvent, provider: string) => {
    trackProviderDisconnected(provider);
  });

  ha('analytics:help-link-clicked', async (_event: IpcMainInvokeEvent, provider: string) => {
    trackHelpLinkClicked(provider);
  });

  ha(
    'analytics:skill-action',
    async (
      _event: IpcMainInvokeEvent,
      params: {
        action: string;
        skill_name?: string;
        enabled?: boolean;
        filter?: string;
        source?: string;
      },
    ) => {
      trackSkillAction(params);
    },
  );

  ha('analytics:save-voice-api-key', async (_event: IpcMainInvokeEvent, success: boolean) => {
    trackSaveVoiceApiKey(success);
  });

  ha('analytics:export-logs', async () => {
    trackExportLogs();
  });
  ha('analytics:thread-exported', async () => {
    trackThreadExported();
  });

  ha('analytics:task-launcher-action', async (_event: IpcMainInvokeEvent, action: string) => {
    trackTaskLauncherAction(action);
  });

  ha(
    'analytics:provider-box-clicked',
    async (
      _event: IpcMainInvokeEvent,
      params: { provider_id: string; is_connected: boolean; is_onboarding: boolean },
    ) => {
      trackProviderBoxClicked(params);
    },
  );
}
