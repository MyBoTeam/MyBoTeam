import { Tabs, TabsContent, TabsList, TabsTrigger } from '@myboteam/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { settingsTransitions, settingsVariants } from '@/utils/animations';
import { ConnectorAddForm } from '../../connectors/components/ConnectorAddForm';
import { ConnectorList } from '../../connectors/components/ConnectorList';
import { SlackConnectorSection } from '../../connectors/components/SlackConnectorSection';
import { useConnectorsPanel } from '../../connectors/components/useConnectorsPanel';
import { ConnectorCardsSection } from './ConnectorCardsSection';
import { WhatsAppCard } from './WhatsAppCard';

export function IntegrationsPanel() {
  const { t } = useTranslation('settings');
  const {
    connectors,
    slackAuth,
    builtInAuthStates,
    builtInActionLoading,
    loading,
    deleteConnector,
    toggleEnabled,
    disconnect,
    url,
    adding,
    slackActionLoading,
    addError,
    tabError,
    dismissTabError,
    handleAdd,
    handleConnect,
    handleBuiltInAuthenticate,
    handleBuiltInDisconnect,
    handleSlackAuthenticate,
    handleSlackDisconnect,
    handleKeyDown,
    handleUrlChange,
    refetch,
  } = useConnectorsPanel();

  return (
    <div data-testid="integrations-panel">
      <AnimatePresence>
        {tabError && (
          <motion.div
            className="mt-3 flex items-center justify-between rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive"
            variants={settingsVariants.fadeSlide}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={settingsTransitions.enter}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            data-testid="tab-error-zone"
          >
            <span>{tabError}</span>
            <button
              onClick={dismissTabError}
              aria-label={t('integrations.errorDismiss')}
              className="ml-3 shrink-0 text-destructive opacity-70 hover:opacity-100"
              data-testid="tab-error-dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs defaultValue="messaging">
        <TabsList>
          <TabsTrigger value="messaging">{t('integrations.tabs.messaging')}</TabsTrigger>
          <TabsTrigger value="connectors">{t('integrations.tabs.connectors')}</TabsTrigger>
          <TabsTrigger value="custom">{t('integrations.tabs.custom')}</TabsTrigger>
        </TabsList>

        <TabsContent value="messaging">
          <div className="space-y-3">
            <WhatsAppCard />

            <SlackConnectorSection
              slackAuth={slackAuth}
              slackActionLoading={slackActionLoading}
              onAuthenticate={handleSlackAuthenticate}
              onDisconnect={handleSlackDisconnect}
            />

            {(['Telegram', 'Microsoft Teams'] as const).map((name) => (
              <div
                key={name}
                className="rounded-lg border border-border/50 bg-card/70 overflow-hidden opacity-60"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted" />
                    <div>
                      <span className="font-medium text-foreground text-sm">{name}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('integrations.comingSoon')}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {t('integrations.comingSoon')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="connectors">
          <ConnectorCardsSection
            builtInAuthStates={builtInAuthStates}
            builtInActionLoading={builtInActionLoading}
            onAuthenticate={handleBuiltInAuthenticate}
            onDisconnect={handleBuiltInDisconnect}
            refetch={refetch}
          />
        </TabsContent>

        <TabsContent value="custom">
          {loading ? (
            <div className="flex h-[120px] items-center justify-center">
              <div className="text-sm text-muted-foreground">{t('connectors.loading')}</div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <ConnectorAddForm
                url={url}
                adding={adding}
                onUrlChange={handleUrlChange}
                onAdd={handleAdd}
                onKeyDown={handleKeyDown}
              />

              <AnimatePresence>
                {addError && (
                  <motion.div
                    className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    variants={settingsVariants.fadeSlide}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={settingsTransitions.enter}
                    role="alert"
                    aria-live="assertive"
                    aria-atomic="true"
                  >
                    {addError}
                  </motion.div>
                )}
              </AnimatePresence>

              <ConnectorList
                connectors={connectors}
                onConnect={handleConnect}
                onDisconnect={disconnect}
                onToggleEnabled={toggleEnabled}
                onDelete={deleteConnector}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
