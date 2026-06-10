'use client';

import { ArrowLineLeft, ArrowLineRight, ChatText, Gear, List } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { DaemonStatusDot } from '@/components/common/DaemonStatusDot';
import { Button } from '@/components/ui/button';
import { ThemeColorSelector } from '@/components/ui/ThemeColorSelector';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebarStore } from '@/stores/sidebarStore';
import { cn } from '@/utils/utils';
import { NavItem } from './NavItem';
import WorkspaceSelector from './WorkspaceSelector';

function isItemActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  if (href === '/conversations') {
    return pathname === '/conversations' || pathname.startsWith('/conversations/');
  }
  return pathname.startsWith(href);
}

interface SidebarProps {
  isTitleBarHidden?: boolean;
}

export default function Sidebar({ isTitleBarHidden = false }: SidebarProps) {
  const { isCollapsed, toggleCollapse, saveSettingsReturnPath } = useSidebarStore();
  const { t } = useTranslation('sidebar');
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        'flex h-screen flex-col',
        isTitleBarHidden ? 'pt-4' : 'pt-10',
        'transition-all duration-300 ease-in-out',
        'rounded-r-[12px]',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="flex items-center justify-start shrink-0 p-3 pl-4">
        <img src="/assets/loading-symbol.svg" alt="MyBot Team Logo" className="w-8" />
        {!isCollapsed && <span className="font-bold text-lg ml-2">MyBotTeam</span>}
      </div>
      {/* Nav Items */}
      <div className="px-2 py-3 flex flex-col gap-1">
        <NavItem
          href="/"
          icon={<ChatText className="h-5 w-5" />}
          label={t('newTask')}
          isCollapsed={isCollapsed}
          isActive={isItemActive('/', location.pathname)}
        />
        <NavItem
          href="/conversations"
          icon={<List className="h-5 w-5" />}
          label={t('conversations')}
          isCollapsed={isCollapsed}
          isActive={isItemActive('/conversations', location.pathname)}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {}
      {!isCollapsed && (
        <div className="flex flex-col gap-2 px-3 py-3">
          <WorkspaceSelector onManageWorkspaces={() => navigate('/settings/workspaces')} />
        </div>
      )}

      {/* Bottom bar - ThemeColor left, Daemon/Settings/Collapse right (always visible) */}
      <div className={cn('flex items-center px-3 py-3 gap-2', isCollapsed ? 'flex-col' : '')}>
        {!isCollapsed && <ThemeColorSelector />}

        <div className={cn('flex items-center gap-2', isCollapsed ? 'flex-col' : 'ml-auto')}>
          <DaemonStatusDot />

          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    saveSettingsReturnPath(location.pathname);
                    navigate('/settings/general');
                  }}
                  title={t('settings')}
                >
                  <Gear className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{t('settings')}</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                saveSettingsReturnPath(location.pathname);
                navigate('/settings/general');
              }}
              title={t('settings')}
            >
              <Gear className="h-4 w-4" />
            </Button>
          )}

          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleCollapse}
                  className="shrink-0"
                  title={t('expandSidebar')}
                >
                  <ArrowLineRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{t('expandSidebar')}</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="shrink-0"
              title={t('collapseSidebar')}
            >
              <ArrowLineLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
