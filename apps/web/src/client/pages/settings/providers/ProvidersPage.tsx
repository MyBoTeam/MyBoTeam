import type { ConnectedProvider, ProviderId } from '@myboteam/agent-core/common';
import { isProviderReady } from '@myboteam/agent-core/common';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useSettings } from '@/hooks/useSettings';
import { FIRST_FOUR_PROVIDERS } from '@/pages/settings/settings-tabs';
import { settingsTransitions, settingsVariants } from '@/utils/animations';
import { SandboxSection } from '../general/components/SandboxSection';
import { ProviderGrid } from './components/ProviderGrid';
import { ProviderSettingsPanel } from './components/ProviderSettingsPanel';

interface ProvidersPageProps {
  onApiKeySaved?: () => void;
}

export function ProvidersPage({ onApiKeySaved }: ProvidersPageProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [gridExpanded, setGridExpanded] = useState(false);
  const [showModelError, setShowModelError] = useState(false);

  const { settings, loading, setActiveProvider, connectProvider, disconnectProvider, updateModel } =
    useSettings();

  const selectedProvider = searchParams.get('select') as ProviderId | null;

  const handleSelectProvider = useCallback(
    async (providerId: ProviderId) => {
      setSearchParams({ select: providerId }, { replace: true });
      setShowModelError(false);
      if (!FIRST_FOUR_PROVIDERS.includes(providerId as (typeof FIRST_FOUR_PROVIDERS)[number])) {
        setGridExpanded(true);
      }
      const provider = settings?.connectedProviders?.[providerId];
      if (provider && isProviderReady(provider)) {
        await setActiveProvider(providerId);
      }
    },
    [setSearchParams, settings?.connectedProviders, setActiveProvider],
  );

  const handleConnect = useCallback(
    async (provider: ConnectedProvider) => {
      await connectProvider(provider.providerId, provider);
      if (isProviderReady(provider)) {
        await setActiveProvider(provider.providerId);
        onApiKeySaved?.();
      }
    },
    [connectProvider, setActiveProvider, onApiKeySaved],
  );

  const handleDisconnect = useCallback(async () => {
    if (!selectedProvider) return;
    const wasActive = settings?.activeProviderId === selectedProvider;
    await disconnectProvider(selectedProvider);
    setSearchParams({}, { replace: true });
    if (wasActive && settings?.connectedProviders) {
      const readyId = Object.keys(settings.connectedProviders).find(
        (id) =>
          id !== selectedProvider && isProviderReady(settings.connectedProviders[id as ProviderId]),
      ) as ProviderId | undefined;
      if (readyId) {
        await setActiveProvider(readyId);
      }
    }
  }, [selectedProvider, disconnectProvider, settings, setActiveProvider, setSearchParams]);

  const handleModelChange = useCallback(
    async (modelId: string) => {
      if (!selectedProvider) return;
      await updateModel(selectedProvider, modelId);
      const provider = settings?.connectedProviders[selectedProvider];
      if (provider && isProviderReady({ ...provider, selectedModelId: modelId })) {
        if (!settings?.activeProviderId || settings.activeProviderId !== selectedProvider) {
          await setActiveProvider(selectedProvider);
        }
      }
      setShowModelError(false);
      onApiKeySaved?.();
    },
    [selectedProvider, updateModel, settings, setActiveProvider, onApiKeySaved],
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      <div className="pt-5 pb-3">
        <h3 className="text-sm font-semibold text-foreground">Providers</h3>
      </div>
      <div className="space-y-6">
        <section>
          {settings && (
            <ProviderGrid
              settings={settings}
              selectedProvider={selectedProvider}
              onSelectProvider={handleSelectProvider}
              expanded={gridExpanded}
              onToggleExpanded={() => setGridExpanded(!gridExpanded)}
            />
          )}
        </section>
        <AnimatePresence>
          {selectedProvider && settings && (
            <motion.section
              key={selectedProvider}
              variants={settingsVariants.slideDown}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={settingsTransitions.enter}
            >
              <ProviderSettingsPanel
                providerId={selectedProvider}
                connectedProvider={settings.connectedProviders[selectedProvider]}
                onConnect={handleConnect}
                onUpdateProvider={(provider: ConnectedProvider) =>
                  selectedProvider && connectProvider(selectedProvider, provider)
                }
                onDisconnect={handleDisconnect}
                onModelChange={handleModelChange}
                showModelError={showModelError}
              />
            </motion.section>
          )}
        </AnimatePresence>
        <SandboxSection visible={!!selectedProvider} />
      </div>
    </div>
  );
}
