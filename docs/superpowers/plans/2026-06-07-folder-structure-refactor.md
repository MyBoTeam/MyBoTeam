# Folder Structure Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `apps/web/src/client/` into a Page-Based & Tiered Shared Components Architecture. No functional changes — only file moves and import rewrites.

**Architecture:** Create target directories, move files in batches using `git mv`, systematically rewrite `@/` and relative import paths across all affected files, then verify with `pnpm check && pnpm -F @myboteam/web typecheck`.

**Tech Stack:** TypeScript, React 19, Vite 8, `@` alias maps to `src/client/`

---

### Task 1: Create target directory structure

- [ ] **Create all new target directories**

Run:
```bash
mkdir -p apps/web/src/client/layouts/main/components
mkdir -p apps/web/src/client/layouts/main/hooks
mkdir -p apps/web/src/client/layouts/settings/components
mkdir -p apps/web/src/client/layouts/settings/hooks
mkdir -p apps/web/src/client/components/common
mkdir -p apps/web/src/client/components/common/robot
mkdir -p apps/web/src/client/components/common/TaskLauncher
mkdir -p apps/web/src/client/components/forms
mkdir -p apps/web/src/client/pages/home/components/PlusMenu
mkdir -p apps/web/src/client/pages/home/hooks
mkdir -p apps/web/src/client/pages/conversation/components
mkdir -p apps/web/src/client/pages/conversation/hooks
mkdir -p apps/web/src/client/pages/conversations/components
mkdir -p apps/web/src/client/pages/settings/general
mkdir -p apps/web/src/client/pages/settings/providers/vertex
mkdir -p apps/web/src/client/pages/settings/integrations
mkdir -p apps/web/src/client/pages/settings/connectors/datadog
mkdir -p apps/web/src/client/pages/settings/connectors/lightdash
mkdir -p apps/web/src/client/pages/settings/google-accounts
mkdir -p apps/web/src/client/pages/settings/scheduler
mkdir -p apps/web/src/client/pages/settings/skills
mkdir -p apps/web/src/client/pages/settings/about
mkdir -p apps/web/src/client/pages/settings/browsers
mkdir -p apps/web/src/client/pages/settings/voice
mkdir -p apps/web/src/client/pages/settings/workspaces
mkdir -p apps/web/src/client/routes
mkdir -p apps/web/src/client/config/i18n/locales
mkdir -p apps/web/src/client/utils
```

- [ ] **Verify directories created**

Run: `find apps/web/src/client -type d | sort`

---

### Task 2: Move components/ui/ and components/ui/glass — these stay in place

- [ ] **Verify ui/ components don't need moves**

`components/ui/` stays exactly where it is. No action needed for shadcn/ui primitives or custom atomic UI components.

`components/ui/glass/` also stays in place since it's a sub-directory of `components/ui/`.

Verification: `@/components/ui/button` → `@/components/ui/button` (unchanged).

---

### Task 3: Move global common components → `components/common/`

- [ ] **Move top-level components to components/common/**

```bash
git mv apps/web/src/client/components/ActionChip.tsx apps/web/src/client/components/common/ActionChip.tsx
git mv apps/web/src/client/components/Arrow.tsx apps/web/src/client/components/common/Arrow.tsx
git mv apps/web/src/client/components/AuthErrorToast.tsx apps/web/src/client/components/common/AuthErrorToast.tsx
git mv apps/web/src/client/components/CloseConfirmDialog.tsx apps/web/src/client/components/common/CloseConfirmDialog.tsx
git mv apps/web/src/client/components/DaemonConnectionToast.tsx apps/web/src/client/components/common/DaemonConnectionToast.tsx
git mv apps/web/src/client/components/DaemonStatusDot.tsx apps/web/src/client/components/common/DaemonStatusDot.tsx
git mv apps/web/src/client/components/SpinningIcon.tsx apps/web/src/client/components/common/SpinningIcon.tsx
git mv apps/web/src/client/components/StatusIcon.tsx apps/web/src/client/components/common/StatusIcon.tsx
git mv apps/web/src/client/components/TodoListItem.tsx apps/web/src/client/components/common/TodoListItem.tsx
git mv apps/web/src/client/components/TodoSidebar.tsx apps/web/src/client/components/common/TodoSidebar.tsx
git mv apps/web/src/client/components/BrowserScriptCard.tsx apps/web/src/client/components/common/BrowserScriptCard.tsx
git mv apps/web/src/client/components/BrowserScriptCardHelpers.tsx apps/web/src/client/components/common/BrowserScriptCardHelpers.tsx
git mv apps/web/src/client/components/BrowserScriptUtils.ts apps/web/src/client/components/common/BrowserScriptUtils.ts
git mv apps/web/src/client/components/TaskLauncher/index.ts apps/web/src/client/components/common/TaskLauncher/index.ts
git mv apps/web/src/client/components/TaskLauncher/TaskLauncher.tsx apps/web/src/client/components/common/TaskLauncher/TaskLauncher.tsx
git mv apps/web/src/client/components/TaskLauncher/TaskLauncherContent.tsx apps/web/src/client/components/common/TaskLauncher/TaskLauncherContent.tsx
git mv apps/web/src/client/components/TaskLauncher/TaskLauncherItem.tsx apps/web/src/client/components/common/TaskLauncher/TaskLauncherItem.tsx
git mv apps/web/src/client/robot/FloatingRobot.tsx apps/web/src/client/components/common/robot/FloatingRobot.tsx
git mv apps/web/src/client/robot/FloatingRobot.css apps/web/src/client/components/common/robot/FloatingRobot.css
```

- [ ] **Update imports in moved common/ files — change `@/components/something` to `../something` or `@/components/something` (if same root)**

Files in `components/common/` still use `@/` for things in `components/ui/`, `stores/`, `hooks/`, `lib/` — those stay valid. Only need to fix:

1. **`components/common/BrowserScriptCard.tsx`**: Change `./BrowserScriptCardHelpers` → `./BrowserScriptCardHelpers` (same dir, unchanged). Change `./SpinningIcon` → `./SpinningIcon` (same dir, unchanged).
2. **`components/common/BrowserScriptCardHelpers.tsx`**: `./ActionChip` and `./Arrow` stay in same dir — unchanged.
3. **`components/common/ActionChip.tsx`**: `./BrowserScriptCardHelpers` stays in same dir — unchanged.
4. **`components/common/TodoSidebar.tsx`**: `./TodoListItem` stays in same dir — unchanged.
5. **`components/common/TodoListItem.tsx`**: `./StatusIcon` stays in same dir — unchanged.
6. **`components/common/common/SpinningIcon.tsx`**: `@/lib/utils` → unchanged.
7. **`components/common/robot/FloatingRobot.tsx`**: `./FloatingRobot.css` stays in same dir — unchanged.
8. **`components/common/TaskLauncher/TaskLauncher.tsx`**: `./TaskLauncherContent` stays in same dir — unchanged.
9. **`components/common/TaskLauncher/TaskLauncherContent.tsx`**: `./TaskLauncherItem` stays in same dir — unchanged.
10. **`components/common/TaskLauncher/TaskLauncherItem.tsx`**: `@/components/landing/IntegrationIcons` needs updating → `@/pages/home/components/IntegrationIcons`.

- [ ] **Update import in TaskLauncherItem.tsx**

In `apps/web/src/client/components/common/TaskLauncher/TaskLauncherItem.tsx`:
Change: `@/components/landing/IntegrationIcons` → `@/pages/home/components/IntegrationIcons`

- [ ] **Update all files importing from old paths to use new paths**

Files that import from the moved components via `@/` paths need updating. Use sed to batch-replace:

```bash
# Update @/components/ references that moved to @/components/common/
# (Only files still using the old @/ path — not relative imports)

rg -l 'from.*@/components/AuthErrorToast' apps/web/src/client --type ts --type tsx
rg -l 'from.*@/components/CloseConfirmDialog' apps/web/src/client --type ts --type tsx
rg -l 'from.*@/components/DaemonConnectionToast' apps/web/src/client --type ts --type tsx
rg -l 'from.*@/components/DaemonStatusDot' apps/web/src/client --type ts --type tsx
rg -l 'from.*@/components/SpinningIcon' apps/web/src/client --type ts --type tsx
rg -l 'from.*@/components/StatusIcon' apps/web/src/client --type ts --type tsx
rg -l 'from.*@/components/TodoListItem' apps/web/src/client --type ts --type tsx
rg -l 'from.*@/components/TodoSidebar' apps/web/src/client --type ts --type tsx
rg -l 'from.*@/components/BrowserScriptCard' apps/web/src/client --type ts --type tsx
rg -l 'from.*@/components/BrowserScriptCardHelpers' apps/web/src/client --type ts --type tsx
rg -l 'from.*@/components/BrowserScriptUtils' apps/web/src/client --type ts --type tsx
rg -l 'from.*@/components/TaskLauncher' apps/web/src/client --type ts --type tsx
rg -l 'from.*@/robot' apps/web/src/client --type ts --type tsx
```

For each match, replace `@/components/XXX` with `@/components/common/XXX` and `@/robot/` with `@/components/common/robot/`.

- [ ] **Batch-update @/ paths for moved common components**

```bash
# Use sed to update @/ paths (replace @/components/XXX with @/components/common/XXX for moved items)
for pattern in \
  "s|from '@/components/AuthErrorToast|from '@/components/common/AuthErrorToast|g" \
  "s|from '@/components/CloseConfirmDialog|from '@/components/common/CloseConfirmDialog|g" \
  "s|from '@/components/DaemonConnectionToast|from '@/components/common/DaemonConnectionToast|g" \
  "s|from '@/components/DaemonStatusDot|from '@/components/common/DaemonStatusDot|g" \
  "s|from '@/components/SpinningIcon'|from '@/components/common/SpinningIcon'|g" \
  "s|from '@/components/StatusIcon'|from '@/components/common/StatusIcon'|g" \
  "s|from '@/components/TodoListItem|from '@/components/common/TodoListItem|g" \
  "s|from '@/components/TodoSidebar|from '@/components/common/TodoSidebar|g" \
  "s|from '@/components/BrowserScriptCard'|from '@/components/common/BrowserScriptCard'|g" \
  "s|from '@/components/BrowserScriptCardHelpers|from '@/components/common/BrowserScriptCardHelpers|g" \
  "s|from '@/components/BrowserScriptUtils|from '@/components/common/BrowserScriptUtils|g" \
  "s|from '@/components/TaskLauncher|from '@/components/common/TaskLauncher|g" \
  "s|from '@/robot|from '@/components/common/robot|g"; do
  for file in $(rg -l "$(echo "$pattern" | sed 's/^s.from.|from.*|g$//')" apps/web/src/client --type ts --type tsx 2>/dev/null); do
    sed -i '' "$pattern" "$file"
  done
done
```

- [ ] **Also fix relative imports in files that reference moved components**

Files using relative imports (e.g., `../../components/SpinningIcon`) also need updating. Check:

```bash
# Check which files still have broken relative references to the old paths
rg -l 'from.*\.\./components/(ActionChip|Arrow|AuthErrorToast|CloseConfirmDialog|DaemonConnectionToast|DaemonStatusDot|SpinningIcon|StatusIcon|TodoListItem|TodoSidebar|BrowserScriptCard|BrowserScriptCardHelpers|BrowserScriptUtils|TaskLauncher)' apps/web/src/client --type ts --type tsx
```

Fix any remaining relative imports manually.

- [ ] **Commit Task 3**

```bash
git add apps/web/src/client/components/common/ apps/web/src/client/robot/ 2>/dev/null
# Only stage what actually moved
git commit -m "refactor: move global components to components/common/"
```

---

### Task 4: Move layouts — main layout + settings layout

- [ ] **Move components/layout/ to layouts/main/components/ (except SettingsLayout)**

```bash
git mv apps/web/src/client/components/layout/Sidebar.tsx apps/web/src/client/layouts/main/components/Sidebar.tsx
git mv apps/web/src/client/components/layout/SidebarFallback.tsx apps/web/src/client/layouts/main/components/SidebarFallback.tsx
git mv apps/web/src/client/components/layout/Header.tsx apps/web/src/client/layouts/main/components/Header.tsx
git mv apps/web/src/client/components/layout/NavItem.tsx apps/web/src/client/layouts/main/components/NavItem.tsx
git mv apps/web/src/client/components/layout/NavLink.tsx apps/web/src/client/layouts/main/components/NavLink.tsx
git mv apps/web/src/client/components/layout/ConversationListItem.tsx apps/web/src/client/layouts/main/components/ConversationListItem.tsx
git mv apps/web/src/client/components/layout/WorkspaceSelector.tsx apps/web/src/client/layouts/main/components/WorkspaceSelector.tsx
git mv apps/web/src/client/components/layout/settings-tabs.ts apps/web/src/client/layouts/main/components/settings-tabs.ts
git mv apps/web/src/client/components/layout/SettingsDialog.tsx apps/web/src/client/layouts/main/components/SettingsDialog.tsx
git mv apps/web/src/client/components/layout/SettingsDialogContent.tsx apps/web/src/client/layouts/main/components/SettingsDialogContent.tsx
git mv apps/web/src/client/components/layout/AuthSettingsDialog.tsx apps/web/src/client/layouts/main/components/AuthSettingsDialog.tsx
git mv apps/web/src/client/components/layout/useSettingsDialog.ts apps/web/src/client/layouts/main/hooks/useSettingsDialog.ts
git mv apps/web/src/client/components/layout/useSettingsDialog.types.ts apps/web/src/client/layouts/main/hooks/useSettingsDialog.types.ts
git mv apps/web/src/client/components/layout/useSettingsDialogEffects.ts apps/web/src/client/layouts/main/hooks/useSettingsDialogEffects.ts
```

- [ ] **Move SettingsLayout to layouts/settings/**

```bash
git mv apps/web/src/client/components/layout/SettingsLayout.tsx apps/web/src/client/layouts/settings/SettingsLayout.tsx
```

- [ ] **Move App.tsx + App.components.tsx + App.types.ts to layouts/main/**

```bash
git mv apps/web/src/client/App.tsx apps/web/src/client/layouts/main/App.tsx
git mv apps/web/src/client/App.components.tsx apps/web/src/client/layouts/main/App.components.tsx
git mv apps/web/src/client/App.types.ts apps/web/src/client/layouts/main/App.types.ts
```

- [ ] **Update imports in moved files**

Update `layouts/main/App.tsx`:
- Change `./App.components` → `./App.components` (same dir — unchanged)
- Change `./App.types` → `./App.types` (same dir — unchanged)
- Change `./components/AuthErrorToast` → `../components/common/AuthErrorToast`
- Change `./components/CloseConfirmDialog` → `../components/common/CloseConfirmDialog`
- Change `./components/DaemonConnectionToast` → `../components/common/DaemonConnectionToast`
- Change `./components/layout/AuthSettingsDialog` → `./components/AuthSettingsDialog`
- Change `./components/layout/Sidebar` → `./components/Sidebar`
- Change `./components/layout/SidebarFallback` → `./components/SidebarFallback`
- Change `./components/TaskLauncher` → `../components/common/TaskLauncher`
- Change `./components/ui/ErrorBoundary` → `../components/ui/ErrorBoundary`
- Change `./lib/logger` → `../utils/logger` (will be in utils/)
- Change `./lib/myboteam` → `../config/myboteam` (will be in config/)
- Change `./stores/taskStore` → `../stores/taskStore` (still at same relative depth)

Update `layouts/main/App.components.tsx`:
- Change `@/lib/animations` → `@/utils/animations`
- Change `@/lib/myboteam` → `@/config/myboteam`
- Change `./pages/execution/AnimatedOutlet` → `@/pages/conversation/AnimatedOutlet`

Update `layouts/main/components/Sidebar.tsx`:
- Change `@/components/DaemonStatusDot` → `@/components/common/DaemonStatusDot`
- Change `./NavItem` → `./NavItem` (same dir — unchanged)
- Change `./WorkspaceSelector` → `./WorkspaceSelector` (same dir — unchanged)
- All `@/components/ui/...`, `@/lib/...`, `@/stores/...` stay valid

Update `layouts/main/components/Header.tsx`:
- Change `./NavLink` → `./NavLink` (same dir — unchanged)

Update `layouts/main/components/SettingsDialog.tsx`:
- Change `./SettingsDialogContent` → `./SettingsDialogContent` (same dir — unchanged)
- Change `./settings-tabs` → `./settings-tabs` (same dir — unchanged)
- Change `./useSettingsDialog` → `../hooks/useSettingsDialog`

Update `layouts/main/components/SettingsDialogContent.tsx`:
- Change `@/components/settings/...` → `@/pages/settings/.../...` (each to its new page path)
- Change `./settings-tabs` → `./settings-tabs` (same dir — unchanged)
- Change `./useSettingsDialog` → `../hooks/useSettingsDialog`
- Change `@/lib/animations` → `@/utils/animations`

Update `layouts/main/components/AuthSettingsDialog.tsx`:
- Change `@/pages/settings/ProvidersPage` → `@/pages/settings/providers/ProvidersPage`

Update `layouts/main/components/ConversationListItem.tsx`:
- Change `@/components/landing/IntegrationIcons` → `@/pages/home/components/IntegrationIcons`

Update `layouts/main/hooks/useSettingsDialog.ts`:
- Change `@/components/settings/hooks/useProviderSettings` → `@/pages/settings/providers/hooks/useProviderSettings`
- Change `./useSettingsDialog.types` → `./useSettingsDialog.types` (same dir — unchanged)
- Change `./useSettingsDialogEffects` → `./useSettingsDialogEffects` (same dir — unchanged)

Update `layouts/settings/SettingsLayout.tsx`:
- Change `./settings-tabs` → `../main/components/settings-tabs` (relative)

- [ ] **Update router.tsx to reference new paths**

In `apps/web/src/client/router.tsx`:
- Change `./App` → `./layouts/main/App`
- Change `./components/layout/SettingsLayout` → `./layouts/settings/SettingsLayout`
- Change `./pages/Execution` → `./pages/conversation/ConversationView`
- Change `./pages/Home` → `./pages/home/Home`
- Change `./pages/History.tsx` path (if references remain — will become conversations pages)
- Change `./pages/settings/AboutPage` → `./pages/settings/about/AboutPage`
- Change `./pages/settings/BrowsersPage` → `./pages/settings/browsers/BrowsersPage`
- Change `./pages/settings/GeneralPage` → `./pages/settings/general/GeneralPage`
- Change `./pages/settings/IntegrationsPage` → `./pages/settings/integrations/IntegrationsPage`
- Change `./pages/settings/ProvidersPage` → `./pages/settings/providers/ProvidersPage`
- Change `./pages/settings/SchedulerPage` → `./pages/settings/scheduler/SchedulerPage`
- Change `./pages/settings/SkillsPage` → `./pages/settings/skills/SkillsPage`
- Change `./pages/settings/VoicePage` → `./pages/settings/voice/VoicePage`
- Change `./pages/settings/WorkspacesPage` → `./pages/settings/workspaces/WorkspacesPage`

- [ ] **Move router.tsx to routes/**

```bash
git mv apps/web/src/client/router.tsx apps/web/src/client/routes/router.tsx
```

- [ ] **Update main.tsx import**

In `apps/web/src/client/main.tsx`:
- Change `./router` → `./routes/router`

- [ ] **Update all @/ imports referencing moved layout components**

```bash
# Batch-update @/ paths
for pattern in \
  "s|from '@/components/layout/|from '@/layouts/main/components/|g" \
  "s|from '@/pages/settings/ProvidersPage|from '@/pages/settings/providers/ProvidersPage|g"; do
  for file in $(rg -l "$(echo "$pattern" | sed 's/^s.from.|from.*|g$//')" apps/web/src/client --type ts --type tsx 2>/dev/null); do
    sed -i '' "$pattern" "$file"
  done
done
```

- [ ] **Fix remaining relative imports**

Check for any remaining files with broken relative imports referencing the old layout paths:

```bash
rg -l 'from.*\.\./components/layout/' apps/web/src/client --type ts --type tsx
rg -l 'from.*\.\./\.\./components/layout/' apps/web/src/client --type ts --type tsx
rg -l 'from.*\.\./\.\./\.\./components/layout/' apps/web/src/client --type ts --type tsx
```

Fix each occurrence.

- [ ] **Commit Task 4**

```bash
git commit -m "refactor: move layouts to layouts/main/ and layouts/settings/"
```

---

### Task 5: Move home page → `pages/home/`

- [ ] **Move landing components to pages/home/components/**

```bash
git mv apps/web/src/client/components/landing/TaskInputBar.tsx apps/web/src/client/pages/home/components/TaskInputBar.tsx
git mv apps/web/src/client/components/landing/TaskInputTextarea.tsx apps/web/src/client/pages/home/components/TaskInputTextarea.tsx
git mv apps/web/src/client/components/landing/TaskInputToolbar.tsx apps/web/src/client/pages/home/components/TaskInputToolbar.tsx
git mv apps/web/src/client/components/landing/TaskInputAttachmentList.tsx apps/web/src/client/pages/home/components/TaskInputAttachmentList.tsx
git mv apps/web/src/client/components/landing/SlashCommandPopover.tsx apps/web/src/client/pages/home/components/SlashCommandPopover.tsx
git mv apps/web/src/client/components/landing/FileTypeIcon.tsx apps/web/src/client/pages/home/components/FileTypeIcon.tsx
git mv apps/web/src/client/components/landing/IntegrationIcons.tsx apps/web/src/client/pages/home/components/IntegrationIcons.tsx
git mv apps/web/src/client/components/landing/caretPosition.ts apps/web/src/client/pages/home/components/caretPosition.ts
git mv apps/web/src/client/components/landing/PlusMenu/index.tsx apps/web/src/client/pages/home/components/PlusMenu/index.tsx
git mv apps/web/src/client/components/landing/PlusMenu/PlusMenuItems.tsx apps/web/src/client/pages/home/components/PlusMenu/PlusMenuItems.tsx
git mv apps/web/src/client/components/landing/PlusMenu/SkillsSubmenu.tsx apps/web/src/client/pages/home/components/PlusMenu/SkillsSubmenu.tsx
git mv apps/web/src/client/components/landing/PlusMenu/ConnectorsSubmenu.tsx apps/web/src/client/pages/home/components/PlusMenu/ConnectorsSubmenu.tsx
git mv apps/web/src/client/components/landing/useTaskInputBar.ts apps/web/src/client/pages/home/hooks/useTaskInputBar.ts
```

- [ ] **Move home page files**

```bash
git mv apps/web/src/client/pages/Home.tsx apps/web/src/client/pages/home/Home.tsx
git mv apps/web/src/client/pages/home/useHomePage.ts apps/web/src/client/pages/home/hooks/useHomePage.ts
git mv apps/web/src/client/pages/home/usePromptAttachments.ts apps/web/src/client/pages/home/hooks/usePromptAttachments.ts
```

- [ ] **Update imports in moved files**

Update `pages/home/Home.tsx`:
- Change `@/components/landing/PlusMenu` → `./components/PlusMenu`
- Change `@/components/landing/TaskInputBar` → `./components/TaskInputBar`
- Change `@/robot/FloatingRobot` → `@/components/common/robot/FloatingRobot`
- Change `./home/useHomePage` → `./hooks/useHomePage`

Update `pages/home/components/TaskInputTextarea.tsx`:
- Change `@/components/landing/SlashCommandPopover` → `./SlashCommandPopover`

Update `pages/home/components/TaskInputToolbar.tsx`:
- All `@/` imports still valid (ui/, hooks/, etc.)

Update `pages/home/components/TaskInputTextarea.tsx`:
- Change `@/components/landing/SlashCommandPopover` → `./SlashCommandPopover`

Update `pages/home/components/PlusMenu/index.tsx`:
- Change `@/components/skills/CreateSkillModal` → `@/pages/settings/skills/CreateSkillModal`
- Change `./PlusMenuItems` → `./PlusMenuItems` (same dir — unchanged)

Update `pages/home/components/PlusMenu/PlusMenuItems.tsx`:
- Change `./ConnectorsSubmenu` → `./ConnectorsSubmenu` (same dir — unchanged)
- Change `./SkillsSubmenu` → `./SkillsSubmenu` (same dir — unchanged)

Update `pages/home/hooks/useTaskInputBar.ts`:
- All `@/hooks/`, `@/lib/` imports still valid

Update `pages/home/hooks/useHomePage.ts`:
- Change `./homeConstants` → `../homeConstants`
- Change `./usePromptAttachments` → `./usePromptAttachments` (same dir — unchanged)

Update `pages/home/hooks/usePromptAttachments.ts`:
- `@/lib/fileUtils` → `@/utils/fileUtils` (will be updated in Task 7)

Update `pages/home/FavoritesSection.tsx`:
- Change `./useHomePage` → `./hooks/useHomePage`

Update `pages/home/ExamplesSection.tsx`:
- Change `@/components/landing/IntegrationIcons` → `./components/IntegrationIcons`

- [ ] **Batch-update @/ paths for landing references**

```bash
for pattern in \
  "s|from '@/components/landing/|from '@/pages/home/components/|g"; do
  for file in $(rg -l "$(echo "$pattern" | sed 's/^s.from.|from.*|g$//')" apps/web/src/client --type ts --type tsx 2>/dev/null); do
    sed -i '' "$pattern" "$file"
  done
done
```

- [ ] **Fix remaining relative imports**

Check for broken relative paths:
```bash
rg -l 'from.*\.\./components/landing/' apps/web/src/client --type ts --type tsx
```

Fix each occurrence.

- [ ] **Commit Task 5**

```bash
git commit -m "refactor: move home page to pages/home/"
```

---

### Task 6: Move conversation page (renamed from execution) → `pages/conversation/`

- [ ] **Move execution components to pages/conversation/components/**

```bash
git mv apps/web/src/client/components/execution/*.tsx apps/web/src/client/pages/conversation/components/
git mv apps/web/src/client/components/execution/*.ts apps/web/src/client/pages/conversation/components/
```

Note: `SpinningIcon.tsx` in execution components is a duplicate — this gets renamed during move. The component is used locally so renaming doesn't break anything as long as we update references.

- [ ] **Move execution page files to pages/conversation/ with renames**

```bash
git mv apps/web/src/client/pages/execution/ConversationView.tsx apps/web/src/client/pages/conversation/ConversationView.tsx
git mv apps/web/src/client/pages/execution/ExecutionHeader.tsx apps/web/src/client/pages/conversation/ConversationHeader.tsx
git mv apps/web/src/client/pages/execution/ExecutionCompleteFooter.tsx apps/web/src/client/pages/conversation/ConversationCompleteFooter.tsx
git mv apps/web/src/client/pages/execution/FollowUpAttachments.tsx apps/web/src/client/pages/conversation/FollowUpAttachments.tsx
git mv apps/web/src/client/pages/execution/FollowUpInput.tsx apps/web/src/client/pages/conversation/FollowUpInput.tsx
git mv apps/web/src/client/pages/execution/FollowUpToolbar.tsx apps/web/src/client/pages/conversation/FollowUpToolbar.tsx
git mv apps/web/src/client/pages/execution/QueuedEmptyState.tsx apps/web/src/client/pages/conversation/QueuedEmptyState.tsx
git mv apps/web/src/client/pages/execution/QueuedState.tsx apps/web/src/client/pages/conversation/QueuedState.tsx
git mv apps/web/src/client/pages/execution/AnimatedOutlet.tsx apps/web/src/client/pages/conversation/AnimatedOutlet.tsx
git mv apps/web/src/client/pages/execution/DragOverlay.tsx apps/web/src/client/pages/conversation/DragOverlay.tsx
git mv apps/web/src/client/pages/execution/StatusBadge.tsx apps/web/src/client/pages/conversation/components/StatusBadge.tsx
git mv apps/web/src/client/pages/execution/types.ts apps/web/src/client/pages/conversation/types.ts
git mv apps/web/src/client/pages/execution/execution-utils.ts apps/web/src/client/pages/conversation/conversation-utils.ts
git mv apps/web/src/client/pages/execution/executionStatusUtils.ts apps/web/src/client/pages/conversation/conversationStatusUtils.ts
git mv apps/web/src/client/pages/execution/useExecutionActions.ts apps/web/src/client/pages/conversation/hooks/useExecutionActions.ts
git mv apps/web/src/client/pages/execution/useExecutionAttachments.ts apps/web/src/client/pages/conversation/hooks/useExecutionAttachments.ts
git mv apps/web/src/client/pages/execution/useExecutionCore.ts apps/web/src/client/pages/conversation/hooks/useExecutionCore.ts
git mv apps/web/src/client/pages/execution/useExecutionDebugState.ts apps/web/src/client/pages/conversation/hooks/useExecutionDebugState.ts
git mv apps/web/src/client/pages/execution/useExecutionEffects.ts apps/web/src/client/pages/conversation/hooks/useExecutionEffects.ts
git mv apps/web/src/client/pages/execution/useExecutionEvents.ts apps/web/src/client/pages/conversation/hooks/useExecutionEvents.ts
git mv apps/web/src/client/pages/execution/useExecutionPage.ts apps/web/src/client/pages/conversation/hooks/useExecutionPage.ts
git mv apps/web/src/client/pages/execution/useExecutionPauseActions.ts apps/web/src/client/pages/conversation/hooks/useExecutionPauseActions.ts
git mv apps/web/src/client/pages/execution/useExecutionScroll.ts apps/web/src/client/pages/conversation/hooks/useExecutionScroll.ts
```

- [ ] **Remove old Execution.tsx and empty directories**

```bash
git rm apps/web/src/client/pages/Execution.tsx
rmdir apps/web/src/client/pages/execution
rmdir apps/web/src/client/components/execution
```

- [ ] **Update imports in moved files — update relative paths**

In `pages/conversation/ConversationView.tsx`:
- Change `../../components/execution/BrowserPreview` → `./components/BrowserPreview`
- Change `../../components/execution/MessageList` → `./components/MessageList`
- Change `../../components/execution/PermissionDialog` → `./components/PermissionDialog`
- Change `../../components/execution/ToolProgress` → `./components/ToolProgress`
- Change `../../components/TodoSidebar` → `../common/components/common/TodoSidebar`
- Change `../../lib/animations` → `@/utils/animations`
- Change `../../lib/waiting-detection` → `@/utils/waiting-detection`
- Change `./types` → `./types` (same dir — unchanged)

In `pages/conversation/ConversationHeader.tsx`:
- Change `./StatusBadge` → `./components/StatusBadge` (moved to components/)

In `pages/conversation/ConversationCompleteFooter.tsx`:
- Change `./executionStatusUtils` → `./conversationStatusUtils`
- Change `../../lib/task-utils` → `@/utils/task-utils`
- Change `../../stores/taskStore` → `@/stores/taskStore`

In `pages/conversation/FollowUpInput.tsx`:
- Change `../../components/landing/SlashCommandPopover` → `@/pages/home/components/SlashCommandPopover`
- Change `../../hooks/useSlashCommand` → `@/hooks/useSlashCommand`
- Change `../../hooks/useSpeechInput` → `@/hooks/useSpeechInput`
- Change `./FollowUpAttachments` → `./FollowUpAttachments` (same dir — unchanged)
- Change `./FollowUpToolbar` → `./FollowUpToolbar` (same dir — unchanged)

In `pages/conversation/FollowUpToolbar.tsx`:
- Change `../../components/landing/PlusMenu` → `@/pages/home/components/PlusMenu`
- All `@/components/ui/...` stay valid

In `pages/conversation/FollowUpAttachments.tsx`:
- Change `../../lib/attachments` → `@/utils/attachments`

In `pages/conversation/hooks/useExecutionCore.ts`:
- Change `../../hooks/useSlashCommand` → `@/hooks/useSlashCommand`
- Change `../../hooks/useSpeechInput` → `@/hooks/useSpeechInput`
- Change `../../lib/myboteam` → `@/config/myboteam`
- Change `../../stores/taskStore` → `@/stores/taskStore`
- Change `./useExecutionAttachments` → `./useExecutionAttachments` (same dir — unchanged)
- Change `./useExecutionDebugState` → `./useExecutionDebugState` (same dir — unchanged)
- Change `./useExecutionEvents` → `./useExecutionEvents` (same dir — unchanged)
- Change `./useExecutionScroll` → `./useExecutionScroll` (same dir — unchanged)

In `pages/conversation/hooks/useExecutionActions.ts`:
- Change `../../lib/logger` → `@/utils/logger`
- Change `./useExecutionCore` → `./useExecutionCore` (same dir — unchanged)
- Change `./useExecutionEffects` → `./useExecutionEffects` (same dir — unchanged)
- Change `./useExecutionPauseActions` → `./useExecutionPauseActions` (same dir — unchanged)

In `pages/conversation/hooks/useExecutionEvents.ts`:
- Change `../../components/execution/DebugPanel` → `@/pages/conversation/components/DebugPanel`
- Change `../../lib/myboteam` → `@/config/myboteam`
- Change `../../stores/taskStore` → `@/stores/taskStore`

In `pages/conversation/hooks/useExecutionAttachments.ts`:
- Change `../../lib/fileUtils` → `@/utils/fileUtils`
- Change `../../lib/logger` → `@/utils/logger`
- Change `../../lib/myboteam` → `@/config/myboteam`

In `pages/conversation/hooks/useExecutionDebugState.ts`:
- Change `../../components/execution/DebugPanel` → `@/pages/conversation/components/DebugPanel`
- Change `../../lib/logger` → `@/utils/logger`

In `pages/conversation/components/MessageList.tsx`:
- Change `../../constants/tool-mappings` → `@/utils/tool-mappings`
- Change `../../lib/animations` → `@/utils/animations`
- Change `../BrowserScriptCard` → `@/components/common/BrowserScriptCard`

In `pages/conversation/components/ToolProgress.tsx`:
- Change `../../constants/tool-mappings` → `@/utils/tool-mappings`
- Change `../../lib/animations` → `@/utils/animations`

In `pages/conversation/components/BrowserPreview.tsx`:
- Change `../../lib/animations` → `@/utils/animations`

In `pages/conversation/components/CreditExhaustedChatBanner.tsx`:
- Change `../../lib/animations` → `@/utils/animations`

In `pages/conversation/components/PermissionDialog.tsx`:
- Change `../../lib/animations` → `@/utils/animations`

In `pages/conversation/components/SpinningIcon.tsx` (the execution variant):
- `@/lib/utils` → `@/utils/utils` (will be fixed in Task 7)

In `pages/conversation/BrowserInstallModal.tsx`:
- Change `../../lib/animations` → `@/utils/animations`

- [ ] **Update remaining @/ imports for execution components**

```bash
# Batch-update @/ imports for execution components that moved
for pattern in \
  "s|from '@/components/execution/|from '@/pages/conversation/components/|g"; do
  for file in $(rg -l "$(echo "$pattern" | sed 's/^s.from.|from.*|g$//')" apps/web/src/client --type ts --type tsx 2>/dev/null); do
    sed -i '' "$pattern" "$file"
  done
done
```

- [ ] **Update router.tsx**

Change: `import ExecutionPage from './pages/Execution'` → `import { ConversationView } from './pages/conversation/ConversationView'`
Change the route component from `ExecutionPage` to `ConversationView`.

- [ ] **Commit Task 6**

```bash
git commit -m "refactor: rename execution/ to conversation/ with file renames"
```

---

### Task 7: Move conversations page (renamed from history) → `pages/conversations/`

- [ ] **Move history components to pages/conversations/components/**

```bash
git mv apps/web/src/client/components/history/TaskHistory.tsx apps/web/src/client/pages/conversations/components/ConversationList.tsx
git mv apps/web/src/client/components/history/TaskHistoryItem.tsx apps/web/src/client/pages/conversations/components/ConversationListItem.tsx
```

- [ ] **Move history and conversations page files**

```bash
git mv apps/web/src/client/pages/History.tsx apps/web/src/client/pages/conversations/HistoryPage.tsx
git mv apps/web/src/client/pages/ConversationsPage.tsx apps/web/src/client/pages/conversations/ConversationsPage.tsx
git mv apps/web/src/client/pages/ConversationsFavoritesPage.tsx apps/web/src/client/pages/conversations/ConversationsFavoritesPage.tsx
git mv apps/web/src/client/pages/ExamplesPage.tsx apps/web/src/client/pages/conversations/ExamplesPage.tsx
```

- [ ] **Delete empty directories**

```bash
rmdir apps/web/src/client/components/history
```

- [ ] **Update imports**

Update `pages/conversations/ConversationList.tsx`:
- Change `./TaskHistoryItem` → `./ConversationListItem` (from rename)
- Change `../../stores/taskStore` → `@/stores/taskStore`

Update `pages/conversations/ConversationListItem.tsx`:
- Change `../../lib/task-utils` → `@/utils/task-utils`
- Change `../ui/StarButton` → `@/components/ui/StarButton`

Update `pages/conversations/HistoryPage.tsx` (was pages/History.tsx):
- Change `../components/history/TaskHistory` → `./components/ConversationList`
- Change `../components/layout/Header` → `@/layouts/main/components/Header`
- Change `../stores/taskStore` → `@/stores/taskStore`

Update `pages/conversations/ConversationsPage.tsx`:
- Change `../components/layout/ConversationListItem` → `@/layouts/main/components/ConversationListItem`
- Change `../components/ui/...` → `@/components/ui/...` (use @/ since depth changed)

Update `pages/conversations/ConversationsFavoritesPage.tsx`:
- Change `./ConversationsPage` → `./ConversationsPage` (same dir — unchanged)
- Change `./home/FavoritesSection` → `@/pages/home/FavoritesSection`
- Change `./home/homeConstants` → `@/pages/home/homeConstants`

Update `pages/conversations/ExamplesPage.tsx`:
- Change `./home/ExamplesSection` → `@/pages/home/ExamplesSection`
- Change `./home/homeConstants` → `@/pages/home/homeConstants`

- [ ] **Update router.tsx**

Update imports for new paths:
- `./pages/History` → `./pages/conversations/HistoryPage`
- `./pages/ConversationsPage` → `./pages/conversations/ConversationsPage`
- `./pages/ConversationsFavoritesPage` → `./pages/conversations/ConversationsFavoritesPage`
- `./pages/ExamplesPage` → `./pages/conversations/ExamplesPage`

- [ ] **Commit Task 7**

```bash
git commit -m "refactor: rename history/ to conversations/ with file renames"
```

---

### Task 8: Move settings sub-pages → individual `pages/settings/*/`

This task moves each setting sub-area to its own page folder. Each sub-task follows the same pattern: move the page view to `<page>/PageName.tsx`, move its components to `<page>/components/`, move its hooks to `<page>/hooks/`.

#### 8a: settings/general

- [ ] **Move general page + components**

```bash
git mv apps/web/src/client/pages/settings/GeneralPage.tsx apps/web/src/client/pages/settings/general/GeneralPage.tsx
git mv apps/web/src/client/components/settings/GeneralTab.tsx apps/web/src/client/pages/settings/general/components/GeneralTab.tsx
git mv apps/web/src/client/components/settings/LanguageSelector.tsx apps/web/src/client/pages/settings/general/components/LanguageSelector.tsx
git mv apps/web/src/client/components/settings/ThemeSelector.tsx apps/web/src/client/pages/settings/general/components/ThemeSelector.tsx
git mv apps/web/src/client/components/settings/NotificationsSection.tsx apps/web/src/client/pages/settings/general/components/NotificationsSection.tsx
git mv apps/web/src/client/components/settings/SpeechSettingsForm.tsx apps/web/src/client/pages/settings/general/components/SpeechSettingsForm.tsx
git mv apps/web/src/client/components/settings/DaemonSection.tsx apps/web/src/client/pages/settings/general/components/DaemonSection.tsx
git mv apps/web/src/client/components/settings/DebugSection.tsx apps/web/src/client/pages/settings/general/components/DebugSection.tsx
git mv apps/web/src/client/components/settings/SandboxSection.tsx apps/web/src/client/pages/settings/general/components/SandboxSection.tsx
git mv apps/web/src/client/components/settings/SandboxPanel.tsx apps/web/src/client/pages/settings/general/components/SandboxPanel.tsx
git mv apps/web/src/client/components/settings/SandboxModeSelector.tsx apps/web/src/client/pages/settings/general/components/SandboxModeSelector.tsx
git mv apps/web/src/client/components/settings/useSandboxPanel.ts apps/web/src/client/pages/settings/general/hooks/useSandboxPanel.ts
git mv apps/web/src/client/components/settings/ColorPicker.tsx apps/web/src/client/pages/settings/general/components/ColorPicker.tsx
```

#### 8b: settings/providers

- [ ] **Move providers page + components**

```bash
git mv apps/web/src/client/pages/settings/ProvidersPage.tsx apps/web/src/client/pages/settings/providers/ProvidersPage.tsx
git mv apps/web/src/client/components/settings/ProviderGrid.tsx apps/web/src/client/pages/settings/providers/components/ProviderGrid.tsx
git mv apps/web/src/client/components/settings/ProviderCard.tsx apps/web/src/client/pages/settings/providers/components/ProviderCard.tsx
git mv apps/web/src/client/components/settings/ProviderSettingsPanel.tsx apps/web/src/client/pages/settings/providers/components/ProviderSettingsPanel.tsx
git mv apps/web/src/client/components/settings/ProviderFormSelector.tsx apps/web/src/client/pages/settings/providers/components/ProviderFormSelector.tsx
git mv apps/web/src/client/components/settings/ProviderForm.tsx apps/web/src/client/pages/settings/providers/components/ProviderForm.tsx
git mv apps/web/src/client/components/settings/hooks/useProviderSettings.ts apps/web/src/client/pages/settings/providers/hooks/useProviderSettings.ts
git mv apps/web/src/client/components/settings/providers/ apps/web/src/client/pages/settings/providers/components/providers/
git mv apps/web/src/client/components/settings/shared/ apps/web/src/client/pages/settings/providers/components/shared/
```

Note: The providers/ and shared/ subdirectories contain ~50+ files. Using `git mv` on the entire directory is most efficient.

#### 8c: settings/integrations

- [ ] **Move integrations page + components**

```bash
git mv apps/web/src/client/pages/settings/IntegrationsPage.tsx apps/web/src/client/pages/settings/integrations/IntegrationsPage.tsx
git mv apps/web/src/client/components/settings/integrations/ apps/web/src/client/pages/settings/integrations/components/
```

#### 8d: settings/connectors

- [ ] **Move connectors page**

```bash
mkdir -p apps/web/src/client/pages/settings/connectors/components
git mv apps/web/src/client/components/settings/connectors/ apps/web/src/client/pages/settings/connectors/components/
```

#### 8e: settings/google-accounts

- [ ] **Move google-accounts page**

```bash
git mv apps/web/src/client/components/settings/google-accounts/ apps/web/src/client/pages/settings/google-accounts/components/
```

#### 8f: settings/scheduler

- [ ] **Move scheduler page + components**

```bash
git mv apps/web/src/client/pages/settings/SchedulerPage.tsx apps/web/src/client/pages/settings/scheduler/SchedulerPage.tsx
git mv apps/web/src/client/components/settings/scheduler/ apps/web/src/client/pages/settings/scheduler/components/
```

#### 8g: settings/skills

- [ ] **Move skills page + components**

```bash
git mv apps/web/src/client/pages/settings/SkillsPage.tsx apps/web/src/client/pages/settings/skills/SkillsPage.tsx
git mv apps/web/src/client/components/settings/skills/ apps/web/src/client/pages/settings/skills/components/
git mv apps/web/src/client/components/skills/CreateSkillModal.tsx apps/web/src/client/pages/settings/skills/components/CreateSkillModal.tsx
git mv apps/web/src/client/components/skills/createSkillPrompt.ts apps/web/src/client/pages/settings/skills/components/createSkillPrompt.ts
git mv apps/web/src/client/components/skills/index.ts apps/web/src/client/pages/settings/skills/components/index.ts
```

#### 8h: settings/about

- [ ] **Move about page + components**

```bash
git mv apps/web/src/client/pages/settings/AboutPage.tsx apps/web/src/client/pages/settings/about/AboutPage.tsx
git mv apps/web/src/client/components/settings/AboutTab.tsx apps/web/src/client/pages/settings/about/components/AboutTab.tsx
```

#### 8i: settings/browsers

- [ ] **Move browsers page + components**

```bash
git mv apps/web/src/client/pages/settings/BrowsersPage.tsx apps/web/src/client/pages/settings/browsers/BrowsersPage.tsx
git mv apps/web/src/client/components/settings/CloudBrowsersPanel.tsx apps/web/src/client/pages/settings/browsers/components/CloudBrowsersPanel.tsx
git mv apps/web/src/client/components/settings/CloudBrowserProviderRow.tsx apps/web/src/client/pages/settings/browsers/components/CloudBrowserProviderRow.tsx
git mv apps/web/src/client/components/settings/cloud-browsers-constants.ts apps/web/src/client/pages/settings/browsers/components/cloud-browsers-constants.ts
```

#### 8j: settings/voice

- [ ] **Move voice page**

```bash
git mv apps/web/src/client/pages/settings/VoicePage.tsx apps/web/src/client/pages/settings/voice/VoicePage.tsx
```

#### 8k: settings/workspaces

- [ ] **Move workspaces page + components**

```bash
git mv apps/web/src/client/pages/settings/WorkspacesPage.tsx apps/web/src/client/pages/settings/workspaces/WorkspacesPage.tsx
git mv apps/web/src/client/components/settings/WorkspacesPanel.tsx apps/web/src/client/pages/settings/workspaces/components/WorkspacesPanel.tsx
git mv apps/web/src/client/components/settings/WorkspacePanelForm.tsx apps/web/src/client/pages/settings/workspaces/components/WorkspacePanelForm.tsx
git mv apps/web/src/client/components/settings/WorkspaceRow.tsx apps/web/src/client/pages/settings/workspaces/components/WorkspaceRow.tsx
git mv apps/web/src/client/components/settings/WorkspacePanelForm.tsx apps/web/src/client/pages/settings/workspaces/components/WorkspacePanelForm.tsx
git mv apps/web/src/client/components/settings/CreateWorkspaceForm.tsx apps/web/src/client/pages/settings/workspaces/components/CreateWorkspaceForm.tsx
git mv apps/web/src/client/components/settings/KnowledgeNotesPanel.tsx apps/web/src/client/pages/settings/workspaces/components/KnowledgeNotesPanel.tsx
git mv apps/web/src/client/components/settings/NoteRow.tsx apps/web/src/client/pages/settings/workspaces/components/NoteRow.tsx
git mv apps/web/src/client/components/settings/AddNoteForm.tsx apps/web/src/client/pages/settings/workspaces/components/AddNoteForm.tsx
git mv apps/web/src/client/components/settings/useKnowledgeNotes.ts apps/web/src/client/pages/settings/workspaces/hooks/useKnowledgeNotes.ts
```

- [ ] **Delete empty directories**

```bash
rmdir apps/web/src/client/components/settings 2>/dev/null; rmdir apps/web/src/client/pages/settings/providers/vertex 2>/dev/null; rmdir apps/web/src/client/components/skills 2>/dev/null
```

- [ ] **Batch-update @/ imports for settings**

```bash
# Update @/components/settings/ → @/pages/settings/X/components/
# This needs individual patterns since each sub-area maps differently

# General settings
for pattern in \
  "s|from '@/components/settings/GeneralTab|from '@/pages/settings/general/components/GeneralTab|g" \
  "s|from '@/components/settings/LanguageSelector|from '@/pages/settings/general/components/LanguageSelector|g" \
  "s|from '@/components/settings/ThemeSelector|from '@/pages/settings/general/components/ThemeSelector|g" \
  "s|from '@/components/settings/NotificationsSection|from '@/pages/settings/general/components/NotificationsSection|g" \
  "s|from '@/components/settings/SpeechSettingsForm|from '@/pages/settings/general/components/SpeechSettingsForm|g" \
  "s|from '@/components/settings/DaemonSection|from '@/pages/settings/general/components/DaemonSection|g" \
  "s|from '@/components/settings/DebugSection|from '@/pages/settings/general/components/DebugSection|g" \
  "s|from '@/components/settings/SandboxSection|from '@/pages/settings/general/components/SandboxSection|g" \
  "s|from '@/components/settings/SandboxPanel|from '@/pages/settings/general/components/SandboxPanel|g" \
  "s|from '@/components/settings/SandboxModeSelector|from '@/pages/settings/general/components/SandboxModeSelector|g" \
  "s|from '@/components/settings/useSandboxPanel|from '@/pages/settings/general/hooks/useSandboxPanel|g" \
  "s|from '@/components/settings/ColorPicker|from '@/pages/settings/general/components/ColorPicker|g"; do
  for file in $(rg -l "$(echo "$pattern" | sed 's/^s.from.|from.*|g$//')" apps/web/src/client --type ts --type tsx 2>/dev/null); do
    sed -i '' "$pattern" "$file"
  done
done

# Providers settings
for pattern in \
  "s|from '@/components/settings/ProviderGrid|from '@/pages/settings/providers/components/ProviderGrid|g" \
  "s|from '@/components/settings/ProviderCard|from '@/pages/settings/providers/components/ProviderCard|g" \
  "s|from '@/components/settings/ProviderSettingsPanel|from '@/pages/settings/providers/components/ProviderSettingsPanel|g" \
  "s|from '@/components/settings/ProviderFormSelector|from '@/pages/settings/providers/components/ProviderFormSelector|g" \
  "s|from '@/components/settings/ProviderForm'|from '@/pages/settings/providers/components/ProviderForm'|g" \
  "s|from '@/components/settings/hooks/useProviderSettings|from '@/pages/settings/providers/hooks/useProviderSettings|g" \
  "s|from '@/components/settings/shared/|from '@/pages/settings/providers/components/shared/|g" \
  "s|from '@/components/settings/providers/|from '@/pages/settings/providers/components/providers/|g"; do
  for file in $(rg -l "$(echo "$pattern" | sed 's/^s.from.|from.*|g$//')" apps/web/src/client --type ts --type tsx 2>/dev/null); do
    sed -i '' "$pattern" "$file"
  done
done

# Integrations
for pattern in \
  "s|from '@/components/settings/integrations/|from '@/pages/settings/integrations/components/|g"; do
  for file in $(rg -l "$(echo "$pattern" | sed 's/^s.from.|from.*|g$//')" apps/web/src/client --type ts --type tsx 2>/dev/null); do
    sed -i '' "$pattern" "$file"
  done
done

# Connectors
for pattern in \
  "s|from '@/components/settings/connectors/|from '@/pages/settings/connectors/components/|g"; do
  for file in $(rg -l "$(echo "$pattern" | sed 's/^s.from.|from.*|g$//')" apps/web/src/client --type ts --type tsx 2>/dev/null); do
    sed -i '' "$pattern" "$file"
  done
done

# Google accounts
for pattern in \
  "s|from '@/components/settings/google-accounts/|from '@/pages/settings/google-accounts/components/|g"; do
  for file in $(rg -l "$(echo "$pattern" | sed 's/^s.from.|from.*|g$//')" apps/web/src/client --type ts --type tsx 2>/dev/null); do
    sed -i '' "$pattern" "$file"
  done
done

# Scheduler
for pattern in \
  "s|from '@/components/settings/scheduler/|from '@/pages/settings/scheduler/components/|g" \
  "s|from '@/components/settings/SchedulerPanel|from '@/pages/settings/scheduler/components/SchedulerPanel|g" \
  "s|from '@/components/settings/AddScheduleDialog|from '@/pages/settings/scheduler/components/AddScheduleDialog|g" \
  "s|from '@/components/settings/ScheduleCard|from '@/pages/settings/scheduler/components/ScheduleCard|g"; do
  for file in $(rg -l "$(echo "$pattern" | sed 's/^s.from.|from.*|g$//')" apps/web/src/client --type ts --type tsx 2>/dev/null); do
    sed -i '' "$pattern" "$file"
  done
done

# Skills
for pattern in \
  "s|from '@/components/settings/skills/|from '@/pages/settings/skills/components/|g" \
  "s|from '@/components/skills/|from '@/pages/settings/skills/components/|g"; do
  for file in $(rg -l "$(echo "$pattern" | sed 's/^s.from.|from.*|g$//')" apps/web/src/client --type ts --type tsx 2>/dev/null); do
    sed -i '' "$pattern" "$file"
  done
done

# About
for pattern in \
  "s|from '@/components/settings/AboutTab|from '@/pages/settings/about/components/AboutTab|g"; do
  for file in $(rg -l "$(echo "$pattern" | sed 's/^s.from.|from.*|g$//')" apps/web/src/client --type ts --type tsx 2>/dev/null); do
    sed -i '' "$pattern" "$file"
  done
done

# Browsers
for pattern in \
  "s|from '@/components/settings/CloudBrowsersPanel|from '@/pages/settings/browsers/components/CloudBrowsersPanel|g" \
  "s|from '@/components/settings/CloudBrowserProviderRow|from '@/pages/settings/browsers/components/CloudBrowserProviderRow|g" \
  "s|from '@/components/settings/cloud-browsers-constants|from '@/pages/settings/browsers/components/cloud-browsers-constants|g"; do
  for file in $(rg -l "$(echo "$pattern" | sed 's/^s.from.|from.*|g$//')" apps/web/src/client --type ts --type tsx 2>/dev/null); do
    sed -i '' "$pattern" "$file"
  done
done

# Workspaces
for pattern in \
  "s|from '@/components/settings/WorkspacesPanel|from '@/pages/settings/workspaces/components/WorkspacesPanel|g" \
  "s|from '@/components/settings/WorkspacePanelForm|from '@/pages/settings/workspaces/components/WorkspacePanelForm|g" \
  "s|from '@/components/settings/WorkspaceRow|from '@/pages/settings/workspaces/components/WorkspaceRow|g" \
  "s|from '@/components/settings/CreateWorkspaceForm|from '@/pages/settings/workspaces/components/CreateWorkspaceForm|g" \
  "s|from '@/components/settings/KnowledgeNotesPanel|from '@/pages/settings/workspaces/components/KnowledgeNotesPanel|g" \
  "s|from '@/components/settings/NoteRow|from '@/pages/settings/workspaces/components/NoteRow|g" \
  "s|from '@/components/settings/AddNoteForm|from '@/pages/settings/workspaces/components/AddNoteForm|g" \
  "s|from '@/components/settings/useKnowledgeNotes|from '@/pages/settings/workspaces/hooks/useKnowledgeNotes|g"; do
  for file in $(rg -l "$(echo "$pattern" | sed 's/^s.from.|from.*|g$//')" apps/web/src/client --type ts --type tsx 2>/dev/null); do
    sed -i '' "$pattern" "$file"
  done
done
```

- [ ] **Fix remaining settings imports — check for @/components/settings/ leftovers**

```bash
rg -l 'from.*@/components/settings/' apps/web/src/client --type ts --type tsx
```

Fix any remaining matches manually.

- [ ] **Fix relative imports within moved settings files**

```bash
# Check for relative imports within settings files that now have new relative depths
rg -l 'from.*\.\./' apps/web/src/client/pages/settings --type ts --type tsx | head -30
```

For each settings sub-page, check relative paths:
- Files in `pages/settings/general/components/` that import `../` (one level up = `pages/settings/general/`) are fine
- Files that import `../../` or more need checking

- [ ] **Fix the special case: shared/ and providers/ relative cross-references**

The `providers/components/providers/` and `providers/components/shared/` directories have many sibling imports. When they were under `components/settings/providers/` and `components/settings/shared/`, they'd import `../shared/` or `../providers/`. Now they need `../shared/` (from `providers/` to `shared/` is still `../shared/`). Verify these relative paths still work.

- [ ] **Commit Task 8**

```bash
git commit -m "refactor: split settings into individual page folders"
```

---

### Task 9: Split lib/ → config/ and utils/

- [ ] **Move config files (setup/initialization) to config/**

```bash
git mv apps/web/src/client/lib/myboteam.ts apps/web/src/client/config/myboteam.ts
git mv apps/web/src/client/lib/myboteam-accounts.ts apps/web/src/client/config/myboteam-accounts.ts
git mv apps/web/src/client/lib/myboteam-analytics.ts apps/web/src/client/config/myboteam-analytics.ts
git mv apps/web/src/client/lib/myboteam-connectors.ts apps/web/src/client/config/myboteam-connectors.ts
git mv apps/web/src/client/lib/myboteam-providers.ts apps/web/src/client/config/myboteam-providers.ts
git mv apps/web/src/client/lib/myboteam-settings.ts apps/web/src/client/config/myboteam-settings.ts
git mv apps/web/src/client/lib/myboteam-tasks.ts apps/web/src/client/config/myboteam-tasks.ts
git mv apps/web/src/client/lib/myboteam-types.ts apps/web/src/client/config/myboteam-types.ts
git mv apps/web/src/client/lib/platform.ts apps/web/src/client/config/platform.ts
git mv apps/web/src/client/i18n/index.ts apps/web/src/client/config/i18n/index.ts
git mv apps/web/src/client/i18n/locales/ apps/web/src/client/config/i18n/locales/
```

- [ ] **Move utils (pure utility functions) to utils/**

```bash
git mv apps/web/src/client/lib/utils.ts apps/web/src/client/utils/utils.ts
git mv apps/web/src/client/lib/fileUtils.ts apps/web/src/client/utils/fileUtils.ts
git mv apps/web/src/client/lib/logger.ts apps/web/src/client/utils/logger.ts
git mv apps/web/src/client/lib/animations.ts apps/web/src/client/utils/animations.ts
git mv apps/web/src/client/lib/hover-effects.ts apps/web/src/client/utils/hover-effects.ts
git mv apps/web/src/client/lib/glass-utils.ts apps/web/src/client/utils/glass-utils.ts
git mv apps/web/src/client/lib/theme.ts apps/web/src/client/utils/theme.ts
git mv apps/web/src/client/lib/theme-color.ts apps/web/src/client/utils/theme-color.ts
git mv apps/web/src/client/lib/theme-core.ts apps/web/src/client/utils/theme-core.ts
git mv apps/web/src/client/lib/model-utils.ts apps/web/src/client/utils/model-utils.ts
git mv apps/web/src/client/lib/task-utils.ts apps/web/src/client/utils/task-utils.ts
git mv apps/web/src/client/lib/provider-logos.ts apps/web/src/client/utils/provider-logos.ts
git mv apps/web/src/client/lib/waiting-detection.ts apps/web/src/client/utils/waiting-detection.ts
git mv apps/web/src/client/lib/attachments.tsx apps/web/src/client/utils/attachments.tsx
git mv apps/web/src/client/constants/tool-mappings.ts apps/web/src/client/utils/tool-mappings.ts
```

- [ ] **Update imports in moved config files**

Update `config/myboteam.ts`:
- Change `./myboteam-accounts` → `./myboteam-accounts` (same dir — unchanged)
- Change `./myboteam-connectors` → `./myboteam-connectors` (same dir — unchanged)
- Change `./myboteam-providers` → `./myboteam-providers` (same dir — unchanged)
- Change `./myboteam-settings` → `./myboteam-settings` (same dir — unchanged)
- Change `./myboteam-tasks` → `./myboteam-tasks` (same dir — unchanged)

Update `config/myboteam-settings.ts`:
- Change `./myboteam-analytics` → `./myboteam-analytics` (same dir — unchanged)
- Change `./myboteam-types` → `./myboteam-types` (same dir — unchanged)

Update `config/myboteam-accounts.ts`:
- Change `./myboteam-types` → `./myboteam-types` (same dir — unchanged)

Update `config/myboteam-providers.ts`:
- Change `./myboteam-types` → `./myboteam-types` (same dir — unchanged)

Update `config/myboteam-tasks.ts`:
- Change `./myboteam-types` → `./myboteam-types` (same dir — unchanged)

Update `config/theme.ts`:
- Change `./myboteam` → `./myboteam` (same dir — unchanged — wait, `theme.ts` is now in utils/ not config/)

Update `utils/theme.ts`:
- Change `./myboteam` → `../config/myboteam` (since theme.ts is now in utils/)
- Change `./theme-core` → `./theme-core` (same dir — unchanged)

Update `config/i18n/index.ts`:
- Change `../lib/logger` → `../utils/logger`

Update `utils/theme-core.ts`:
- Change `./theme-color.js` → `./theme-color.js` (same dir — unchanged). Note: uses `.js` extension.

- [ ] **Batch-update @/lib/ → @/utils/ for utility files**

```bash
for pattern in \
  "s|from '@/lib/utils'|from '@/utils/utils'|g" \
  "s|from '@/lib/logger|from '@/utils/logger|g" \
  "s|from '@/lib/animations|from '@/utils/animations|g" \
  "s|from '@/lib/fileUtils|from '@/utils/fileUtils|g" \
  "s|from '@/lib/hover-effects|from '@/utils/hover-effects|g" \
  "s|from '@/lib/glass-utils|from '@/utils/glass-utils|g" \
  "s|from '@/lib/task-utils|from '@/utils/task-utils|g" \
  "s|from '@/lib/model-utils|from '@/utils/model-utils|g" \
  "s|from '@/lib/provider-logos|from '@/utils/provider-logos|g" \
  "s|from '@/lib/waiting-detection|from '@/utils/waiting-detection|g" \
  "s|from '@/lib/attachments|from '@/utils/attachments|g" \
  "s|from '@/lib/theme'|from '@/utils/theme'|g" \
  "s|from '@/lib/theme-color|from '@/utils/theme-color|g" \
  "s|from '@/lib/theme-core|from '@/utils/theme-core|g" \
  "s|from '@/lib/platform|from '@/config/platform|g" \
  "s|from '@/constants/tool-mappings|from '@/utils/tool-mappings|g"; do
  for file in $(rg -l "$(echo "$pattern" | sed 's/^s.from.|from.*|g$//')" apps/web/src/client --type ts --type tsx 2>/dev/null); do
    sed -i '' "$pattern" "$file"
  done
done
```

- [ ] **Batch-update @/lib/myboteam → @/config/myboteam**

```bash
for pattern in \
  "s|from '@/lib/myboteam'|from '@/config/myboteam'|g" \
  "s|from '@/lib/myboteam-tasks|from '@/config/myboteam-tasks|g" \
  "s|from '@/lib/myboteam-accounts|from '@/config/myboteam-accounts|g" \
  "s|from '@/lib/myboteam-analytics|from '@/config/myboteam-analytics|g" \
  "s|from '@/lib/myboteam-connectors|from '@/config/myboteam-connectors|g" \
  "s|from '@/lib/myboteam-providers|from '@/config/myboteam-providers|g" \
  "s|from '@/lib/myboteam-settings|from '@/config/myboteam-settings|g" \
  "s|from '@/lib/myboteam-types|from '@/config/myboteam-types|g"; do
  for file in $(rg -l "$(echo "$pattern" | sed 's/^s.from.|from.*|g$//')" apps/web/src/client --type ts --type tsx 2>/dev/null); do
    sed -i '' "$pattern" "$file"
  done
done
```

- [ ] **Batch-update @/i18n → @/config/i18n**

```bash
for pattern in \
  "s|from '@/i18n|from '@/config/i18n|g"; do
  for file in $(rg -l "$(echo "$pattern" | sed 's/^s.from.|from.*|g$//')" apps/web/src/client --type ts --type tsx 2>/dev/null); do
    sed -i '' "$pattern" "$file"
  done
done
```

- [ ] **Update main.tsx**

Change `import { initI18n } from './i18n'` → `import { initI18n } from './config/i18n'`

- [ ] **Update remaining relative imports referencing lib/ or i18n/**

```bash
rg -l 'from.*\.\./lib/' apps/web/src/client --type ts --type tsx | grep -v node_modules
rg -l 'from.*\.\./\.\./lib/' apps/web/src/client --type ts --type tsx | grep -v node_modules
rg -l 'from.*\.\./\.\./\.\./lib/' apps/web/src/client --type ts --type tsx | grep -v node_modules
rg -l 'from.*\.\./i18n/' apps/web/src/client --type ts --type tsx | grep -v node_modules
```

Fix each occurrence by converting to `@/config/` or `@/utils/` paths, or recalculating relative paths.

- [ ] **Delete empty directories**

```bash
rmdir apps/web/src/client/lib
rmdir apps/web/src/client/i18n/locales 2>/dev/null
rmdir apps/web/src/client/i18n 2>/dev/null
rmdir apps/web/src/client/constants
```

- [ ] **Commit Task 9**

```bash
git commit -m "refactor: split lib/ into config/ and utils/"
```

---

### Task 10: Verify with typecheck

- [ ] **Run typecheck to find remaining import errors**

```bash
pnpm -F @myboteam/web typecheck 2>&1 | head -100
```

- [ ] **Iteratively fix import errors**

For each type error (missing module, cannot find module), identify the broken import path and fix it. The error message will include the file path and the broken import.

Common patterns to check:
- Files that imported `../../lib/` or `../lib/` with relative paths
- Files that imported `@/components/layout/` (now `@/layouts/main/components/`)
- Files that imported `@/components/landing/` (now `@/pages/home/components/`)
- Files that imported `@/components/execution/` (now `@/pages/conversation/components/`)
- Files that imported `@/components/history/` (now `@/pages/conversations/components/`)
- Files that imported `@/components/settings/` (now spread across `@/pages/settings/*/`)
- Files that imported `@/robot/` (now `@/components/common/robot/`)

Run typecheck iteratively until no errors remain.

- [ ] **Run full check suite**

```bash
pnpm check
```

Fix any Biome linter errors (likely just import ordering, if any).

- [ ] **Commit final fixes**

```bash
git add -A
git commit -m "fix: resolve import paths after folder restructure"
```
