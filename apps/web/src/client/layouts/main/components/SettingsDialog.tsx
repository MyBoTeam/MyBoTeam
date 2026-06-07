import type { ProviderId } from '@myboteam/agent-core/common';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/utils/utils';
import logoImage from '/assets/logo-1.png';
import { useSettingsDialog } from '../hooks/useSettingsDialog';
import { SettingsDialogContent } from './SettingsDialogContent';
import { SETTINGS_TABS, type SettingsTabId } from './settings-tabs';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiKeySaved?: () => void;
  initialProvider?: ProviderId;
  initialTab?: SettingsTabId;
}

export function SettingsDialog({
  open,
  onOpenChange,
  onApiKeySaved,
  initialProvider,
  initialTab = 'providers',
}: SettingsDialogProps) {
  const { t } = useTranslation('settings');
  const s = useSettingsDialog({
    open,
    onOpenChange,
    onApiKeySaved,
    initialProvider,
    initialTab,
  });

  if (s.loading || !s.settings) {
    return (
      <Dialog open={open} onOpenChange={s.handleOpenChange}>
        <DialogContent
          className="w-full h-[80vh] flex flex-col overflow-hidden p-0"
          data-testid="settings-dialog"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{t('title')}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={s.handleOpenChange}>
      <DialogContent
        className="w-full h-[65vh] flex overflow-hidden p-0"
        data-testid="settings-dialog"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <nav className="w-48 shrink-0 border-r border-border bg-muted/30 p-3 flex flex-col gap-1">
          <div className="px-3 py-2 mb-1">
            <img
              src={logoImage}
              alt="MyBoTeam"
              className="dark:invert"
              style={{ height: '20px', paddingLeft: '6px' }}
            />
          </div>
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => s.setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left',
                s.activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
              )}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              {t(tab.labelKey)}
            </button>
          ))}
        </nav>

        <SettingsDialogContent s={s} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}

export default SettingsDialog;
