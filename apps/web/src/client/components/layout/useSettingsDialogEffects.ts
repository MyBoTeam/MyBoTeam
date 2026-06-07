import type { ProviderId } from '@myboteam/agent-core/common';
import { useEffect } from 'react';
import { getMyBoTeam } from '@/lib/myboteam';
import type { SettingsTabId } from './settings-tabs';
import { FIRST_FOUR_PROVIDERS } from './settings-tabs';

interface UseSettingsDialogEffectsOptions {
  open: boolean;
  loading: boolean;
  initialProvider?: ProviderId;
  initialTab: SettingsTabId;
  activeProviderId?: ProviderId | null;
  refetch: () => void;
  setSelectedProvider: (provider: ProviderId | null) => void;
  setGridExpanded: (expanded: boolean) => void;
  setCloseWarning: (warning: boolean) => void;
  setShowModelError: (error: boolean) => void;
  setActiveTab: (tab: SettingsTabId) => void;
  setDebugModeState: (debug: boolean) => void;
  setNotificationsEnabledState: (enabled: boolean) => void;
  setAppVersion: (version: string) => void;
}

export function useSettingsDialogEffects({
  open,
  loading,
  initialProvider,
  initialTab,
  activeProviderId,
  refetch,
  setSelectedProvider,
  setGridExpanded,
  setCloseWarning,
  setShowModelError,
  setActiveTab,
  setDebugModeState,
  setNotificationsEnabledState,
  setAppVersion,
}: UseSettingsDialogEffectsOptions) {
  const myboteam = getMyBoTeam();

  useEffect(() => {
    if (!open) {
      return;
    }
    refetch();
    myboteam.getDebugMode().then(setDebugModeState);
    myboteam.getNotificationsEnabled().then(setNotificationsEnabledState);
    myboteam.getVersion().then(setAppVersion);
  }, [open, refetch, myboteam, setDebugModeState, setNotificationsEnabledState, setAppVersion]);

  useEffect(() => {
    if (!open) {
      setSelectedProvider(null);
      setGridExpanded(false);
      setCloseWarning(false);
      setShowModelError(false);
    } else {
      setActiveTab(initialTab);
    }
  }, [
    open,
    initialTab,
    setSelectedProvider,
    setGridExpanded,
    setCloseWarning,
    setShowModelError,
    setActiveTab,
  ]);

  useEffect(() => {
    if (!open || loading) {
      return;
    }
    const providerToSelect = initialProvider || activeProviderId;
    if (!providerToSelect) {
      return;
    }
    setSelectedProvider(providerToSelect as ProviderId);
    if (!FIRST_FOUR_PROVIDERS.includes(providerToSelect as (typeof FIRST_FOUR_PROVIDERS)[number])) {
      setGridExpanded(true);
    }
  }, [open, loading, initialProvider, activeProviderId, setSelectedProvider, setGridExpanded]);
}
