# Collapsible Sidebar & Conversations Page Design

**Date:** 2025-06-05
**Status:** Draft

## Goal

Refactor the left sidebar to be collapsible (matching the v0.2.0 pattern), transparent/glass-styled, and extract the conversation list into a new `/conversations` page. Convert settings from a dialog overlay to route-based pages.

## Architecture

### Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/client/stores/sidebarStore.ts` | Zustand store with `isCollapsed` toggle, persisted to localStorage |
| `apps/web/src/client/pages/ConversationsPage.tsx` | New page showing the conversation list |
| `apps/web/src/client/components/layout/SettingsLayout.tsx` | Route wrapper for settings pages with sidebar nav + back button |
| `apps/web/src/client/pages/settings/ProvidersPage.tsx` | Providers settings page (from existing dialog tab) |
| `apps/web/src/client/pages/settings/SkillsPage.tsx` | Skills settings page |
| `apps/web/src/client/pages/settings/BrowsersPage.tsx` | Cloud browsers settings page |
| `apps/web/src/client/pages/settings/WorkspacesPage.tsx` | Workspaces settings page |
| `apps/web/src/client/pages/settings/IntegrationsPage.tsx` | Integrations settings page |
| `apps/web/src/client/pages/settings/SchedulerPage.tsx` | Scheduler settings page |
| `apps/web/src/client/pages/settings/VoicePage.tsx` | Voice input settings page |
| `apps/web/src/client/pages/settings/GeneralPage.tsx` | General settings page |
| `apps/web/src/client/pages/settings/AboutPage.tsx` | About page |

### Files to Modify

| File | Changes |
|------|---------|
| `apps/web/src/client/components/layout/Sidebar.tsx` | Full rewrite: collapsible, nav items, restructured bottom section |
| `apps/web/src/client/router.tsx` | Add `/conversations` route + settings routes |
| `apps/web/src/client/App.tsx` | Remove SettingsDialog from sidebar area, keep only auth-required SettingsDialog |
| `apps/web/src/client/pages/Home.tsx` | Remove SettingsDialog (replaced by route-based settings) |
| `apps/web/src/client/stores/sidebarStore.ts` | New file (Zustand store) |

### Files to Remove / Mark Deprecated

| File | Reason |
|------|--------|
| `apps/web/src/client/components/layout/SettingsDialog.tsx` | Replaced by route-based settings pages. The auth-required settings dialog in `App.tsx` will use a slimmed-down inline version. |
| `apps/web/src/client/components/layout/useSettingsDialog.ts` | Logic distributed to individual settings pages |
| `settings-tabs.ts` | No longer needed as a single file — tab data moves into each page component |

---

## Detailed Design

### 1. SidebarStore

**File:** `apps/web/src/client/stores/sidebarStore.ts`

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

Same pattern as v0.2.0. Persisted to localStorage under `sidebar-store`.

### 2. Sidebar Component

**File:** `apps/web/src/client/components/layout/Sidebar.tsx`

#### Layout Structure

```
<aside className="flex h-screen flex-col border-r border-border glass-bg pt-12
                  transition-all duration-300 ease-in-out
                  {isCollapsed ? 'w-16' : 'w-64'}">
```

#### Sections (top to bottom):

**1. Header Row** (fixed height):
- Expanded: Logo + app name ("MyBoTeam") + collapse button (PanelLeftClose icon)
- Collapsed: Logo only + expand button (PanelRightOpen / PanelLeft icon)
- The collapse button calls `toggleCollapse()` from `useSidebarStore`

**2. Nav Items:**
- **New Conversation** (`/`) — icon: ChatText
- **Conversations** (`/conversations`) — icon: List (or equivalent from @phosphor-icons)
- No Dashboard or Agents (as per user: "we will add them back once they are developed")

Nav item styling (same as v0.2.0):
- Active: `bg-primary/10 text-primary border border-primary/20`
- Inactive: `text-muted-foreground hover:bg-base-300 hover:text-foreground border border-transparent`
- Active detection via `useLocation().pathname` with helper `isItemActive()`

When collapsed, each nav item is wrapped in `<Tooltip side="right">` showing the label.

**3. Spacer** (flex-1, empty)

**4. Bottom Section** (only visible when `!isCollapsed`):
```
[ThemeColorSelector]    ← 6 color circles
[WorkspaceSelector ▼]  ← moved from top
[Settings]              ← gear icon + text, navigates to /settings/general
[DaemonStatusDot]       ← moved as-is
```

When collapsed, show only:
```
[active color dot]      ← small indicator
[gear icon]             ← tooltip: Settings
[DaemonStatusDot]       ← always visible
```

The Settings link navigates to `/settings/general` (first settings page). No more SettingsDialog from sidebar.

#### Task Subscriptions Removed

The current Sidebar has `useEffect` hooks for:
- `loadTasks()`
- `onTaskStatusChange()` → `updateTaskStatus()`
- `onTaskUpdate()` → `addTaskUpdate()`

These move to the new `ConversationsPage` component (the only page that needs live task updates).

### 3. ConversationsPage

**File:** `apps/web/src/client/pages/ConversationsPage.tsx`

A full-page view that:
1. Loads tasks on mount via `useTaskStore().loadTasks()`
2. Subscribes to task status changes and updates (same `useEffect` pattern as current Sidebar)
3. Renders the conversation list using `ConversationListItem`
4. Uses `<ScrollArea>` for the scrollable list
5. Has an empty state when no conversations exist
6. Has a page title/heading ("Conversations")

The page uses the same AnimatePresence + motion patterns as the current sidebar for task list transitions.

```
┌─────────────────────────────────────┐
│ Conversations                       │  ← page title
│ [filter/search bar?] (optional)     │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ ConversationListItem           │ │
│ │ ConversationListItem           │ │
│ │ ConversationListItem           │ │
│ │ ...                            │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 4. Router

**File:** `apps/web/src/client/router.tsx`

```tsx
export const router = createHashRouter([
  {
    path: '/',
    Component: App,
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, Component: HomePage, errorElement: <RouteErrorFallback /> },
      { path: 'conversations', Component: ConversationsPage, errorElement: <RouteErrorFallback /> },
      { path: 'execution/:id', Component: ExecutionPage, errorElement: <RouteErrorFallback /> },
      { path: 'settings', Component: SettingsLayout, children: [
        { index: true, element: <Navigate to="/settings/general" replace /> },
        { path: 'providers', Component: ProvidersPage },
        { path: 'skills', Component: SkillsPage },
        { path: 'browsers', Component: BrowsersPage },
        { path: 'workspaces', Component: WorkspacesPage },
        { path: 'integrations', Component: IntegrationsPage },
        { path: 'scheduler', Component: SchedulerPage },
        { path: 'voice', Component: VoicePage },
        { path: 'general', Component: GeneralPage },
        { path: 'about', Component: AboutPage },
      ]},
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
```

### 5. SettingsLayout

**File:** `apps/web/src/client/components/layout/SettingsLayout.tsx`

Renders a two-column layout:
- Left: Settings sidebar nav (reuses the same nav from the current dialog — logo + tab buttons + active state)
- Right: `<Outlet />` for the individual settings page

The layout includes:
- Active tab highlighting based on current route
- Back button (navigates to the previous main page, using `useSidebarStore` to remember) — or simply navigates to `/` or previous browser history
- No "Done" button (user navigates away naturally)
- No close warning dialog (simplification: if no provider configured, the providers page shows an inline warning)

```
┌──────┬──────────────────────────────┐
│      │                              │
│ Logo │  [page title]                │
│      │                              │
│ Key  │  ← settings content →        │
│      │                              │
│ Gear │                              │
│      │                              │
│ ...  │                              │
│      │                              │
└──────┴──────────────────────────────┘
│← 48px→│       ← flex-1 →           │
```

### 6. Settings Pages

Each settings page is a thin wrapper that:
1. Uses the route path to determine which tab is active
2. Renders the existing panel component (same as currently rendered in SettingsDialog)
3. Manages any page-level state via URL search params (e.g., `?select=openai` for provider selection)

**Example — `ProvidersPage.tsx`:**
```tsx
export function ProvidersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProvider = searchParams.get('select') as ProviderId | null;
  // ... uses adapted useSettings logic (provider connection, grid state)
  return (
    <div className="space-y-6">
      <ProviderGrid ... />
      {selectedProvider && <ProviderSettingsPanel ... />}
      <SandboxSection ... />
    </div>
  );
}
```

The existing `useSettingsDialog` hook gets refactored into a shared `useSettings` hook that works without dialog open/close state. Key changes:
- No `open`/`onOpenChange` parameters
- Provider selection driven by URL search params instead of local state
- No "Done" button logic — validation happens inline on each page
- The "close warning" pattern is removed (simplification)

### 7. App.tsx Changes

The `App.tsx` component:
- Still renders `Sidebar` (now collapsible) + `<main>` + page outlet
- Still renders `SettingsDialog` for the **auth error re-login flow** only (this is a programmatic dialog triggered when OAuth expires, not user-triggered)
- The regular `SettingsDialog` (from sidebar button) is removed — settings are now a route

The auth-error SettingsDialog will keep its current behavior (opened by `setAuthSettingsOpen(true)` when OAuth session expires). It can be simplified later if desired.

### 8. HomePage Changes

- Remove the `SettingsDialog` instance — it was used for the "Open Settings" flow from the home page. Now navigating to `/settings/*` is the equivalent.
- Any `handleOpenSettings` / `handleSettingsDialogChange` callbacks are replaced with `navigate('/settings/general')`.

### 9. Current SettingsDialog

The full `SettingsDialog.tsx` component is replaced. The dialog's internal content (provider connection flow, etc.) is extracted into the individual settings page components. The `useSettingsDialog` hook is adapted into a route-compatible `useSettings` hook.

The auth-only `SettingsDialog` in `App.tsx` will use a simplified version that only shows the providers tab (for API key entry), not the full multi-tab dialog.

---

## Reuse & Migration Strategy

1. **All existing settings panel components** (ProviderGrid, SkillsPanel, GeneralTab, etc.) are reused as-is — only their parent container changes from dialog to page
2. **ConversationListItem** is reused as-is on the new ConversationsPage
3. **ThemeColorSelector** is reused as-is in the bottom section of the refactored sidebar
4. **WorkspaceSelector** moves from the top of the sidebar to the bottom section
5. **DaemonStatusDot** remains in the bottom section

## Edge Cases

- **No conversations yet**: ConversationsPage shows empty state (same as current sidebar)
- **Collapsed sidebar + theme color change**: Color dots hidden when collapsed; user must expand to change theme
- **Settings back navigation**: Navigate to browser history back, or to `/` if no prev page
- **Auth error while already on settings page**: The auth-error SettingsDialog in App.tsx opens on top of settings pages (z-index stacking)
- **Provider connection flow across page navigations**: Provider selection stored in URL search params so it survives page refreshes
- **Active nav item**: Home (`/`) is active only when pathname is exactly `/`; Conversations is active for `/conversations` and `/conversations/*`

## Testing

- Unit tests sidebar store (collapsed state, toggle)
- Component tests new SettingsLayout and ConversationsPage
- Update existing sidebar tests for the new collapsible structure
- Verify navigation between all pages works correctly
- Verify collapsed/expanded states render correctly
- Verify settings pages render all existing content correctly
