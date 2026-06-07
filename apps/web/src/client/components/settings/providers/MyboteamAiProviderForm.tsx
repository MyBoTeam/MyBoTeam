import type { ConnectedProvider } from '@myboteam/agent-core/common';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getMyBoTeam } from '@/lib/myboteam';
import { ProviderFormHeader } from '../shared';
import {
  ConnectionRetryNotice,
  MYBOTEAM_LOGO,
  UsagePanel,
  UsageRetryNotice,
  UsageSkeleton,
} from './myboteam-ai-utils';
import { useMyboteamAiConnect } from './useMyboteamAiConnect';

// ─── Main form ────────────────────────────────────────────────────────────────

interface MyboteamAiProviderFormProps {
  connectedProvider?: ConnectedProvider;
  onConnect: (provider: ConnectedProvider) => void;
  onUpdateProvider?: (provider: ConnectedProvider) => void;
  onDisconnect: () => void;
  onModelChange: (modelId: string) => void;
  showModelError: boolean;
}

export function MyboteamAiProviderForm({
  connectedProvider,
  onConnect,
  onUpdateProvider,
  onDisconnect,
}: MyboteamAiProviderFormProps) {
  const { t } = useTranslation('settings');
  const { connectionError, usageError, usage, usageLoading, setUsageError, setConnectionError } =
    useMyboteamAiConnect(connectedProvider, onConnect, onUpdateProvider);

  return (
    <div
      className="rounded-xl border border-border bg-card/70 p-5"
      data-testid="provider-settings-panel"
    >
      <ProviderFormHeader logoSrc={MYBOTEAM_LOGO} providerName="MyBoTeam" />

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground whitespace-pre-line">
          {t(
            'providers.myboteamAi.description',
            'Use the built-in model powered by MyBoTeam - no API key required.\nIncludes 200 free credits per month to get you started.',
          )}
        </p>

        <AnimatePresence mode="wait">
          {connectionError ? (
            <ConnectionRetryNotice key="connection-retry" />
          ) : usage ? (
            <UsagePanel key="usage" usage={usage} />
          ) : usageLoading ? (
            <UsageSkeleton key="skeleton" />
          ) : usageError ? (
            <UsageRetryNotice key="usage-retry" />
          ) : (
            <UsageSkeleton key="skeleton-fallback" />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {usage && !connectionError && usageError ? (
            <UsageRetryNotice key="usage-inline-retry" />
          ) : null}
        </AnimatePresence>

        {/* Disconnect button */}
        {connectedProvider?.connectionStatus === 'connected' && (
          <button
            onClick={async () => {
              try {
                await getMyBoTeam().myboteamAiDisconnect();
              } catch {
                // best-effort
              }
              onDisconnect();
            }}
            className="mt-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            {t('providers.myboteamAi.disconnect', 'Disconnect')}
          </button>
        )}
      </div>
    </div>
  );
}
