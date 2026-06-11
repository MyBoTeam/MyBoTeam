# Settings Close Icon Fix & Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the macOS close button not working on the settings page and remove dead SettingsDialog/AuthSettingsDialog code, replacing it with direct navigation.

**Architecture:** The `/settings/*` routes use `SettingsLayout` (separate from `App` layout), so `CloseConfirmDialog` must be added to `SettingsLayout`. `AuthSettingsDialog` and `SettingsDialog` are replaced by navigating to settings routes. `AppOverlays` and `App` are simplified by removing all auth settings dialog state.

**Tech Stack:** React, React Router, TypeScript, Zustand, Radix UI Dialog, Framer Motion

---

## File Structure

### Files to modify:
- `apps/web/src/client/layouts/settings/SettingsLayout.tsx` — add `CloseConfirmDialog`
- `apps/web/src/client/layouts/main/components/AppOverlays.tsx` — remove AuthSettingsDialog, simplify props
- `apps/web/src/client/layouts/main/App.tsx` — remove auth settings state
- `apps/web/src/client/pages/conversation/hooks/useExecutionCore.ts` — remove `showSettingsDialog`/`settingsInitialTab` state
- `apps/web/src/client/pages/conversation/hooks/useExecutionActions.ts` — replace `setShowSettingsDialog` with `navigate`
- `apps/web/src/client/pages/conversation/hooks/useExecutionPauseActions.ts` — replace `setShowSettingsDialog` with `navigate`
- `apps/web/src/client/pages/conversation/hooks/useExecutionEffects.ts` — remove `showSettingsDialog` dependency
- `apps/web/src/client/pages/conversation/ExecutionPage.tsx` — replace `onOpenSettings` with navigation
- `apps/web/src/client/pages/settings/providers/ProvidersPage.tsx` — update import of `FIRST_FOUR_PROVIDERS`
- `apps/web/src/client/components/common/DaemonConnectionToast.tsx` — change `onOpenSettings` to `onNavigateToSettings`
- `apps/web/__tests__/integration/renderer/pages/Home.integration.test.tsx` — remove SettingsDialog mock

### Files to create:
- `apps/web/src/client/pages/settings/settings-tabs.ts` — moved from layouts/main/components/

### Files to delete:
- `apps/web/src/client/layouts/main/components/SettingsDialog.tsx`
- `apps/web/src/client/layouts/main/components/SettingsDialogContent.tsx`
- `apps/web/src/client/layouts/main/components/AuthSettingsDialog.tsx`
- `apps/web/src/client/layouts/main/hooks/useSettingsDialog.ts`
- `apps/web/src/client/layouts/main/hooks/useSettingsDialogEffects.ts`
- `apps/web/src/client/layouts/main/hooks/useSettingsDialog.types.ts`
- `apps/web/src/client/layouts/main/components/settings-tabs.ts` (moved, not deleted — original location)
- `apps/web/__tests__/integration/renderer/components/SettingsDialog.integration.test.tsx`

---

### Task 1: Add CloseConfirmDialog to SettingsLayout

**Files:**
- Modify: `apps/web/src/client/layouts/settings/SettingsLayout.tsx`

- [ ] **Step 1: Add CloseConfirmDialog import and render it**

In `SettingsLayout.tsx`, add the import and render `<CloseConfirmDialog />` inside the layout:

```tsx
import { ArrowLeft } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { CloseConfirmDialog } from '@/components/common/CloseConfirmDialog';
import { useSidebarStore } from '@/stores/sidebarStore';
import { cn } from '@/utils/utils';
import { SETTINGS_TABS } from '@/pages/settings/settings-tabs';
```

Add `<CloseConfirmDialog />` just before the closing `</div>` of the root element (after the `<Outlet />` wrapper div):

```tsx
      </div>
      <CloseConfirmDialog />
    </div>
```

- [ ] **Step 2: Run typecheck to verify**

Run: `pnpm typecheck`
Expected: No type errors related to SettingsLayout.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/client/layouts/settings/SettingsLayout.tsx
git commit -m "fix: add CloseConfirmDialog to SettingsLayout so macOS close works on settings page"
```

---

### Task 2: Move settings-tabs.ts to pages/settings/

**Files:**
- Create: `apps/web/src/client/pages/settings/settings-tabs.ts`
- Modify: `apps/web/src/client/layouts/settings/SettingsLayout.tsx` (update import, already done in Task 1)
- Modify: `apps/web/src/client/pages/settings/providers/ProvidersPage.tsx` (update import)
- Delete: `apps/web/src/client/layouts/main/components/settings-tabs.ts`

- [ ] **Step 1: Create settings-tabs.ts in new location**

Copy the file content verbatim from the original. Update the import path in `ProvidersPage.tsx`:

```ts
// apps/web/src/client/pages/settings/providers/ProvidersPage.tsx
// Change this import:
import { FIRST_FOUR_PROVIDERS } from '@/layouts/main/components/settings-tabs';
// To:
import { FIRST_FOUR_PROVIDERS } from '@/pages/settings/settings-tabs';
```

The `SettingsLayout.tsx` import was already updated in Task 1:
```ts
import { SETTINGS_TABS } from '@/pages/settings/settings-tabs';
```

- [ ] **Step 2: Delete old settings-tabs.ts**

Delete `apps/web/src/client/layouts/main/components/settings-tabs.ts`

- [ ] **Step 3: Run typecheck to verify**

Run: `pnpm typecheck`
Expected: No type errors about missing settings-tabs imports.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/client/pages/settings/settings-tabs.ts apps/web/src/client/pages/settings/providers/ProvidersPage.tsx apps/web/src/client/layouts/settings/SettingsLayout.tsx
git rm apps/web/src/client/layouts/main/components/settings-tabs.ts
git commit -m "refactor: move settings-tabs.ts to pages/settings/ for better colocation"
```

---

### Task 3: Remove AuthSettingsDialog and simplify AppOverlays

**Files:**
- Modify: `apps/web/src/client/layouts/main/components/AppOverlays.tsx`
- Modify: `apps/web/src/client/layouts/main/App.tsx`
- Modify: `apps/web/src/client/components/common/DaemonConnectionToast.tsx`
- Delete: `apps/web/src/client/layouts/main/components/AuthSettingsDialog.tsx`

- [ ] **Step 1: Update DaemonConnectionToast to accept onNavigateToSettings**

In `DaemonConnectionToast.tsx`, change the prop from `onOpenSettings` to `onNavigateToSettings`:

```tsx
interface DaemonConnectionToastProps {
  onNavigateToSettings?: () => void;
}

export function DaemonConnectionToast({ onNavigateToSettings }: DaemonConnectionToastProps) {
```

And update the handler:

```tsx
const handleOpenSettings = () => {
  onNavigateToSettings?.();
  dismissToast();
};
```

The button rendering stays the same — it calls `handleOpenSettings` when `isFailed && onNavigateToSettings`.

- [ ] **Step 2: Simplify AppOverlays — remove AuthSettingsDialog and auth settings props**

Replace `AppOverlays.tsx` with:

```tsx
import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { OAuthProviderId } from '@myboteam/agent-core/common';
import { CloseConfirmDialog } from '../../../components/common/CloseConfirmDialog';
import { DaemonConnectionToast } from '../../../components/common/DaemonConnectionToast';

const AuthErrorToast = lazy(() =>
  import('../../../components/common/AuthErrorToast').then((module) => ({
    default: module.AuthErrorToast,
  })),
);
const TaskLauncher = lazy(() =>
  import('../../../components/common/TaskLauncher').then((module) => ({
    default: module.TaskLauncher,
  })),
);

interface AppOverlaysProps {
  authError: { providerId: string; message: string } | null;
  clearAuthError: () => void;
  isLauncherOpen: boolean;
}

export function AppOverlays({
  authError,
  clearAuthError,
  isLauncherOpen,
}: AppOverlaysProps) {
  const navigate = useNavigate();

  const handleAuthReLogin = () => {
    if (authError) {
      if (authError.providerId === OAuthProviderId.Slack) {
        navigate('/settings/integrations');
      } else {
        navigate('/settings/providers');
      }
      clearAuthError();
    }
  };

  return (
    <>
      {isLauncherOpen && (
        <Suspense fallback={null}>
          <TaskLauncher />
        </Suspense>
      )}

      {authError && (
        <Suspense fallback={null}>
          <AuthErrorToast
            error={authError}
            onReLogin={handleAuthReLogin}
            onDismiss={clearAuthError}
          />
        </Suspense>
      )}

      <DaemonConnectionToast
        onNavigateToSettings={() => navigate('/settings/general')}
      />

      <CloseConfirmDialog />
    </>
  );
}
```

- [ ] **Step 3: Simplify App.tsx — remove auth settings state**

In `App.tsx`, remove:
- The `authSettingsOpen`, `authSettingsTab`, `authSettingsProvider` state declarations
- The `handleAuthReLogin` and `handleAuthSettingsClose` callbacks
- All `authSettings*` and `handleAuthSettings*` props from `<AppOverlays>`

The `AppOverlays` JSX becomes:

```tsx
<AppOverlays
  authError={authError}
  clearAuthError={clearAuthError}
  isLauncherOpen={isLauncherOpen}
/>
```

Also remove the `ProviderId` and `OAuthProviderId` imports if no longer used, and remove the `type SettingsTab` if it was only for `setAuthSettingsTab`.

The final `App.tsx` should no longer import `ProviderId`, `OAuthProviderId`, or reference any auth settings dialog state.

- [ ] **Step 4: Delete AuthSettingsDialog**

Delete `apps/web/src/client/layouts/main/components/AuthSettingsDialog.tsx`

- [ ] **Step 5: Run typecheck to verify**

Run: `pnpm typecheck`
Expected: No type errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/client/layouts/main/components/AppOverlays.tsx apps/web/src/client/layouts/main/App.tsx apps/web/src/client/components/common/DaemonConnectionToast.tsx
git rm apps/web/src/client/layouts/main/components/AuthSettingsDialog.tsx
git commit -m "refactor: remove AuthSettingsDialog, simplify AppOverlays to use navigation"
```

---

### Task 4: Remove dead SettingsDialog code

**Files to delete:**
- `apps/web/src/client/layouts/main/components/SettingsDialog.tsx`
- `apps/web/src/client/layouts/main/components/SettingsDialogContent.tsx`
- `apps/web/src/client/layouts/main/hooks/useSettingsDialog.ts`
- `apps/web/src/client/layouts/main/hooks/useSettingsDialogEffects.ts`
- `apps/web/src/client/layouts/main/hooks/useSettingsDialog.types.ts`
- `apps/web/__tests__/integration/renderer/components/SettingsDialog.integration.test.tsx`

- [ ] **Step 1: Delete all dead files**

```bash
git rm apps/web/src/client/layouts/main/components/SettingsDialog.tsx
git rm apps/web/src/client/layouts/main/components/SettingsDialogContent.tsx
git rm apps/web/src/client/layouts/main/hooks/useSettingsDialog.ts
git rm apps/web/src/client/layouts/main/hooks/useSettingsDialogEffects.ts
git rm apps/web/src/client/layouts/main/hooks/useSettingsDialog.types.ts
git rm apps/web/__tests__/integration/renderer/components/SettingsDialog.integration.test.tsx
```

- [ ] **Step 2: Run typecheck to verify no remaining references**

Run: `pnpm typecheck`
Expected: No type errors (all references were dead code or will be cleaned in Task 5).

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor: remove dead SettingsDialog, SettingsDialogContent, and useSettingsDialog code"
```

---

### Task 5: Replace showSettingsDialog state with navigation

**Files:**
- Modify: `apps/web/src/client/pages/conversation/hooks/useExecutionCore.ts`
- Modify: `apps/web/src/client/pages/conversation/hooks/useExecutionActions.ts`
- Modify: `apps/web/src/client/pages/conversation/hooks/useExecutionPauseActions.ts`
- Modify: `apps/web/src/client/pages/conversation/hooks/useExecutionEffects.ts`
- Modify: `apps/web/src/client/pages/conversation/ExecutionPage.tsx`

- [ ] **Step 1: Clean up useExecutionCore.ts — remove showSettingsDialog and settingsInitialTab state**

Remove these two state declarations from `useExecutionCore`:
```ts
const [showSettingsDialog, setShowSettingsDialog] = useState(false);
const [settingsInitialTab, setSettingsInitialTab] = useState<
  'providers' | 'voice' | 'skills' | 'integrations'
>('providers');
```

And remove them from the return object:
```ts
showSettingsDialog,
setShowSettingsDialog,
settingsInitialTab,
setSettingsInitialTab,
```

- [ ] **Step 2: Update useExecutionActions.ts — replace setShowSettingsDialog with navigate**

Replace `handleOpenSpeechSettings`:
```ts
const handleOpenSpeechSettings = useCallback(() => {
  navigate('/settings/voice');
}, [navigate]);
```

Replace `handleOpenModelSettings`:
```ts
const handleOpenModelSettings = useCallback(() => {
  navigate('/settings/providers');
}, [navigate]);
```

In `handleFollowUp`, replace the provider check block:
```ts
if (!isE2EMode) {
  const settings = await myboteam.getProviderSettings();
  if (!hasAnyReadyProvider(settings)) {
    s.setPendingFollowUp(s.followUp);
    navigate('/settings/providers');
    return;
  }
}
```

Remove `handleSettingsDialogClose` and `handleApiKeySaved` functions entirely. Remove `handleSettingsDialogClose` from the return object.

Remove `handleApiKeySaved` from the return object.

- [ ] **Step 3: Update useExecutionPauseActions.ts — replace setShowSettingsDialog with navigate**

In `resumePausedTask`, replace:
```ts
s.setSettingsInitialTab('providers');
s.setShowSettingsDialog(true);
```
with:
```ts
navigate('/settings/providers');
```

Add `navigate` to the destructured state from `s`:
```ts
const { myboteam, navigate, t } = s;
```

Remove `s.setSettingsInitialTab` and `s.setShowSettingsDialog` from the dependency array, add `navigate`.

Update deps:
```ts
[
  myboteam,
  navigate,
  s.setPendingFollowUp,
  s.sendFollowUp,
  t,
],
```

- [ ] **Step 4: Update useExecutionEffects.ts — remove showSettingsDialog from deps**

In the `handleKeyDown` effect, remove `s.showSettingsDialog` from the condition and the dependency array:

Change the condition from:
```ts
!s.showSettingsDialog
```
to just remove the `!s.showSettingsDialog &&` check entirely, OR keep a different guard. Looking at the logic: when Escape is pressed during a running task, if settings is open, we don't interrupt. Since settings is now a page route (not a dialog), pressing Escape on the execution page while running should still interrupt. So we just remove the `!s.showSettingsDialog` condition:

```ts
if (
  e.key === 'Escape' &&
  s.currentTask?.status === 'running' &&
  !s.isComplete &&
  !s.permissionRequest
) {
```

And update the dependency array to remove `s.showSettingsDialog`.

- [ ] **Step 5: Update ExecutionPage.tsx — replace onOpenSettings callback**

In `ExecutionPage.tsx`, the `FollowUpInput` `onOpenSettings` prop currently calls:
```ts
onOpenSettings={(tab) => {
  s.setSettingsInitialTab(tab);
  s.setShowSettingsDialog(true);
}}
```

Replace with:
```ts
onOpenSettings={() => {
  s.navigate('/settings/providers');
}}
```

**Note:** Check `FollowUpInput`'s prop type. If `onOpenSettings` expects a `(tab: string) => void`, we can either keep the signature and ignore the tab, or update the prop type. Since `FollowUpInput` likely just passes a tab name, update to just navigate. The `ModelIndicator` `onOpenModelSettings` prop on line 109 already needs no change since `handleOpenModelSettings` was updated in Step 2.

- [ ] **Step 6: Run typecheck to verify**

Run: `pnpm typecheck`
Expected: No type errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/client/pages/conversation/hooks/useExecutionCore.ts apps/web/src/client/pages/conversation/hooks/useExecutionActions.ts apps/web/src/client/pages/conversation/hooks/useExecutionPauseActions.ts apps/web/src/client/pages/conversation/hooks/useExecutionEffects.ts apps/web/src/client/pages/conversation/ExecutionPage.tsx
git commit -m "refactor: replace showSettingsDialog state with direct navigation to /settings routes"
```

---

### Task 6: Update Home integration test mock

**Files:**
- Modify: `apps/web/__tests__/integration/renderer/pages/Home.integration.test.tsx`

- [ ] **Step 1: Remove SettingsDialog mock**

The test file mocks `SettingsDialog` at lines 118-150. Remove the entire `vi.mock('@/layouts/main/components/SettingsDialog', ...)` block since the component no longer exists.

- [ ] **Step 2: Run typecheck and tests to verify**

Run: `pnpm typecheck && pnpm -F @myboteam/web test`
Expected: No type errors, tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/web/__tests__/integration/renderer/pages/Home.integration.test.tsx
git commit -m "test: remove SettingsDialog mock from Home integration test"
```

---

### Task 7: Final verification

- [ ] **Step 1: Run full check**

Run: `pnpm check`
Expected: Biome check + typecheck pass.

- [ ] **Step 2: Run web tests**

Run: `pnpm -F @myboteam/web test`
Expected: All tests pass.

- [ ] **Step 3: Run desktop tests**

Run: `pnpm -F @myboteam/desktop test`
Expected: All tests pass.

- [ ] **Step 4: Final commit if any remaining fixes needed**

```bash
git add -A
git commit -m "fix: address any leftover issues from settings cleanup"
```