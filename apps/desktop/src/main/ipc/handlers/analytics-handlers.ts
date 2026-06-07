/**
 * Analytics IPC handlers — bridges renderer analytics calls to main process event helpers.
 */

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
} from '../../analytics';
import { isAnalyticsEnabled } from '../../config/build-config';
import { registerAnalyticsLifecycleHandlers } from './analytics-lifecycle-handlers';
import { createHa } from './analytics-utils';

export function registerAnalyticsHandlers(): void {
  registerAnalyticsLifecycleHandlers();

  const ha = createHa(isAnalyticsEnabled());

  // Generic event tracking
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

  // Navigation
  ha(
    'analytics:page-view',
    async (_event: IpcMainInvokeEvent, pagePath: string, pageTitle?: string) => {
      trackPageView(pagePath, pageTitle);
    },
  );

  // Settings
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

  // Session
  ha('analytics:app-close', async () => {
    await trackAppClose();
  });

  ha('analytics:app-backgrounded', async () => {
    trackAppBackgrounded();
  });

  ha('analytics:app-foregrounded', async () => {
    trackAppForegrounded();
  });

  // Model Selection
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

  // Feature Usage
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

  // Provider Lifecycle
  ha('analytics:provider-disconnected', async (_event: IpcMainInvokeEvent, provider: string) => {
    trackProviderDisconnected(provider);
  });

  ha('analytics:help-link-clicked', async (_event: IpcMainInvokeEvent, provider: string) => {
    trackHelpLinkClicked(provider);
  });

  // Skills
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

  // Voice
  ha('analytics:save-voice-api-key', async (_event: IpcMainInvokeEvent, success: boolean) => {
    trackSaveVoiceApiKey(success);
  });

  // Debug
  ha('analytics:export-logs', async () => {
    trackExportLogs();
  });
  ha('analytics:thread-exported', async () => {
    trackThreadExported();
  });

  // Task Launcher
  ha('analytics:task-launcher-action', async (_event: IpcMainInvokeEvent, action: string) => {
    trackTaskLauncherAction(action);
  });

  // Provider Box
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
