import type { ConnectedProvider, ProviderId } from '@myboteam/agent-core/common';
import { AnimatePresence, motion } from 'framer-motion';
import { settingsTransitions, settingsVariants } from '@/lib/animations';
import { ProviderFormSelector } from './ProviderFormSelector';

interface ProviderSettingsPanelProps {
  providerId: ProviderId;
  connectedProvider?: ConnectedProvider;
  onConnect: (provider: ConnectedProvider) => void;
  onUpdateProvider?: (provider: ConnectedProvider) => void;
  onDisconnect: () => void;
  onModelChange: (modelId: string) => void;
  showModelError: boolean;
}

export function ProviderSettingsPanel({
  providerId,
  connectedProvider,
  onConnect,
  onUpdateProvider,
  onDisconnect,
  onModelChange,
  showModelError,
}: ProviderSettingsPanelProps) {
  return (
    <div className="min-h-[260px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={providerId}
          variants={settingsVariants.slideDown}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={settingsTransitions.enter}
        >
          <ProviderFormSelector
            providerId={providerId}
            connectedProvider={connectedProvider}
            onConnect={onConnect}
            onUpdateProvider={onUpdateProvider}
            onDisconnect={onDisconnect}
            onModelChange={onModelChange}
            showModelError={showModelError}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
