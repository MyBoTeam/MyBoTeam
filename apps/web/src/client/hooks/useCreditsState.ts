import type { CreditUsage } from '@myboteam/agent-core/common';
import { isProviderReady, type ProviderId } from '@myboteam/agent-core/common';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMyBoTeam } from '../lib/myboteam';

export type { CreditUsage };

export function getCreditStatusColor(usage: CreditUsage): string {
  if (usage.remainingCredits <= 0) return 'bg-red-500';
  const pct = usage.totalCredits > 0 ? (usage.spentCredits / usage.totalCredits) * 100 : 0;
  if (pct < 60) return 'bg-emerald-500';
  if (pct < 85) return 'bg-amber-500';
  return 'bg-red-500';
}

export function useCreditsState() {
  const myboteam = useMemo(() => getMyBoTeam(), []);

  const [usage, setUsage] = useState<CreditUsage | null>(null);
  const [isCreditsBlocked, setIsCreditsBlocked] = useState(false);
  const [hasAlternativeReadyProvider, setHasAlternativeReadyProvider] = useState(false);
  const [showQuotaInline, setShowQuotaInline] = useState(false);

  type ProviderSettingsSnapshot = Awaited<ReturnType<typeof myboteam.getProviderSettings>>;

  const applyLiveUsage = useCallback(
    (settings: ProviderSettingsSnapshot, liveUsage: CreditUsage): boolean => {
      const connectedMyBoTeam = settings.connectedProviders['myboteam-ai'];
      const readyAlternativeExists = (
        Object.keys(settings.connectedProviders) as ProviderId[]
      ).some(
        (providerId) =>
          providerId !== 'myboteam-ai' && isProviderReady(settings.connectedProviders[providerId]),
      );
      setHasAlternativeReadyProvider(readyAlternativeExists);

      if (connectedMyBoTeam?.connectionStatus !== 'connected') {
        setUsage(null);
        setIsCreditsBlocked(false);
        setShowQuotaInline(false);
        return false;
      }

      const isExhausted = liveUsage.remainingCredits <= 0;
      const shouldBlock =
        settings.activeProviderId === 'myboteam-ai' &&
        isProviderReady(connectedMyBoTeam) &&
        isExhausted;

      setUsage(liveUsage);
      setIsCreditsBlocked(shouldBlock);

      if (!shouldBlock) {
        setShowQuotaInline(false);
      }
      return shouldBlock;
    },
    [],
  );

  const refreshCreditsState = useCallback(async (): Promise<boolean> => {
    try {
      const settings = await myboteam.getProviderSettings();
      const connectedMyBoTeam = settings.connectedProviders['myboteam-ai'];
      if (connectedMyBoTeam?.connectionStatus !== 'connected') {
        const readyAlternativeExists = (
          Object.keys(settings.connectedProviders) as ProviderId[]
        ).some(
          (providerId) =>
            providerId !== 'myboteam-ai' &&
            isProviderReady(settings.connectedProviders[providerId]),
        );
        setHasAlternativeReadyProvider(readyAlternativeExists);
        setUsage(null);
        setIsCreditsBlocked(false);
        setShowQuotaInline(false);
        return false;
      }
      const liveUsage = await myboteam.myboteamAiGetUsage();
      return applyLiveUsage(settings, liveUsage);
    } catch {
      setHasAlternativeReadyProvider(false);
      setUsage(null);
      setIsCreditsBlocked(false);
      setShowQuotaInline(false);
      return false;
    }
  }, [myboteam, applyLiveUsage]);

  const openQuotaBlockExperience = useCallback(() => {
    setShowQuotaInline(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [usageData, settings] = await Promise.all([
          myboteam.myboteamAiGetUsage?.(),
          myboteam.getProviderSettings(),
        ]);
        if (cancelled || !usageData) return;
        applyLiveUsage(settings, usageData);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [myboteam, applyLiveUsage]);

  useEffect(() => {
    const unsubscribe = myboteam.onMyboteamAiUsageUpdate?.((liveUsage) => {
      void (async () => {
        try {
          const settings = await myboteam.getProviderSettings();
          applyLiveUsage(settings, liveUsage);
        } catch {
          setHasAlternativeReadyProvider(false);
          setUsage(null);
          setIsCreditsBlocked(false);
          setShowQuotaInline(false);
        }
      })();
    });

    return () => {
      unsubscribe?.();
    };
  }, [myboteam, applyLiveUsage]);

  return {
    usage,
    isCreditsBlocked,
    hasAlternativeReadyProvider,
    showQuotaInline,
    setShowQuotaInline,
    refreshCreditsState,
    openQuotaBlockExperience,
  };
}
