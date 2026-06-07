import type { ApiKeyCredentials, ConnectedProvider, ProviderId } from '@myboteam/agent-core';
import { DEFAULT_PROVIDERS } from '@myboteam/agent-core/common';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getMyBoTeam } from '@/config/myboteam';
import { createLogger } from '@/utils/logger';
import { useProviderModels } from './useProviderModels';

const logger = createLogger('useApiKeyConnect');

export interface UseApiKeyConnectOptions {
  providerId: ProviderId;
  connectedProvider?: ConnectedProvider;
  onConnect: (provider: ConnectedProvider) => void;
  isOpenAI: boolean;
  hasEditableBaseUrl: boolean;
  defaultBaseUrl: string;
}

export interface UseApiKeyConnectReturn {
  apiKey: string;
  setApiKey: (v: string) => void;
  connecting: boolean;
  error: string | null;
  setError: (v: string | null) => void;
  openAiBaseUrl: string;
  setOpenAiBaseUrl: (v: string) => void;
  customBaseUrl: string;
  setCustomBaseUrl: (v: string) => void;
  fetchedModels: Array<{ id: string; name: string }> | null;
  isConnected: boolean;
  handleConnect: () => Promise<void>;
}

export function useApiKeyConnect({
  providerId,
  connectedProvider,
  onConnect,
  isOpenAI,
  hasEditableBaseUrl,
  defaultBaseUrl,
}: UseApiKeyConnectOptions): UseApiKeyConnectReturn {
  const { t } = useTranslation('settings');
  const [apiKey, setApiKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openAiBaseUrl, setOpenAiBaseUrl] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');

  const providerConfig = DEFAULT_PROVIDERS.find((p) => p.id === providerId);
  const isConnected = connectedProvider?.connectionStatus === 'connected';
  const connectedProviderBaseUrl = hasEditableBaseUrl
    ? connectedProvider?.customBaseUrl || defaultBaseUrl || undefined
    : undefined;

  useEffect(() => {
    if (!isOpenAI) return;
    const controller = new AbortController();
    const myboteam = getMyBoTeam();
    myboteam
      .getOpenAiBaseUrl()
      .then((url) => {
        if (!controller.signal.aborted) setOpenAiBaseUrl(url);
      })
      .catch((err) => {
        if (!controller.signal.aborted) logger.error('Failed to load OpenAI base URL:', err);
      });
    return () => controller.abort();
  }, [isOpenAI]);

  useEffect(() => {
    if (!hasEditableBaseUrl) return;
    setCustomBaseUrl(connectedProvider?.customBaseUrl || '');
  }, [hasEditableBaseUrl, connectedProvider?.customBaseUrl]);

  const fetchedModels = useProviderModels({
    providerId,
    connectedProvider,
    isConnected,
    isOpenAI,
    openAiBaseUrl,
    connectedProviderBaseUrl,
  });

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setError(t('apiKey.enterKeyRequired'));
      return;
    }
    if (isOpenAI && openAiBaseUrl.trim()) {
      try {
        const parsed = new URL(openAiBaseUrl.trim());
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          setError(t('connectors.urlMustBeHttp'));
          return;
        }
      } catch {
        setError(t('connectors.invalidUrl'));
        return;
      }
    }
    if (hasEditableBaseUrl && customBaseUrl.trim()) {
      try {
        const parsed = new URL(customBaseUrl.trim());
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          setError(t('connectors.urlMustBeHttp'));
          return;
        }
      } catch {
        setError(t('connectors.invalidUrl'));
        return;
      }
    }
    setConnecting(true);
    setError(null);
    try {
      const myboteam = getMyBoTeam();

      let resolvedBaseUrl: string | undefined;
      if (isOpenAI) {
        resolvedBaseUrl = openAiBaseUrl.trim() || undefined;
        await myboteam.setOpenAiBaseUrl(resolvedBaseUrl ?? '');
      } else if (hasEditableBaseUrl) {
        const explicitCustomBaseUrl = customBaseUrl.trim();
        resolvedBaseUrl = explicitCustomBaseUrl || defaultBaseUrl || undefined;
      }
      const explicitCustomBaseUrl = hasEditableBaseUrl && !isOpenAI ? customBaseUrl.trim() : '';
      const validation = await myboteam.validateApiKeyForProvider(providerId, apiKey.trim(), {
        baseUrl: resolvedBaseUrl,
      });
      if (!validation.valid) {
        setError(validation.error || t('apiKey.invalidKey'));
        setConnecting(false);
        return;
      }

      await myboteam.addApiKey(providerId as any, apiKey.trim());
      let models: Array<{ id: string; name: string }> | undefined;
      if (providerConfig?.modelsEndpoint) {
        const fetchResult = await myboteam.fetchProviderModels(providerId, {
          baseUrl: resolvedBaseUrl,
        });
        if (fetchResult.success && fetchResult.models) {
          models = fetchResult.models;
        }
      }
      const defaultModelId = providerConfig?.defaultModelId ?? null;
      const resolvedModelId = models?.some((m) => m.id === defaultModelId) ? defaultModelId : null;
      const trimmedKey = apiKey.trim();
      onConnect({
        providerId,
        connectionStatus: 'connected',
        selectedModelId: resolvedModelId,
        credentials: {
          type: 'api_key',
          keyPrefix: trimmedKey.length > 20 ? `${trimmedKey.substring(0, 20)}...` : trimmedKey,
        } as ApiKeyCredentials,
        lastConnectedAt: new Date().toISOString(),
        ...(models ? { availableModels: models } : {}),
        ...(explicitCustomBaseUrl ? { customBaseUrl: explicitCustomBaseUrl } : {}),
      });
      setApiKey('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('status.connectionFailed'));
    } finally {
      setConnecting(false);
    }
  };

  return {
    apiKey,
    setApiKey,
    connecting,
    error,
    setError,
    openAiBaseUrl,
    setOpenAiBaseUrl,
    customBaseUrl,
    setCustomBaseUrl,
    fetchedModels,
    isConnected,
    handleConnect,
  };
}
