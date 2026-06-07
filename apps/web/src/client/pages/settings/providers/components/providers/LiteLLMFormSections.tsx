import type { ConnectedProvider, LiteLLMCredentials } from '@myboteam/agent-core';

export { LiteLLMDisconnectedForm } from './LiteLLMDisconnectedForm';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { settingsTransitions, settingsVariants } from '@/utils/animations';
import { ConnectedControls, ModelSelector } from '../shared';

export interface LiteLLMConnectedSectionProps {
  connectedProvider: ConnectedProvider;
  onDisconnect: () => void;
  onModelChange: (modelId: string) => void;
  showModelError: boolean;
}

export function LiteLLMConnectedSection({
  connectedProvider,
  onDisconnect,
  onModelChange,
  showModelError,
}: LiteLLMConnectedSectionProps) {
  const { t } = useTranslation('settings');
  const creds = connectedProvider.credentials as LiteLLMCredentials;
  const models = connectedProvider.availableModels || [];
  return (
    <motion.div
      key="connected"
      variants={settingsVariants.fadeSlide}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={settingsTransitions.enter}
      className="space-y-3"
    >
      <div className="space-y-3">
        <div>
          <label
            htmlFor="litellm-server-url-connected"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            {t('litellm.serverUrl')}
          </label>
          <input
            id="litellm-server-url-connected"
            type="text"
            value={creds?.serverUrl || 'http://localhost:4000'}
            disabled
            className="w-full rounded-md border border-input bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground"
          />
        </div>
        {creds?.hasApiKey && (
          <div>
            <label
              htmlFor="litellm-api-key-connected"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              {t('apiKey.title')}
            </label>
            <input
              id="litellm-api-key-connected"
              type="text"
              value={creds?.keyPrefix || t('apiKey.saved')}
              disabled
              className="w-full rounded-md border border-input bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground"
            />
          </div>
        )}
      </div>
      <ConnectedControls onDisconnect={onDisconnect} />
      <ModelSelector
        models={models}
        value={connectedProvider.selectedModelId}
        onChange={onModelChange}
        error={showModelError && !connectedProvider.selectedModelId}
      />
    </motion.div>
  );
}
