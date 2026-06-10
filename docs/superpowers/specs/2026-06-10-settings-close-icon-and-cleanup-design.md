# Fix Close Icon on Settings Layout & Clean Up Settings Components

**Linear:** MAO-126
**Date:** 2026-06-10

## Problem

### 1. macOS close button doesn't work on settings page (MAO-126)

`CloseConfirmDialog` is only rendered inside `AppOverlays`, which is mounted within the `App` layout. The `/settings/*` routes use `SettingsLayout` — a sibling route branch that doesn't include `AppOverlays`. When the user clicks the macOS red close button on the settings page, the main process sends `app:close-requested`, but no listener is mounted, so nothing happens.

### 2. Dead code & misplaced files

- `SettingsDialog.tsx`, `SettingsDialogContent.tsx`, `useSettingsDialog.ts`, `useSettingsDialogEffects.ts`, `useSettingsDialog.types.ts` — never imported by any UI component (only by tests). The dialog-based settings approach has been replaced by the `/settings/*` page routes.
- `AuthSettingsDialog.tsx` — wraps `ProvidersPage` in a `MemoryRouter` inside a `Dialog`. The same UX can be achieved by navigating to `/settings/providers` (or `/settings/integrations` for Slack).
- `settings-tabs.ts` — shared between `SettingsLayout` and dead `SettingsDialogContent`. Should live closer to the settings pages.

## Design

### 1. Fix close icon — add `CloseConfirmDialog` to `SettingsLayout`

**File:** `apps/web/src/client/layouts/settings/SettingsLayout.tsx`

Add `<CloseConfirmDialog />` inside `SettingsLayout`. It self-subscribes to `myboteam.onCloseRequested` and handles the close confirmation flow independently, just like it does in `AppOverlays`.

### 2. Remove `AuthSettingsDialog`

**File removed:** `apps/web/src/client/layouts/main/components/AuthSettingsDialog.tsx`

Replace two callers:

- **AuthErrorToast re-login** (`AppOverlays` → `handleAuthReLogin`) — instead of opening `AuthSettingsDialog`, navigate to `/settings/providers?select={providerId}` (or `/settings/integrations` for Slack).
- **DaemonConnectionToast "Open Settings"** — instead of opening `AuthSettingsDialog`, navigate to `/settings/general`.

Both callers will use `useNavigate()` from react-router to go to the settings page directly.

### 3. Simplify `AppOverlays`

**File:** `apps/web/src/client/layouts/main/components/AppOverlays.tsx`

Remove all `AuthSettingsDialog`-related props and rendering:
- Remove `authSettingsOpen`, `authSettingsProvider`, `setAuthSettingsOpen`, `setAuthSettingsTab`, `handleAuthSettingsClose`
- Remove `AuthSettingsDialog` lazy import and rendering
- Simplify `DaemonConnectionToast` `onOpenSettings` to navigate instead

Add `useNavigate()` to `AppOverlays` and wire up:
- `DaemonConnectionToast onOpenSettings` → `navigate('/settings/general')`
- `AuthErrorToast onReLogin` → determine tab from error type, then `navigate('/settings/providers')` or `navigate('/settings/integrations')`, and `clearAuthError()`

`AppOverlays` props will shrink to just:
- `isLauncherOpen`
- `authError`, `clearAuthError`

### 4. Simplify `App`

**File:** `apps/web/src/client/layouts/main/App.tsx`

Remove state and handlers:
- `authSettingsOpen` / `setAuthSettingsOpen`
- `authSettingsTab` / `setAuthSettingsTab`
- `authSettingsProvider` / `setAuthSettingsProvider`
- `handleAuthReLogin` / `handleAuthSettingsClose`

The `AppOverlays` component no longer needs these props.

### 5. Remove dead SettingsDialog code

**Files removed:**
- `apps/web/src/client/layouts/main/components/SettingsDialog.tsx`
- `apps/web/src/client/layouts/main/components/SettingsDialogContent.tsx`
- `apps/web/src/client/layouts/main/hooks/useSettingsDialog.ts`
- `apps/web/src/client/layouts/main/hooks/useSettingsDialogEffects.ts`
- `apps/web/src/client/layouts/main/hooks/useSettingsDialog.types.ts`

### 6. Move `settings-tabs.ts`

**Move:** `apps/web/src/client/layouts/main/components/settings-tabs.ts` → `apps/web/src/client/pages/settings/settings-tabs.ts`

Update all imports (in `SettingsLayout` and any settings page components).

### 7. Clean up `showSettingsDialog` state in conversation hooks

**Files:**
- `apps/web/src/client/pages/conversation/hooks/useExecutionCore.ts` — remove `showSettingsDialog` / `setShowSettingsDialog` / `settingsInitialTab` / `setSettingsInitialTab` state
- `apps/web/src/client/pages/conversation/hooks/useExecutionActions.ts` — replace `setShowSettingsDialog(true)` / `handleSettingsDialogClose` with `navigate('/settings/providers')` / `navigate('/settings/voice')` / `navigate(-1)` as appropriate
- `apps/web/src/client/pages/conversation/hooks/useExecutionPauseActions.ts` — replace `setShowSettingsDialog` with `navigate('/settings/providers')`
- `apps/web/src/client/pages/conversation/hooks/useExecutionEffects.ts` — remove `showSettingsDialog` from dependency arrays

**Important:** `useExecutionActions` and `useExecutionPauseActions` already have access to `navigate` through the core state (or can add it). Check that the execution page's `FollowUpInput` `onOpenSettings` callback uses `navigate` instead of `setShowSettingsDialog`.

### 8. Update tests

- `apps/web/__tests__/integration/renderer/components/SettingsDialog.integration.test.tsx` — delete or rewrite to test settings page routes instead
- `apps/web/__tests__/integration/renderer/pages/Home.integration.test.tsx` — update mock from `SettingsDialog` to navigation-based approach

## Success Criteria

1. macOS close button works on `/settings/*` pages — `CloseConfirmDialog` appears and the app can be closed
2. AuthErrorToast "Re-login" button navigates to `/settings/providers` (or `/settings/integrations` for Slack)
3. DaemonConnectionToast "Open Settings" navigates to `/settings/general`
4. All SettingsDialog / AuthSettingsDialog dead code is removed
5. No references to removed files remain (imports, tests, etc.)
6. `pnpm check` passes
7. `pnpm -F @myboteam/web test` passes