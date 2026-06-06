// apps/desktop/src/renderer/components/settings/hooks/useProviderSettings.ts

import type { ConnectedProvider, ProviderId, ProviderSettings } from '@myboteam/agent-core/common';
import { useCallback, useEffect, useState } from 'react';
import { getMyBoTeam } from '@/lib/myboteam';

export function useProviderSettings() {
  const [settings, setSettings] = useState<ProviderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const myboteam = getMyBoTeam();
      const data = (await myboteam.getProviderSettings()) as ProviderSettings;
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const setActiveProvider = useCallback(async (providerId: ProviderId | null) => {
    const myboteam = getMyBoTeam();
    await myboteam.setActiveProvider(providerId);
    setSettings((prev) => (prev ? { ...prev, activeProviderId: providerId } : null));
  }, []);

  const connectProvider = useCallback(
    async (providerId: ProviderId, provider: ConnectedProvider) => {
      const myboteam = getMyBoTeam();
      await myboteam.setConnectedProvider(providerId, provider);
      setSettings((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          connectedProviders: {
            ...prev.connectedProviders,
            [providerId]: provider,
          },
        };
      });
    },
    [],
  );

  const disconnectProvider = useCallback(async (providerId: ProviderId) => {
    const myboteam = getMyBoTeam();
    await myboteam.removeConnectedProvider(providerId);
    setSettings((prev) => {
      if (!prev) return null;
      const { [providerId]: _, ...rest } = prev.connectedProviders;
      return {
        ...prev,
        connectedProviders: rest,
        activeProviderId: prev.activeProviderId === providerId ? null : prev.activeProviderId,
      };
    });
  }, []);

  const updateModel = useCallback(async (providerId: ProviderId, modelId: string | null) => {
    const myboteam = getMyBoTeam();
    await myboteam.updateProviderModel(providerId, modelId);
    setSettings((prev) => {
      if (!prev) return null;
      const provider = prev.connectedProviders[providerId];
      if (!provider) return prev;
      return {
        ...prev,
        connectedProviders: {
          ...prev.connectedProviders,
          [providerId]: { ...provider, selectedModelId: modelId },
        },
      };
    });
  }, []);

  const setDebugMode = useCallback(async (enabled: boolean) => {
    const myboteam = getMyBoTeam();
    await myboteam.setProviderDebugMode(enabled);
    setSettings((prev) => (prev ? { ...prev, debugMode: enabled } : null));
  }, []);

  /**
   * Atomically switches to a model on a different provider.
   * Rolls back the model update if activating the provider fails.
   */
  const switchProviderModel = useCallback(async (providerId: ProviderId, modelId: string) => {
    const myboteam = getMyBoTeam();
    // Capture previousModelId before writing so the rollback target is the original value
    const current = (await myboteam.getProviderSettings()) as ProviderSettings;
    const previousModelId = current.connectedProviders[providerId]?.selectedModelId ?? null;
    await myboteam.updateProviderModel(providerId, modelId);
    try {
      await myboteam.setActiveProvider(providerId);
    } catch (err) {
      // Revert the model update so settings stay consistent
      try {
        await myboteam.updateProviderModel(providerId, previousModelId);
      } catch {
        // Best-effort rollback; ignore secondary failure
      }
      throw err;
    }
    setSettings((prev) => {
      if (!prev) return null;
      const provider = prev.connectedProviders[providerId];
      return {
        ...prev,
        activeProviderId: providerId,
        connectedProviders: provider
          ? { ...prev.connectedProviders, [providerId]: { ...provider, selectedModelId: modelId } }
          : prev.connectedProviders,
      };
    });
  }, []);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    setActiveProvider,
    connectProvider,
    disconnectProvider,
    updateModel,
    switchProviderModel,
    setDebugMode,
  };
}
