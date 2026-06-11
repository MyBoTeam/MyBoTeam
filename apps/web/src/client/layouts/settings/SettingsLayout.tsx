import { ArrowLeft } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { CloseConfirmDialog } from '@/components/common/CloseConfirmDialog';
import { SETTINGS_TABS } from '@/pages/settings/settings-tabs';
import { useSidebarStore } from '@/stores/sidebarStore';
import { cn } from '@/utils/utils';

export default function SettingsLayout() {
  const { t } = useTranslation('settings');
  const location = useLocation();
  const navigate = useNavigate();
  const { popSettingsReturnPath } = useSidebarStore();

  const pathPart = location.pathname.split('/settings/')[1] || 'general';
  const activeTab = SETTINGS_TABS.find((tab) => tab.id === pathPart)?.id ?? 'general';

  const handleBack = () => {
    const returnPath = popSettingsReturnPath();
    navigate(returnPath || '/');
  };

  return (
    <div className="flex h-full overflow-hidden h-screen">
      <nav className="w-52 shrink-0 bg-popover/70 rounded-r-[12px] p-4 flex flex-col gap-1 pt-12">
        <button
          onClick={handleBack}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {t('back')}
        </button>
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(`/settings/${tab.id}`)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-foreground hover:text-foreground hover:bg-background/50',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(tab.labelKey)}
            </button>
          );
        })}
      </nav>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
      <CloseConfirmDialog />
    </div>
  );
}
