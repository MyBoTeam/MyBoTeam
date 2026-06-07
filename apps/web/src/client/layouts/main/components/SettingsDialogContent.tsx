import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AboutTab } from '@/pages/settings/about/components/AboutTab';
import { CloudBrowsersPanel } from '@/pages/settings/browsers/components/CloudBrowsersPanel';
import { GeneralTab } from '@/pages/settings/general/components/GeneralTab';
import { SandboxSection } from '@/pages/settings/general/components/SandboxSection';
import { SpeechSettingsForm } from '@/pages/settings/general/components/SpeechSettingsForm';
import { IntegrationsPanel } from '@/pages/settings/integrations/components/IntegrationsPanel';
import { ProviderGrid } from '@/pages/settings/providers/components/ProviderGrid';
import { ProviderSettingsPanel } from '@/pages/settings/providers/components/ProviderSettingsPanel';
import { SchedulerPanel } from '@/pages/settings/scheduler/components/SchedulerPanel';
import { AddSkillDropdown, SkillsPanel } from '@/pages/settings/skills/components';
import { WorkspacesPanel } from '@/pages/settings/workspaces/components/WorkspacesPanel';
import { settingsTransitions, settingsVariants } from '@/utils/animations';
import type { UseSettingsDialogReturn } from '../hooks/useSettingsDialog';
import { SETTINGS_TABS } from './settings-tabs';

interface SettingsDialogContentProps {
  s: UseSettingsDialogReturn;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialogContent({ s, onOpenChange }: SettingsDialogContentProps) {
  const { t } = useTranslation('settings');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <h3 className="text-sm font-semibold text-foreground">
          {(() => {
            const activeTabDef = SETTINGS_TABS.find((tab) => tab.id === s.activeTab);
            return activeTabDef ? t(activeTabDef.labelKey) : null;
          })()}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-6">
          <AnimatePresence>
            {s.closeWarning && (
              <motion.div
                className="rounded-lg border border-warning bg-warning/10 p-4 mb-6"
                variants={settingsVariants.fadeSlide}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={settingsTransitions.enter}
              >
                <div className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 text-warning flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-warning">
                      {t('warnings.noProviderReady')}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('warnings.noProviderReadyDescription')}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={s.handleForceClose}
                        className="rounded-md px-3 py-1.5 text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80"
                      >
                        {t('warnings.closeAnyway')}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {s.activeTab === 'providers' && (
            <div className="space-y-6">
              <section>
                <ProviderGrid
                  settings={s.settings}
                  selectedProvider={s.selectedProvider}
                  onSelectProvider={s.handleSelectProvider}
                  expanded={s.gridExpanded}
                  onToggleExpanded={() => s.setGridExpanded(!s.gridExpanded)}
                />
              </section>
              <AnimatePresence>
                {s.selectedProvider && (
                  <motion.section
                    variants={settingsVariants.slideDown}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={settingsTransitions.enter}
                  >
                    <ProviderSettingsPanel
                      key={s.selectedProvider}
                      providerId={s.selectedProvider}
                      connectedProvider={s.settings?.connectedProviders?.[s.selectedProvider]}
                      onConnect={s.handleConnect}
                      onUpdateProvider={s.handleUpdateProvider}
                      onDisconnect={s.handleDisconnect}
                      onModelChange={s.handleModelChange}
                      showModelError={s.showModelError}
                    />
                  </motion.section>
                )}
              </AnimatePresence>
              <SandboxSection visible={!!s.selectedProvider} />
            </div>
          )}

          {s.activeTab === 'skills' && (
            <div className="space-y-4">
              <SkillsPanel refreshTrigger={s.skillsRefreshTrigger} />
            </div>
          )}
          {s.activeTab === 'browsers' && (
            <div className="space-y-6">
              <CloudBrowsersPanel />
            </div>
          )}
          {s.activeTab === 'integrations' && (
            <div className="space-y-6">
              <IntegrationsPanel />
            </div>
          )}
          {s.activeTab === 'scheduler' && (
            <div className="space-y-6">
              <SchedulerPanel />
            </div>
          )}
          {s.activeTab === 'workspaces' && (
            <div className="space-y-6">
              <WorkspacesPanel />
            </div>
          )}
          {s.activeTab === 'voice' && (
            <div className="space-y-6">
              <SpeechSettingsForm />
            </div>
          )}
          {s.activeTab === 'general' && (
            <GeneralTab
              notificationsEnabled={s.notificationsEnabled}
              onNotificationsToggle={s.handleNotificationsToggle}
              debugMode={s.debugMode}
              onDebugToggle={s.handleDebugToggle}
            />
          )}
          {s.activeTab === 'about' && <AboutTab />}

          <div className="mt-4 flex items-center justify-between">
            <div>
              {s.activeTab === 'skills' && (
                <AddSkillDropdown
                  onSkillAdded={() => s.setSkillsRefreshTrigger((prev) => prev + 1)}
                  onClose={() => onOpenChange(false)}
                />
              )}
            </div>
            <button
              onClick={s.handleDone}
              className="flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              data-testid="settings-done-button"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {t('buttons.done')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
