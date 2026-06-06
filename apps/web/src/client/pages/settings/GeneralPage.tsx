import { GeneralTab } from '@/components/settings/GeneralTab';
import { useSettings } from '@/hooks/useSettings';

export function GeneralPage() {
  const { notificationsEnabled, debugMode, handleNotificationsToggle, handleDebugToggle } =
    useSettings();

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      <div className="pt-5 pb-3">
        <h3 className="text-sm font-semibold text-foreground">General</h3>
      </div>
      <GeneralTab
        notificationsEnabled={notificationsEnabled}
        onNotificationsToggle={handleNotificationsToggle}
        debugMode={debugMode}
        onDebugToggle={handleDebugToggle}
      />
    </div>
  );
}
