# Collapsible Sidebar & Conversations Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the left sidebar to be collapsible (v0.2.0 pattern) and extract the conversation list into a `/conversations` page. Convert settings from a dialog overlay to route-based pages.

**Architecture:** Zustand store with localStorage persist for collapsed state. Sidebar toggles between `w-64` (expanded) and `w-16` (collapsed). Conversations page owns task subscriptions. Settings use `SettingsLayout` wrapper with sidebar nav + `<Outlet />`. A simplified `AuthSettingsDialog` is kept for OAuth re-login flow only.

**Tech Stack:** React, TypeScript, Zustand (sidebar store), Framer Motion, Tailwind CSS v4, React Router (hash)

---

## File Structure

### New Files
| File | Purpose |
|------|---------|
| `apps/web/src/client/stores/sidebarStore.ts` | Zustand store: `isCollapsed` + `toggleCollapse`, persisted |
| `apps/web/src/client/hooks/useSettings.ts` | Shared settings state: debug/notifications/appVersion + provider data |
| `apps/web/src/client/pages/ConversationsPage.tsx` | Full-page conversation list with task subscriptions |
| `apps/web/src/client/components/layout/SettingsLayout.tsx` | Route wrapper: settings nav sidebar + `<Outlet />` |
| `apps/web/src/client/pages/settings/ProvidersPage.tsx` | Provider grid + connection panel as a page |
| `apps/web/src/client/pages/settings/SkillsPage.tsx` | Skills panel page |
| `apps/web/src/client/pages/settings/BrowsersPage.tsx` | Cloud browsers panel page |
| `apps/web/src/client/pages/settings/WorkspacesPage.tsx` | Workspaces panel page |
| `apps/web/src/client/pages/settings/IntegrationsPage.tsx` | Integrations panel page |
| `apps/web/src/client/pages/settings/SchedulerPage.tsx` | Scheduler panel page |
| `apps/web/src/client/pages/settings/VoicePage.tsx` | Voice/speech settings page |
| `apps/web/src/client/pages/settings/GeneralPage.tsx` | General settings page (notifications, debug) |
| `apps/web/src/client/pages/settings/AboutPage.tsx` | App version info page |
| `apps/web/src/client/components/layout/AuthSettingsDialog.tsx` | Simplified providers-only dialog for OAuth re-login |

### Modified Files
| File | Changes |
|------|---------|
| `apps/web/src/client/components/layout/Sidebar.tsx` | Full rewrite: collapsible, nav items, restructured sections |
| `apps/web/src/client/router.tsx` | Add `/conversations` + `/settings/*` routes, lazy imports |
| `apps/web/src/client/App.tsx` | Replace SettingsDialog with AuthSettingsDialog |
| `apps/web/src/client/pages/Home.tsx` | Remove SettingsDialog |
| `apps/web/src/client/pages/home/useHomePage.ts` | Replace dialog open with `navigate()` |
| `apps/web/src/client/pages/home/useHomePageSettings.ts` | Replace dialog state with navigation |

### Removed Files
| File | Reason |
|------|--------|
| `apps/web/src/client/components/layout/SettingsDialog.tsx` | Replaced by route-based settings pages |
| `apps/web/src/client/components/layout/useSettingsDialog.ts` | Logic replaced by useSettings hook + per-page state |

---

### Task 1: Create sidebarStore

**Files:**
- Create: `apps/web/src/client/stores/sidebarStore.ts`

- [ ] **Step 1: Create sidebarStore.ts**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
    }),
    { name: 'sidebar-store' },
  ),
);
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/client/stores/sidebarStore.ts
git commit -m "feat(web): add sidebarStore with isCollapsed state persistence"
```

---

### Task 2: Create useSettings hook

**Files:**
- Create: `apps/web/src/client/hooks/useSettings.ts`

- [ ] **Step 1: Create useSettings.ts**

This hook provides shared settings state used by multiple settings pages. It wraps `useProviderSettings` and adds debug/notification/appVersion state.

```typescript
import { useCallback, useEffect, useState } from 'react';
import { useProviderSettings } from '@/components/settings/hooks/useProviderSettings';
import { getMyBoTeam } from '@/lib/myboteam';

export function useSettings() {
  const [debugMode, setDebugModeState] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [appVersion, setAppVersion] = useState('');
  const [versionLoading, setVersionLoading] = useState(true);

  const { settings, loading, error, refetch, setActiveProvider, connectProvider, disconnectProvider, updateModel, switchProviderModel } = useProviderSettings();
  const myboteam = getMyBoTeam();

  useEffect(() => {
    myboteam.getDebugMode().then(setDebugModeState).catch(() => {});
    myboteam.getNotificationsEnabled().then(setNotificationsEnabledState).catch(() => {});
    myboteam.getVersion().then((v) => { setAppVersion(v); setVersionLoading(false); }).catch(() => setVersionLoading(false));
  }, [myboteam]);

  const handleDebugToggle = useCallback(async () => {
    const newValue = !debugMode;
    await myboteam.setDebugMode(newValue);
    setDebugModeState(newValue);
  }, [debugMode, myboteam]);

  const handleNotificationsToggle = useCallback(async () => {
    const newValue = !notificationsEnabled;
    await myboteam.setNotificationsEnabled(newValue);
    setNotificationsEnabledState(newValue);
  }, [notificationsEnabled, myboteam]);

  return {
    settings,
    loading,
    error,
    refetch,
    debugMode,
    notificationsEnabled,
    appVersion,
    versionLoading,
    handleDebugToggle,
    handleNotificationsToggle,
    setActiveProvider,
    connectProvider,
    disconnectProvider,
    updateModel,
    switchProviderModel,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/client/hooks/useSettings.ts
git commit -m "feat(web): create useSettings hook shared by settings pages"
```

---

### Task 3: Create ConversationsPage

**Files:**
- Create: `apps/web/src/client/pages/ConversationsPage.tsx`

- [ ] **Step 1: Create ConversationsPage.tsx**

```tsx
import { ChatText } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { staggerContainer } from '@/lib/animations';
import { getMyBoTeam } from '@/lib/myboteam';
import { useTaskStore } from '@/stores/taskStore';
import ConversationListItem from '../components/layout/ConversationListItem';

export default function ConversationsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('sidebar');
  const { tasks, loadTasks, updateTaskStatus, addTaskUpdate } = useTaskStore();
  const myboteam = getMyBoTeam();

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const unsubscribeStatusChange = myboteam.onTaskStatusChange?.((data) => {
      updateTaskStatus(data.taskId, data.status);
    });
    const unsubscribeTaskUpdate = myboteam.onTaskUpdate((event) => {
      addTaskUpdate(event);
    });
    return () => {
      unsubscribeStatusChange?.();
      unsubscribeTaskUpdate();
    };
  }, [updateTaskStatus, addTaskUpdate, myboteam]);

  const handleNewConversation = () => {
    navigate('/');
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-foreground">{t('conversations')}</h1>
        <Button
          onClick={handleNewConversation}
          variant="default"
          size="sm"
          className="gap-2"
        >
          <ChatText className="h-4 w-4" />
          {t('newTask')}
        </Button>
      </div>
      <ScrollArea className="flex-1 rounded-lg border border-border glass-bg p-2">
        <div className="space-y-1">
          <AnimatePresence mode="wait">
            {tasks.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 py-16 text-center text-sm text-muted-foreground"
              >
                {t('noConversations')}
              </motion.div>
            ) : (
              <motion.div
                key="task-list"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-1"
              >
                {tasks.map((task) => (
                  <ConversationListItem key={task.id} task={task} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/client/pages/ConversationsPage.tsx
git commit -m "feat(web): create ConversationsPage with task list and subscriptions"
```

---

### Task 4: Create SettingsLayout

**Files:**
- Create: `apps/web/src/client/components/layout/SettingsLayout.tsx`

- [ ] **Step 1: Create SettingsLayout.tsx**

```tsx
import { ArrowLeft } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { cn } from '@/lib/utils';
import logoImage from '/assets/logo-1.png';
import { SETTINGS_TABS } from './settings-tabs';

export default function SettingsLayout() {
  const { t } = useTranslation('settings');
  const location = useLocation();
  const navigate = useNavigate();

  const pathPart = location.pathname.split('/settings/')[1] || 'general';
  const activeTab = SETTINGS_TABS.find((tab) => tab.id === pathPart)?.id ?? 'general';

  return (
    <div className="flex h-full overflow-hidden">
      <nav className="w-52 shrink-0 border-r border-border bg-muted/30 p-4 flex flex-col gap-1">
        <div className="flex items-center gap-2 px-3 py-2 mb-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1 rounded-md hover:bg-background/50 transition-colors"
            aria-label={t('back')}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <img
            src={logoImage}
            alt="MyBoTeam"
            className="dark:invert"
            style={{ height: '20px' }}
          />
        </div>
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
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
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
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/client/components/layout/SettingsLayout.tsx
git commit -m "feat(web): create SettingsLayout with nav sidebar and outlet"
```

---

### Task 5: Create settings pages (batch 1: ProvidersPage + GeneralPage + AboutPage)

**Files:**
- Create: `apps/web/src/client/pages/settings/ProvidersPage.tsx`
- Create: `apps/web/src/client/pages/settings/GeneralPage.tsx`
- Create: `apps/web/src/client/pages/settings/AboutPage.tsx`

- [ ] **Step 1: Create ProvidersPage.tsx**

The providers page reuses the existing dialog content: ProviderGrid, ProviderSettingsPanel, SandboxSection. Provider selection is driven by URL search params (`?select=openai`).

```tsx
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ProviderGrid } from '@/components/settings/ProviderGrid';
import { ProviderSettingsPanel } from '@/components/settings/ProviderSettingsPanel';
import { SandboxSection } from '@/components/settings/SandboxSection';
import { settingsVariants, settingsTransitions } from '@/lib/animations';
import { useSettings } from '@/hooks/useSettings';
import type { ProviderId } from '@myboteam/agent-core/common';
import { hasAnyReadyProvider, isProviderReady } from '@myboteam/agent-core/common';
import type { ConnectedProvider } from '@myboteam/agent-core/common';
import { FIRST_FOUR_PROVIDERS } from '@/components/layout/settings-tabs';

export function ProvidersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [gridExpanded, setGridExpanded] = useState(false);
  const [showModelError, setShowModelError] = useState(false);

  const {
    settings,
    loading,
    refetch,
    setActiveProvider,
    connectProvider,
    disconnectProvider,
    updateModel,
  } = useSettings();

  const selectedProvider = searchParams.get('select') as ProviderId | null;

  // Sync expanded state with selected provider
  const handleSelectProvider = useCallback(
    async (providerId: ProviderId) => {
      setSearchParams({ select: providerId }, { replace: true });
      setShowModelError(false);
      if (!FIRST_FOUR_PROVIDERS.includes(providerId as typeof FIRST_FOUR_PROVIDERS[number])) {
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
      }
    },
    [connectProvider, setActiveProvider],
  );

  const handleDisconnect = useCallback(async () => {
    if (!selectedProvider) return;
    const wasActive = settings?.activeProviderId === selectedProvider;
    await disconnectProvider(selectedProvider);
    setSearchParams({}, { replace: true });
    if (wasActive && settings?.connectedProviders) {
      const readyId = Object.keys(settings.connectedProviders).find(
        (id) => id !== selectedProvider && isProviderReady(settings.connectedProviders[id as ProviderId]),
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
    },
    [selectedProvider, updateModel, settings, setActiveProvider],
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
          <ProviderGrid
            settings={settings}
            selectedProvider={selectedProvider}
            onSelectProvider={handleSelectProvider}
            expanded={gridExpanded}
            onToggleExpanded={() => setGridExpanded(!gridExpanded)}
          />
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
                onUpdateProvider={connectProvider}
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
```

- [ ] **Step 2: Create GeneralPage.tsx**

```tsx
import { useSettings } from '@/hooks/useSettings';
import { GeneralTab } from '@/components/settings/GeneralTab';

export function GeneralPage() {
  const { notificationsEnabled, debugMode, handleNotificationsToggle, handleDebugToggle } = useSettings();

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
```

- [ ] **Step 3: Create AboutPage.tsx**

```tsx
import { useSettings } from '@/hooks/useSettings';
import { AboutTab } from '@/components/settings/AboutTab';

export function AboutPage() {
  const { appVersion, versionLoading } = useSettings();

  if (versionLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      <div className="pt-5 pb-3">
        <h3 className="text-sm font-semibold text-foreground">About</h3>
      </div>
      <AboutTab appVersion={appVersion} />
    </div>
  );
}
```

- [ ] **Step 4: Create pages/settings directory and commit**

```bash
mkdir -p apps/web/src/client/pages/settings
git add apps/web/src/client/pages/settings/ProvidersPage.tsx \
      apps/web/src/client/pages/settings/GeneralPage.tsx \
      apps/web/src/client/pages/settings/AboutPage.tsx
git commit -m "feat(web): create settings pages (providers, general, about)"
```

---

### Task 6: Create settings pages (batch 2: remaining 6 pages)

**Files:**
- Create: `apps/web/src/client/pages/settings/SkillsPage.tsx`
- Create: `apps/web/src/client/pages/settings/BrowsersPage.tsx`
- Create: `apps/web/src/client/pages/settings/WorkspacesPage.tsx`
- Create: `apps/web/src/client/pages/settings/IntegrationsPage.tsx`
- Create: `apps/web/src/client/pages/settings/SchedulerPage.tsx`
- Create: `apps/web/src/client/pages/settings/VoicePage.tsx`

Each page is a thin wrapper. Pattern: import existing panel, wrap in scrollable container with page title + panel.

- [ ] **Step 1: Create SkillsPage.tsx**

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AddSkillDropdown, SkillsPanel } from '@/components/settings/skills';

export function SkillsPage() {
  const { t } = useTranslation('settings');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      <div className="pt-5 pb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{t('tabs.skills')}</h3>
        <AddSkillDropdown
          onSkillAdded={() => setRefreshTrigger((p) => p + 1)}
          onClose={() => {}}
        />
      </div>
      <SkillsPanel refreshTrigger={refreshTrigger} />
    </div>
  );
}
```

- [ ] **Step 2: Create BrowsersPage.tsx**

```tsx
import { CloudBrowsersPanel } from '@/components/settings/CloudBrowsersPanel';

export function BrowsersPage() {
  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      <div className="pt-5 pb-3">
        <h3 className="text-sm font-semibold text-foreground">Cloud Browsers</h3>
      </div>
      <CloudBrowsersPanel />
    </div>
  );
}
```

- [ ] **Step 3: Create WorkspacesPage.tsx**

```tsx
import { WorkspacesPanel } from '@/components/settings/WorkspacesPanel';

export function WorkspacesPage() {
  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      <div className="pt-5 pb-3">
        <h3 className="text-sm font-semibold text-foreground">Workspaces</h3>
      </div>
      <WorkspacesPanel />
    </div>
  );
}
```

- [ ] **Step 4: Create IntegrationsPage.tsx**

```tsx
import { IntegrationsPanel } from '@/components/settings/integrations';

export function IntegrationsPage() {
  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      <div className="pt-5 pb-3">
        <h3 className="text-sm font-semibold text-foreground">Integrations</h3>
      </div>
      <IntegrationsPanel />
    </div>
  );
}
```

- [ ] **Step 5: Create SchedulerPage.tsx**

```tsx
import { SchedulerPanel } from '@/components/settings/scheduler';

export function SchedulerPage() {
  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      <div className="pt-5 pb-3">
        <h3 className="text-sm font-semibold text-foreground">Scheduler</h3>
      </div>
      <SchedulerPanel />
    </div>
  );
}
```

- [ ] **Step 6: Create VoicePage.tsx**

```tsx
import { SpeechSettingsForm } from '@/components/settings/SpeechSettingsForm';

export function VoicePage() {
  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      <div className="pt-5 pb-3">
        <h3 className="text-sm font-semibold text-foreground">Voice Input</h3>
      </div>
      <SpeechSettingsForm />
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/client/pages/settings/
git commit -m "feat(web): create settings pages (skills, browsers, workspaces, integrations, scheduler, voice)"
```

---

### Task 7: Refactor Sidebar (collapsible + nav items)

**Files:**
- Modify: `apps/web/src/client/components/layout/Sidebar.tsx`

- [ ] **Step 1: Rewrite Sidebar.tsx**

Replace the entire file. The new sidebar:
- Uses `useSidebarStore` for `isCollapsed` / `toggleCollapse`
- Has a header row (logo + collapse button)
- Has nav items (New Conversation, Conversations)
- Has empty spacer
- Has bottom section with ThemeColorSelector, WorkspaceSelector, Settings nav, DaemonStatusDot (expanded only)
- No task subscriptions (moved to ConversationsPage)
- Collapsed items wrapped in `<Tooltip side="right">`

```tsx
'use client';

import { ChatText, Gear, List, PanelLeftClose, PanelLeftOpen } from '@phosphor-icons/react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { DaemonStatusDot } from '@/components/DaemonStatusDot';
import { Button } from '@/components/ui/button';
import { ThemeColorSelector } from '@/components/ui/ThemeColorSelector';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebarStore';
import logoImage from '/assets/logo-1.png';
import WorkspaceSelector from './WorkspaceSelector';

interface NavItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  isCollapsed: boolean;
  isActive: boolean;
}

function isItemActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  if (href === '/conversations') {
    return pathname === '/conversations' || pathname.startsWith('/conversations/');
  }
  return pathname.startsWith(href);
}

function NavItem({ href, icon, label, isCollapsed, isActive }: NavItemProps) {
  const navigate = useNavigate();
  const content = (
    <button
      onClick={() => navigate(href)}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full',
        isCollapsed ? 'justify-center' : '',
        isActive
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent',
      )}
    >
      <span className="flex items-center justify-center w-5 h-5 shrink-0">{icon}</span>
      {!isCollapsed && <span>{label}</span>}
    </button>
  );

  if (!isCollapsed) return content;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export default function Sidebar() {
  const { isCollapsed, toggleCollapse } = useSidebarStore();
  const { t } = useTranslation('sidebar');
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <aside
        className={cn(
          'flex h-screen flex-col border-r border-border glass-bg pt-12',
          'transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64',
        )}
      >
        {/* Header Row */}
        <div
          className={cn(
            'flex items-center px-3 py-3 border-b border-border',
            isCollapsed ? 'flex-col gap-2' : 'justify-between',
          )}
        >
          <div className="flex items-center gap-2">
            <img
              src={logoImage}
              alt="MyBoTeam"
              className="dark:invert"
              style={{ height: '20px' }}
            />
            {!isCollapsed && (
              <span className="text-sm font-semibold text-foreground">MyBoTeam</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="shrink-0"
            title={isCollapsed ? t('expandSidebar') : t('collapseSidebar')}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
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

        {/* Bottom Section */}
        {!isCollapsed && (
          <div className="flex flex-col gap-2 px-3 py-3 border-t border-border">
            <ThemeColorSelector />
            <WorkspaceSelector
              onManageWorkspaces={() => navigate('/settings/workspaces')}
            />
          </div>
        )}

        {/* Settings + Daemon (always visible when collapsed, compact when expanded) */}
        <div className={cn(
          'border-t border-border flex items-center px-3 py-4',
          isCollapsed ? 'flex-col gap-3' : 'justify-between',
        )}>
          {!isCollapsed && (
            <div className="flex items-center">
              <img
                src={logoImage}
                alt="MyBoTeam"
                className="dark:invert"
                style={{ height: '20px', paddingLeft: '6px' }}
              />
            </div>
          )}
          <div className={cn('flex items-center gap-2', isCollapsed ? 'flex-col' : '')}>
            <DaemonStatusDot />

            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/settings/general')}
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
                size="sm"
                onClick={() => navigate('/settings/general')}
                className="gap-2"
                title={t('settings')}
              >
                <Gear className="h-4 w-4" />
                {t('settings')}
              </Button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
```

Note: the `SettingsDialog` import at the top will be removed since settings are now route-based. The old `useSettingsInitialTab` and `setShowSettings` state pattern is gone.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/client/components/layout/Sidebar.tsx
git commit -m "feat(web): refactor sidebar to collapsible with nav items"
```

---

### Task 8: Update Router

**Files:**
- Modify: `apps/web/src/client/router.tsx`

- [ ] **Step 1: Update router.tsx**

Add `/conversations` and `/settings/*` routes. Settings routes use `SettingsLayout` as the wrapper component.

```tsx
import { createHashRouter, Navigate } from 'react-router';
import { App } from './App';
import { RouteErrorFallback } from './components/ui/RouteErrorFallback';
import ConversationsPage from './pages/ConversationsPage';
import ExecutionPage from './pages/Execution';
import { HomePage } from './pages/Home';
import SettingsLayout from './components/layout/SettingsLayout';
import { AboutPage } from './pages/settings/AboutPage';
import { BrowsersPage } from './pages/settings/BrowsersPage';
import { GeneralPage } from './pages/settings/GeneralPage';
import { IntegrationsPage } from './pages/settings/IntegrationsPage';
import { ProvidersPage } from './pages/settings/ProvidersPage';
import { SchedulerPage } from './pages/settings/SchedulerPage';
import { SkillsPage } from './pages/settings/SkillsPage';
import { VoicePage } from './pages/settings/VoicePage';
import { WorkspacesPage } from './pages/settings/WorkspacesPage';

export const router = createHashRouter([
  {
    path: '/',
    Component: App,
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, Component: HomePage, errorElement: <RouteErrorFallback /> },
      { path: 'conversations', Component: ConversationsPage, errorElement: <RouteErrorFallback /> },
      { path: 'execution/:id', Component: ExecutionPage, errorElement: <RouteErrorFallback /> },
      {
        path: 'settings',
        Component: SettingsLayout,
        errorElement: <RouteErrorFallback />,
        children: [
          { index: true, element: <Navigate to="/settings/general" replace /> },
          { path: 'providers', Component: ProvidersPage, errorElement: <RouteErrorFallback /> },
          { path: 'skills', Component: SkillsPage, errorElement: <RouteErrorFallback /> },
          { path: 'browsers', Component: BrowsersPage, errorElement: <RouteErrorFallback /> },
          { path: 'workspaces', Component: WorkspacesPage, errorElement: <RouteErrorFallback /> },
          { path: 'integrations', Component: IntegrationsPage, errorElement: <RouteErrorFallback /> },
          { path: 'scheduler', Component: SchedulerPage, errorElement: <RouteErrorFallback /> },
          { path: 'voice', Component: VoicePage, errorElement: <RouteErrorFallback /> },
          { path: 'general', Component: GeneralPage, errorElement: <RouteErrorFallback /> },
          { path: 'about', Component: AboutPage, errorElement: <RouteErrorFallback /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/client/router.tsx
git commit -m "feat(web): add conversations route and settings routes to router"
```

---

### Task 9: Create AuthSettingsDialog (simplified for OAuth re-login)

**Files:**
- Create: `apps/web/src/client/components/layout/AuthSettingsDialog.tsx`

- [ ] **Step 1: Create AuthSettingsDialog.tsx**

A simplified dialog that shows only the providers tab. Used by App.tsx for OAuth session expiry re-login.

```tsx
import type { ConnectedProvider, ProviderId } from '@myboteam/agent-core/common';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProviderGrid } from '@/components/settings/ProviderGrid';
import { useProviderSettings } from '@/components/settings/hooks/useProviderSettings';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProviderSettingsPanel } from '@/components/settings/ProviderSettingsPanel';
import { isProviderReady } from '@myboteam/agent-core/common';

interface AuthSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProvider?: ProviderId;
  onApiKeySaved?: () => void;
}

export function AuthSettingsDialog({ open, onOpenChange, initialProvider, onApiKeySaved }: AuthSettingsDialogProps) {
  const { t } = useTranslation('settings');
  const [selectedProvider, setSelectedProvider] = useState<ProviderId | null>(null);
  const [gridExpanded, setGridExpanded] = useState(false);
  const { settings, loading, setActiveProvider, connectProvider } = useProviderSettings();

  useEffect(() => {
    if (!open) {
      setSelectedProvider(null);
      setGridExpanded(false);
      return;
    }
    if (initialProvider) {
      setSelectedProvider(initialProvider);
    }
  }, [open, initialProvider]);

  const handleSelectProvider = useCallback(async (providerId: ProviderId) => {
    setSelectedProvider(providerId);
    const provider = settings?.connectedProviders?.[providerId];
    if (provider && isProviderReady(provider)) {
      await setActiveProvider(providerId);
    }
  }, [settings?.connectedProviders, setActiveProvider]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full h-[60vh] flex flex-col overflow-hidden p-0" data-testid="auth-settings-dialog">
        <DialogHeader className="sr-only">
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="pt-5 pb-3">
              <h3 className="text-sm font-semibold text-foreground">{t('tabs.providers')}</h3>
            </div>
            <div className="space-y-6">
              <section>
                <ProviderGrid
                  settings={settings}
                  selectedProvider={selectedProvider}
                  onSelectProvider={handleSelectProvider}
                  expanded={gridExpanded}
                  onToggleExpanded={() => setGridExpanded(!gridExpanded)}
                />
              </section>
              {selectedProvider && settings && (
                <section>
                  <ProviderSettingsPanel
                    providerId={selectedProvider}
                    connectedProvider={settings.connectedProviders[selectedProvider]}
                    onConnect={handleConnect}
                    onUpdateProvider={connectProvider}
                    onDisconnect={undefined}
                    onModelChange={async () => {}}
                    showModelError={false}
                  />
                </section>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/client/components/layout/AuthSettingsDialog.tsx
git commit -m "feat(web): create AuthSettingsDialog for OAuth re-login flow"
```

---

### Task 10: Update App.tsx

**Files:**
- Modify: `apps/web/src/client/App.tsx`

- [ ] **Step 1: Update App.tsx**

Changes:
- Remove `SettingsDialog` import from `@/components/layout/SettingsDialog`
- Add `AuthSettingsDialog` import
- Replace the full `SettingsDialog` instance in the JSX with `AuthSettingsDialog`
- Verify auth flow still works: `setAuthSettingsOpen(true)` triggers the dialog, which shows providers

Import change:
```tsx
// Remove:
import SettingsDialog from './components/layout/SettingsDialog';
// Add:
import { AuthSettingsDialog } from './components/layout/AuthSettingsDialog';
```

JSX change (replace the SettingsDialog instance at the bottom):
```tsx
{/* Settings Dialog for re-authentication — OAuth session expiry */}
<AuthSettingsDialog
  open={authSettingsOpen}
  onOpenChange={handleAuthSettingsClose}
  initialProvider={authSettingsProvider}
  onApiKeySaved={() => {
    clearAuthError();
    setAuthSettingsOpen(false);
  }}
/>
```

Remove the `onApiKeySaved` prop from the `handleAuthSettingsClose` callback if it references it (check that the callback handles it correctly). The old code had:
```tsx
<SettingsDialog
  open={authSettingsOpen}
  onOpenChange={handleAuthSettingsClose}
  initialProvider={authSettingsProvider}
  initialTab={authSettingsTab}
  onApiKeySaved={() => {
    clearAuthError();
    setAuthSettingsOpen(false);
  }}
/>
```

Replace with the simpler AuthSettingsDialog.

- [ ] **Step 2: Remove the `settingsInitialTab` / `authSettingsTab` state variables if they are no longer used**

The `authSettingsTab` state in `App.tsx` (line 74-76) is only used by the old SettingsDialog. Since AuthSettingsDialog doesn't need it, remove it:
```tsx
const [authSettingsTab, setAuthSettingsTab] = useState<
  'providers' | 'voice' | 'skills' | 'integrations' | 'scheduler' | 'general' | 'about'
>('providers');
```

Remove `setAuthSettingsTab` and `authSettingsTab` from any code that references them (the only usage was passing `initialTab={authSettingsTab}` to SettingsDialog).

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/client/App.tsx
git commit -m "feat(web): replace SettingsDialog with AuthSettingsDialog in App"
```

---

### Task 11: Update HomePage + useHomePage

**Files:**
- Modify: `apps/web/src/client/pages/Home.tsx`
- Modify: `apps/web/src/client/pages/home/useHomePage.ts`
- Modify: `apps/web/src/client/pages/home/useHomePageSettings.ts`

- [ ] **Step 1: Update Home.tsx**

Remove the SettingsDialog import and JSX. Replace the settings dialog trigger with navigation.

```tsx
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { PlusMenu } from "@/components/landing/PlusMenu";
import { TaskInputBar } from "@/components/landing/TaskInputBar";
import { springs } from "@/lib/animations";
import { ExamplesSection } from "./home/ExamplesSection";
import { FavoritesSection } from "./home/FavoritesSection";
import { useHomePage } from "./home/useHomePage";

export function HomePage() {
  const { t } = useTranslation("home");
  const {
    prompt,
    setPrompt,
    showAllFavorites,
    setShowAllFavorites,
    attachments,
    attachmentError,
    setAttachments,
    workingDirectory,
    setWorkingDirectory,
    favoritesList,
    removeFavorite,
    isLoading,
    useCaseExamples,
    displayedFavorites,
    hasMoreFavorites,
    handleSubmit,
    handleOpenSpeechSettings,
    handleOpenModelSettings,
    handleExampleClick,
    handleSkillSelect,
    handleAttachFiles,
    handleOpenSettings,
    MAX_FILES,
  } = useHomePage();

  return (
    <>
      <div className="h-full flex flex-col relative overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 pb-0">
          {/* ... existing content ... */}
        </div>
      </div>
    </>
  );
}
```

Key changes:
- Remove `SettingsDialog` import
- Remove `<SettingsDialog>` JSX (the instance with `initialTab`, `onApiKeySaved`, etc.)
- Remove `showSettingsDialog`, `handleSettingsDialogChange`, `handleApiKeySaved` from destructuring
- Remove the `handleSettingsDialogChange`, `handleApiKeySaved` from the destructured return

- [ ] **Step 2: Update useHomePage.ts**

Replace the `useHomePageSettings` hook with direct navigation calls. Replace dialog-open with `navigate()`.

```tsx
import { hasAnyReadyProvider } from '@myboteam/agent-core/common';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { createLogger } from '@/lib/logger';
import { getMyBoTeam } from '@/lib/myboteam';
import { useTaskStore } from '@/stores/taskStore';
import { FAVORITES_PREVIEW_COUNT, USE_CASE_KEYS } from './homeConstants';
import { usePromptAttachments } from './usePromptAttachments';

export { FAVORITES_PREVIEW_COUNT } from './homeConstants';

const logger = createLogger('Home');

export function useHomePage() {
  const [prompt, setPrompt] = useState('');
  const [showAllFavorites, setShowAllFavorites] = useState(false);
  const [workingDirectory, setWorkingDirectory] = useState<string | undefined>(undefined);

  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('home');

  const favorites = useTaskStore((state) => state.favorites);
  const favoritesList = Array.isArray(favorites) ? favorites : [];
  const loadFavorites = useTaskStore((state) => state.loadFavorites);
  const removeFavorite = useTaskStore((state) => state.removeFavorite);
  const startTask = useTaskStore((state) => state.startTask);
  const interruptTask = useTaskStore((state) => state.interruptTask);
  const isLoading = useTaskStore((state) => state.isLoading);
  const addTaskUpdate = useTaskStore((state) => state.addTaskUpdate);
  const setPermissionRequest = useTaskStore((state) => state.setPermissionRequest);

  const myboteam = useMemo(() => getMyBoTeam(), []);

  const useCaseExamples = useMemo(
    () =>
      USE_CASE_KEYS.map(({ key, icons }) => ({
        key,
        title: t(`useCases.${key}.title`),
        description: t(`useCases.${key}.description`),
        prompt: t(`useCases.${key}.prompt`),
        icons,
      })),
    [t],
  );

  useEffect(() => {
    if (location.pathname === '/' && typeof loadFavorites === 'function') {
      void loadFavorites();
    }
  }, [location.pathname, loadFavorites]);

  useEffect(() => {
    const unsubscribeTask = myboteam.onTaskUpdate((event) => {
      addTaskUpdate(event);
    });
    const unsubscribePermission = myboteam.onPermissionRequest((request) => {
      setPermissionRequest(request);
    });
    return () => {
      unsubscribeTask();
      unsubscribePermission();
    };
  }, [addTaskUpdate, setPermissionRequest, myboteam]);

  const {
    attachments,
    attachmentError,
    setAttachments,
    buildPromptWithAttachments,
    handleExampleClick,
    handleSkillSelect,
    handleAttachFiles,
    addFiles,
    MAX_FILES,
  } = usePromptAttachments({ setPrompt });

  const executeTask = useCallback(async () => {
    if ((!prompt.trim() && attachments.length === 0) || isLoading) {
      return;
    }
    const taskId = `task_${Date.now()}`;
    const enrichedPrompt = buildPromptWithAttachments(prompt.trim(), attachments);
    const task = await startTask({
      prompt: enrichedPrompt,
      taskId,
      files: attachments,
      workingDirectory,
    });
    if (task) {
      setAttachments([]);
      setWorkingDirectory(undefined);
      navigate(`/execution/${task.id}`);
    }
  }, [
    prompt, attachments, workingDirectory, isLoading,
    startTask, setAttachments, navigate, buildPromptWithAttachments,
  ]);

  const handleSubmit = useCallback(async () => {
    if (isLoading) {
      void interruptTask();
      return;
    }
    if (!prompt.trim() && attachments.length === 0) {
      return;
    }
    try {
      const isE2EMode = await myboteam.isE2EMode();
      if (!isE2EMode) {
        const settings = await myboteam.getProviderSettings();
        if (!hasAnyReadyProvider(settings)) {
          // Navigate to settings to configure a provider
          navigate('/settings/providers');
          return;
        }
      }
      await executeTask();
    } catch (err) {
      logger.error('Failed to submit task:', err);
    }
  }, [isLoading, prompt, attachments, myboteam, executeTask, interruptTask, navigate]);

  const handleOpenSettings = useCallback(
    (tab: 'providers' | 'voice' | 'skills' | 'integrations') => {
      navigate(`/settings/${tab}`);
    },
    [navigate],
  );

  const handleOpenSpeechSettings = useCallback(() => {
    navigate('/settings/voice');
  }, [navigate]);

  const handleOpenModelSettings = useCallback(() => {
    navigate('/settings/providers');
  }, [navigate]);

  const displayedFavorites = showAllFavorites
    ? favoritesList
    : favoritesList.slice(0, FAVORITES_PREVIEW_COUNT);
  const hasMoreFavorites = favoritesList.length > FAVORITES_PREVIEW_COUNT;

  return {
    prompt,
    setPrompt,
    showAllFavorites,
    setShowAllFavorites,
    attachments,
    attachmentError,
    setAttachments,
    workingDirectory,
    setWorkingDirectory,
    favoritesList,
    removeFavorite,
    isLoading,
    useCaseExamples,
    displayedFavorites,
    hasMoreFavorites,
    handleSubmit,
    handleOpenSpeechSettings,
    handleOpenModelSettings,
    handleExampleClick,
    handleSkillSelect,
    handleAttachFiles,
    addFiles,
    MAX_FILES,
    handleOpenSettings,
  };
}
```

- [ ] **Step 3: Remove useHomePageSettings.ts (no longer needed)**

The `useHomePageSettings.ts` file contained settings dialog state management that is now replaced by direct navigation. Delete the file.

```bash
git rm apps/web/src/client/pages/home/useHomePageSettings.ts
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/client/pages/Home.tsx \
      apps/web/src/client/pages/home/useHomePage.ts
git rm apps/web/src/client/pages/home/useHomePageSettings.ts
git commit -m "feat(web): replace settings dialog with route navigation in HomePage"
```

---

### Task 12: Remove old SettingsDialog + useSettingsDialog

**Files:**
- Remove: `apps/web/src/client/components/layout/SettingsDialog.tsx`
- Remove: `apps/web/src/client/components/layout/useSettingsDialog.ts`

- [ ] **Step 1: Verify no remaining imports of these files**

Search for `SettingsDialog` and `useSettingsDialog` imports across the codebase:

```bash
grep -r "from.*SettingsDialog" apps/web/src/client/ || echo "No imports of SettingsDialog"
grep -r "from.*useSettingsDialog" apps/web/src/client/ || echo "No imports of useSettingsDialog"
```

Expected: Only matches in the source files themselves (which we're deleting), and the import in the old Sidebar.tsx which is already rewritten.

- [ ] **Step 2: Remove the files**

```bash
git rm apps/web/src/client/components/layout/SettingsDialog.tsx
git rm apps/web/src/client/components/layout/useSettingsDialog.ts
```

- [ ] **Step 3: Run check**

Run: `pnpm check`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(web): remove SettingsDialog and useSettingsDialog (replaced by routes)"
```

---

### Task 13: Verify and fix

**Files:**
- Run full check + tests

- [ ] **Step 1: Run full check**

```bash
pnpm check
```
Expected: No errors

- [ ] **Step 2: Run web tests**

```bash
pnpm -F @myboteam/web test
```
Expected: All tests pass. If any tests fail related to the sidebar or settings, fix them.

- [ ] **Step 3: Run desktop + agent-core tests**

```bash
pnpm -F @myboteam/desktop test && pnpm -F @myboteam/agent-core test
```

- [ ] **Step 4: Clean up any leftover imports or dead code**

Search for any remaining references to removed components:
```bash
grep -r "SettingsDialog" apps/web/src/client/ --include="*.ts" --include="*.tsx" | grep -v "AuthSettingsDialog"
```

If nothing remains, we're clean.

- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "chore: cleanup after sidebar and settings refactor"
```
