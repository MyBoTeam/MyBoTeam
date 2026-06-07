import type { ConnectedProvider, LiteLLMCredentials } from '@myboteam/agent-core/common';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getMyBoTeam } from '@/config/myboteam';
import litellmLogo from '/assets/ai-logos/litellm.svg';
import { ProviderFormHeader } from '../shared';
import { LiteLLMConnectedSection, LiteLLMDisconnectedForm } from './LiteLLMFormSections';

interface LiteLLMProviderFormProps {
  connectedProvider?: ConnectedProvider;
  onConnect: (provider: ConnectedProvider) => void;
  onDisconnect: () => void;
  onModelChange: (modelId: string) => void;
  showModelError: boolean;
}

export function LiteLLMProviderForm({
  connectedProvider,
  onConnect,
  onDisconnect,
  onModelChange,
  showModelError,
}: LiteLLMProviderFormProps) {
  const { t } = useTranslation('settings');
  const [serverUrl, setServerUrl] = useState('http://localhost:4000');
  const [apiKey, setApiKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = connectedProvider?.connectionStatus === 'connected';

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);

    try {
      const myboteam = getMyBoTeam();
      const trimmedKey = apiKey.trim() || undefined;

      const result = await myboteam.testLiteLLMConnection(serverUrl, trimmedKey);
      if (!result.success) {
        setError(result.error || t('status.connectionFailed'));
        setConnecting(false);
        return;
      }

      if (trimmedKey) {
        await myboteam.addApiKey('litellm', trimmedKey);
      } else {
        await myboteam.removeApiKey('litellm');
      }

      const models =
        result.models?.map((m) => ({
          id: m.id,
          name: m.name,
        })) || [];

      const provider: ConnectedProvider = {
        providerId: 'litellm',
        connectionStatus: 'connected',
        selectedModelId: null,
        credentials: {
          type: 'litellm',
          serverUrl,
          hasApiKey: !!trimmedKey,
          keyPrefix: trimmedKey ? `${trimmedKey.substring(0, 10)}...` : undefined,
        } as LiteLLMCredentials,
        lastConnectedAt: new Date().toISOString(),
        availableModels: models,
      };

      onConnect(provider);
      setApiKey('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('status.connectionFailed'));
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div
      className="rounded-xl border border-border bg-card/70 p-5"
      data-testid="provider-settings-panel"
    >
      <ProviderFormHeader logoSrc={litellmLogo} providerName={t('providers.litellm')} />
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {!isConnected ? (
            <LiteLLMDisconnectedForm
              serverUrl={serverUrl}
              onServerUrlChange={setServerUrl}
              apiKey={apiKey}
              onApiKeyChange={setApiKey}
              connecting={connecting}
              error={error}
              onConnect={handleConnect}
            />
          ) : (
            <LiteLLMConnectedSection
              connectedProvider={connectedProvider}
              onDisconnect={onDisconnect}
              onModelChange={onModelChange}
              showModelError={showModelError}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
