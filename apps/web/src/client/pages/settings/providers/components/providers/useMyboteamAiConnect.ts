import type { ConnectedProvider, CreditUsage } from '@myboteam/agent-core/common';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getMyBoTeam } from '@/lib/myboteam';
import { STATIC_MODELS } from './myboteam-ai-utils';

export function useMyboteamAiConnect(
  connectedProvider: ConnectedProvider | undefined,
  onConnect: (provider: ConnectedProvider) => void,
  onUpdateProvider: ((provider: ConnectedProvider) => void) | undefined,
) {
  const { t } = useTranslation('settings');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [usage, setUsage] = useState<CreditUsage | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  const onConnectRef = useRef(onConnect);
  onConnectRef.current = onConnect;
  const onUpdateProviderRef = useRef(onUpdateProvider);
  onUpdateProviderRef.current = onUpdateProvider;

  const autoConnectRef = useRef<{
    attempt: number;
    timeout: ReturnType<typeof setTimeout> | null;
  }>({ attempt: 0, timeout: null });

  useEffect(() => {
    if (connectedProvider?.connectionStatus !== 'connected') return;
    if (!connectedProvider.availableModels || connectedProvider.availableModels.length === 0) {
      const update = onUpdateProviderRef.current ?? onConnectRef.current;
      update({ ...connectedProvider, availableModels: STATIC_MODELS });
    }
  }, [connectedProvider?.connectionStatus, connectedProvider?.availableModels, connectedProvider]);

  useEffect(() => {
    if (connectedProvider?.connectionStatus === 'connected') return;

    const ref = autoConnectRef.current;
    ref.attempt = 0;
    let cancelled = false;
    setUsageLoading(true);

    const tryConnect = async () => {
      try {
        const myboteam = getMyBoTeam();
        const data = await myboteam.myboteamAiEnsureReady();
        if (cancelled) return;
        if (!data.deviceFingerprint) {
          throw new Error('Missing deviceFingerprint in myboteam-ai ready response');
        }
        setConnectionError(null);

        const connected: ConnectedProvider = {
          providerId: 'myboteam-ai',
          connectionStatus: 'connected',
          credentials: {
            type: 'myboteam-ai',
            deviceFingerprint: data.deviceFingerprint,
          },
          lastConnectedAt: new Date().toISOString(),
          availableModels: STATIC_MODELS,
          selectedModelId: STATIC_MODELS[0].id,
        };
        const update = onUpdateProviderRef.current ?? onConnectRef.current;
        update(connected);
      } catch (err) {
        if (cancelled) return;
        ref.attempt += 1;
        if (ref.attempt < 5) {
          const delay = 2 ** (ref.attempt - 1) * 1000;
          ref.timeout = setTimeout(tryConnect, delay);
        } else {
          setUsageLoading(false);
          setConnectionError(err instanceof Error ? err.message : t('status.connectionFailed'));
          ref.timeout = setTimeout(tryConnect, 30_000);
        }
      }
    };

    tryConnect();

    return () => {
      cancelled = true;
      if (ref.timeout) clearTimeout(ref.timeout);
    };
  }, [connectedProvider?.connectionStatus, t]);

  useEffect(() => {
    if (connectedProvider?.connectionStatus !== 'connected') return;
    let cancelled = false;
    setUsageLoading(true);
    getMyBoTeam()
      .myboteamAiGetUsage()
      .then((data) => {
        if (!cancelled) {
          setUsage(data);
          setUsageError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setUsageError(err instanceof Error ? err.message : 'Unable to refresh credits');
        }
      })
      .finally(() => {
        if (!cancelled) setUsageLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [connectedProvider?.connectionStatus]);

  useEffect(() => {
    if (connectedProvider?.connectionStatus !== 'connected') return;
    const unsubscribe = getMyBoTeam().onMyboteamAiUsageUpdate?.((liveUsage) => {
      setUsage(liveUsage);
    });
    return () => {
      unsubscribe?.();
    };
  }, [connectedProvider?.connectionStatus]);

  useEffect(() => {
    if (connectedProvider?.connectionStatus !== 'connected') return;

    const poll = async () => {
      try {
        const data = await getMyBoTeam().myboteamAiGetUsage();
        setUsage(data);
        setUsageLoading(false);
        setUsageError(null);
      } catch (err) {
        setUsageError(err instanceof Error ? err.message : 'Unable to refresh credits');
      }
    };

    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, [connectedProvider?.connectionStatus]);

  return { connectionError, usageError, usage, usageLoading, setUsageError, setConnectionError };
}
