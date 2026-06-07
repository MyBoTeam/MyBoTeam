import { useTranslation } from 'react-i18next';
import { DaemonSection } from './DaemonSection';
import { DebugSection } from './DebugSection';
import { LanguageSelector } from './LanguageSelector';
import { NotificationsSection } from './NotificationsSection';
import { SpeechSettingsForm } from './SpeechSettingsForm';
import { ThemeSelector } from './ThemeSelector';

interface GeneralTabProps {
  notificationsEnabled: boolean;
  onNotificationsToggle: () => void;
  debugMode: boolean;
  onDebugToggle: () => void;
}

export function GeneralTab({
  notificationsEnabled,
  onNotificationsToggle,
  debugMode,
  onDebugToggle,
}: GeneralTabProps) {
  const { t } = useTranslation('settings');

  return (
    <div className="space-y-6">
      <ThemeSelector />
      <LanguageSelector />

      <section>
        <NotificationsSection enabled={notificationsEnabled} onToggle={onNotificationsToggle} />
      </section>

      <section>
        <DaemonSection />
      </section>

      <section>
        <h4 className="text-xs font-medium uppercase tracking-wide text-foreground mb-3">
          {t('developer.title')}
        </h4>
        <DebugSection debugMode={debugMode} onDebugToggle={onDebugToggle} />
      </section>
      <section>
        <div className="pt-5 pb-3">
          <h4 className="text-xs font-medium uppercase tracking-wide text-foreground mb-3">
            Voice Input
          </h4>
        </div>
        <SpeechSettingsForm />
      </section>
    </div>
  );
}
