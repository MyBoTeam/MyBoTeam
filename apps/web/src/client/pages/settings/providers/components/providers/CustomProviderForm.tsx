import type { ConnectedProvider, CustomCredentials } from '@myboteam/agent-core';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { settingsTransitions, settingsVariants } from '@/lib/animations';
import { getMyBoTeam } from '@/lib/myboteam';
import customLogo from '/assets/ai-logos/custom.svg';
import { ProviderFormHeader } from '../shared';
import { CustomProviderConnectedSection } from './CustomProviderConnectedSection';
import { CustomProviderInputs } from './CustomProviderInputs';

interface CustomProviderFormProps {
  connectedProvider?: ConnectedProvider;
  onConnect: (provider: ConnectedProvider) => void;
  onDisconnect: () => void;
  onModelChange: (modelId: string) => void;
  showModelError: boolean;
}

export function CustomProviderForm({
  connectedProvider,
  onConnect,
  onDisconnect,
  onModelChange: _onModelChange,
  showModelError,
}: CustomProviderFormProps) {
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = connectedProvider?.connectionStatus === 'connected';

  const handleConnect = async () => {
    if (!baseUrl.trim()) {
      setError('Base URL is required');
      return;
    }

    const trimmedUrl = baseUrl.trim();
    if (trimmedUrl.includes('/chat/completions')) {
      setError('Base URL should not include /chat/completions (it is added automatically)');
      return;
    }
    if (trimmedUrl.includes('/completions')) {
      setError('Base URL should end with /v1, not /completions');
      return;
    }

    if (!modelName.trim()) {
      setError('Model name is required');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const myboteam = getMyBoTeam();
      const trimmedKey = apiKey.trim() || undefined;

      const result = await myboteam.testCustomConnection(baseUrl.trim(), trimmedKey);
      if (!result.success) {
        setError(result.error || 'Connection failed');
        setConnecting(false);
        return;
      }

      if (trimmedKey) {
        await myboteam.addApiKey('custom', trimmedKey);
      } else {
        await myboteam.removeApiKey('custom');
      }

      const fullModelId = `custom/${modelName.trim()}`;

      const provider: ConnectedProvider = {
        providerId: 'custom',
        connectionStatus: 'connected',
        selectedModelId: fullModelId,
        credentials: {
          type: 'custom',
          baseUrl: baseUrl.trim(),
          modelName: modelName.trim(),
          hasApiKey: !!trimmedKey,
          keyPrefix: trimmedKey ? `••••${trimmedKey.slice(-4)}` : undefined,
        } as CustomCredentials,
        lastConnectedAt: new Date().toISOString(),
        availableModels: [{ id: fullModelId, name: modelName.trim() }],
      };

      onConnect(provider);
      setApiKey('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div
      className="rounded-xl border border-border bg-card/70 p-5"
      data-testid="provider-settings-panel"
    >
      <ProviderFormHeader logoSrc={customLogo} providerName="Custom Endpoint" />

      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {!isConnected ? (
            <motion.div
              key="disconnected"
              variants={settingsVariants.fadeSlide}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={settingsTransitions.enter}
              className="space-y-3"
            >
              <CustomProviderInputs
                baseUrl={baseUrl}
                apiKey={apiKey}
                modelName={modelName}
                connecting={connecting}
                error={error}
                onBaseUrlChange={setBaseUrl}
                onApiKeyChange={setApiKey}
                onModelNameChange={setModelName}
                onConnect={handleConnect}
              />
            </motion.div>
          ) : (
            <CustomProviderConnectedSection
              connectedProvider={connectedProvider!}
              onDisconnect={onDisconnect}
              showModelError={showModelError}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
