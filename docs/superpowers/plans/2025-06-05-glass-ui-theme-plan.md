# Glass UI Theme & Color Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all shadcn UI components with glass-ui equivalents, add glass surfaces throughout the app, and implement a 6-option color theme selector in the sidebar.

**Architecture:** CSS class-based theming with `theme-mint`/`theme-blue`/etc. classes on `<html>`, coexisting with the existing `dark` class. Each color theme overrides `--primary`, `--accent`, `--ring`, and `--theme-bg-gradient`. Color theme persists through the same IPC pattern as light/dark mode (localStorage + Electron backend DB).

**Tech Stack:** React, TypeScript, Tailwind CSS v4, CSS custom properties, Glass UI (shadcn registry), Electron IPC

---

## File Structure

### New files to create

| File | Purpose |
|------|---------|
| `packages/agent-core/src/storage/migrations/v002-theme-color.ts` | DB migration adding `theme_color` column |
| `apps/web/src/client/components/settings/ThemeColorSelector.tsx` | 6-circle color theme picker component |
| `apps/web/src/client/lib/theme-color.ts` | Color theme constants and application logic (mirrors theme.ts pattern) |

### Existing files to modify

| File | What changes |
|------|-------------|
| `packages/agent-core/src/types/storage.ts` | Add `ThemeColorPreference` type, `themeColor` to `AppSettings` |
| `packages/agent-core/src/common/types/daemon.ts` | Add `settings.setThemeColor` to method map, `themeColor` to `SettingsChangePayload` |
| `packages/agent-core/src/storage/migrations/index.ts` | Import v002, bump `CURRENT_VERSION` to 2 |
| `packages/agent-core/src/storage/repositories/ui-settings.ts` | Add `VALID_THEME_COLORS`, `getThemeColor()`, `setThemeColor()`, update SELECT |
| `packages/agent-core/src/storage/repositories/appSettings.ts` | Re-export new methods, add `themeColor` to row/settings |
| `apps/daemon/src/daemon-routes.ts` | Register `settings.setThemeColor` RPC handler |
| `apps/daemon/src/settings-service.ts` | Add `setThemeColor()` method |
| `apps/desktop/src/main/ipc/handlers/settings-handlers.ts` | Add `settings:theme-color` + `settings:set-theme-color` handlers |
| `apps/desktop/src/preload/index.ts` | Add `getThemeColor`, `setThemeColor`, `onThemeColorChange` to contextBridge |
| `apps/web/src/client/lib/myboteam.ts` | Add typed wrappers for the 3 new IPC methods |
| `apps/web/src/client/lib/theme-core.ts` | Add `COLOR_THEME_KEY`, `COLOR_CLASSES`, `VALID_COLORS`, `applyColorTheme()` |
| `apps/web/src/client/lib/theme.ts` | Add `applyColorTheme` export, call in `applyTheme()` |
| `apps/web/src/client/hooks/useTheme.ts` | Add `themeColor` state + `changeThemeColor()` |
| `apps/web/src/client/styles/globals.css` | Add 12 color theme variable sets (6 themes × 2 modes), body bg rule |
| `apps/web/src/client/components/layout/Sidebar.tsx` | Add `ThemeColorSelector` above bottom row |
| Various `ui/` component files | Replace with glass-ui equivalents (batch) |

---

## Task 1: Add `ThemeColorPreference` type and DB migration

**Files:**
- Modify: `packages/agent-core/src/types/storage.ts`
- Create: `packages/agent-core/src/storage/migrations/v002-theme-color.ts`
- Modify: `packages/agent-core/src/storage/migrations/index.ts`

- [ ] **Step 1: Add `ThemeColorPreference` type and update `AppSettings` in storage.ts**

In `packages/agent-core/src/types/storage.ts`, after the `ThemePreference` type (line 65), add:

```ts
export type ThemeColorPreference = 'mint' | 'blue' | 'lemon' | 'peach' | 'lavender' | 'neutral';
```

In the `AppSettings` interface (line 69–81), add after `theme`:

```ts
  themeColor: ThemeColorPreference;
```

In the `AppSettingsAPI` interface (around line 165–168), add after `setTheme`:

```ts
  /** Get the current theme color preference */
  getThemeColor(): ThemeColorPreference;
  /** Set the theme color preference */
  setThemeColor(themeColor: ThemeColorPreference): void;
```

- [ ] **Step 2: Create migration v002-theme-color.ts**

Create `packages/agent-core/src/storage/migrations/v002-theme-color.ts`:

```ts
import type { Database } from 'better-sqlite3';

export function up(db: Database): void {
  db.exec(`
    ALTER TABLE app_settings ADD COLUMN theme_color TEXT NOT NULL DEFAULT 'neutral';
  `);
}

export function down(db: Database): void {
  db.exec(`
    ALTER TABLE app_settings DROP COLUMN theme_color;
  `);
}
```

- [ ] **Step 3: Register migration in index.ts**

In `packages/agent-core/src/storage/migrations/index.ts`, import the new migration and bump `CURRENT_VERSION` from 1 to 2. Add `v002` to the migrations array following the existing pattern.

- [ ] **Step 4: Run agent-core tests**

Run: `pnpm -F @myboteam/agent-core test`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add packages/agent-core/src/types/storage.ts packages/agent-core/src/storage/migrations/
git commit -m "feat(agent-core): add ThemeColorPreference type and DB migration"
```

---

## Task 2: Add color theme to storage repository layer

**Files:**
- Modify: `packages/agent-core/src/storage/repositories/ui-settings.ts`
- Modify: `packages/agent-core/src/storage/repositories/appSettings.ts`

- [ ] **Step 1: Update ui-settings.ts**

Add `VALID_THEME_COLORS` constant after `VALID_THEMES`:

```ts
const VALID_THEME_COLORS = ['mint', 'blue', 'lemon', 'peach', 'lavender', 'neutral'] as const;
```

Add `theme_color` to the `AppSettingsUiRow` interface.

Update `getUiRow()` SELECT to include `theme_color`.

Add `getThemeColor()` method following `getTheme()` pattern — read from DB row, validate against `VALID_THEME_COLORS`, fall back to `'neutral'`.

Add `setThemeColor(themeColor: ThemeColorPreference)` method following `setTheme()` pattern — validate, then UPDATE the row.

- [ ] **Step 2: Update appSettings.ts barrel**

Add `getThemeColor` and `setThemeColor` re-exports from `./ui-settings.js`.

Add `theme_color` to `AppSettingsRow` interface.

In `getAppSettings()`, add `themeColor` mapping (same validation pattern as `theme`).

In `clearAppSettings()`, add `theme_color = 'neutral'` to defaults.

- [ ] **Step 3: Run agent-core tests**

Run: `pnpm -F @myboteam/agent-core test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add packages/agent-core/src/storage/repositories/
git commit -m "feat(agent-core): add themeColor get/set to storage repositories"
```

---

## Task 3: Add themeColor to daemon types and RPC

**Files:**
- Modify: `packages/agent-core/src/common/types/daemon.ts`
- Modify: `apps/daemon/src/daemon-routes.ts`
- Modify: `apps/daemon/src/settings-service.ts`

- [ ] **Step 1: Update daemon.ts types**

Import `ThemeColorPreference` from `../types/storage.js`.

In `SettingsChangePayload` union type, add:
```ts
| { key: 'themeColor'; value: ThemeColorPreference }
```

In the method map, add:
```ts
'settings.setThemeColor': { params: { themeColor: ThemeColorPreference }; result: undefined };
```

- [ ] **Step 2: Add setThemeColor to settings-service.ts**

In `apps/daemon/src/settings-service.ts`, add method following `setTheme()` pattern:

```ts
setThemeColor(themeColor: ThemeColorPreference): void {
  this.storage.setThemeColor(themeColor);
  this.emit('settings.changed', { key: 'themeColor', value: themeColor });
}
```

- [ ] **Step 3: Register RPC handler in daemon-routes.ts**

Add after the `settings.setTheme` handler:

```ts
rpc.registerMethod(
  'settings.setThemeColor',
  safeHandler((params) => {
    const v = validate(z.object({ themeColor: z.enum(['mint', 'blue', 'lemon', 'peach', 'lavender', 'neutral']) }), params);
    settingsService.setThemeColor(v.themeColor);
    return Promise.resolve();
  }),
);
```

- [ ] **Step 4: Run daemon tests (if available)**

Run: `pnpm check`
Expected: TypeScript compiles, no errors

- [ ] **Step 5: Commit**

```bash
git add packages/agent-core/src/common/types/daemon.ts apps/daemon/src/
git commit -m "feat(daemon): add setThemeColor RPC handler"
```

---

## Task 4: Add themeColor IPC bridge (desktop + web)

**Files:**
- Modify: `apps/desktop/src/main/ipc/handlers/settings-handlers.ts`
- Modify: `apps/desktop/src/preload/index.ts`
- Modify: `apps/web/src/client/lib/myboteam.ts`

- [ ] **Step 1: Add IPC handlers in settings-handlers.ts**

Add after the `settings:set-theme` handler:

```ts
handle('settings:theme-color', async () => {
  const snap = await getDaemonClient().call('settings.getAll');
  return snap.app.themeColor || 'neutral';
});

handle('settings:set-theme-color', async (_event: IpcMainInvokeEvent, color: string) => {
  const validColors = ['mint', 'blue', 'lemon', 'peach', 'lavender', 'neutral'];
  if (!validColors.includes(color)) {
    throw new Error('Invalid theme color value');
  }
  await getDaemonClient().call('settings.setThemeColor', {
    themeColor: color as ThemeColorPreference,
  });
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('settings:theme-color-changed', { themeColor: color });
  }
});
```

Import `ThemeColorPreference` from `@myboteam/agent-core`.

- [ ] **Step 2: Add methods to preload/index.ts**

In the `myboteamAPI` object, add after `onThemeChange`:

```ts
getThemeColor: (): Promise<string> => ipcRenderer.invoke('settings:theme-color'),
setThemeColor: (color: string): Promise<void> => ipcRenderer.invoke('settings:set-theme-color', color),
onThemeColorChange: (callback: (data: { themeColor: string }) => void) => {
  const listener = (_: unknown, data: { themeColor: string }) => callback(data);
  ipcRenderer.on('settings:theme-color-changed', listener);
  return () => ipcRenderer.removeListener('settings:theme-color-changed', listener);
},
```

- [ ] **Step 3: Add typed wrappers in myboteam.ts**

Add to the `MyBoTeamAPI` interface:

```ts
getThemeColor(): Promise<string>;
setThemeColor(color: string): Promise<void>;
onThemeColorChange?(callback: (data: { themeColor: string }) => void): () => void;
```

Add implementation methods in the `MyBoTeam` class following the exact same pattern as `getTheme`/`setTheme`/`onThemeChange`.

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/ apps/web/src/client/lib/myboteam.ts
git commit -m "feat: add themeColor IPC bridge across desktop + web"
```

---

## Task 5: Add color theme CSS variables and body background rule

**Files:**
- Modify: `apps/web/src/client/styles/globals.css`

- [ ] **Step 1: Add `--theme-bg-gradient` to the `@theme` block**

In the existing `@theme` block (after the existing `--shadow-glass` line), add:

```css
--theme-bg-gradient: ;
```

This registers it as a Tailwind theme variable so it can be referenced.

- [ ] **Step 2: Add 6 light-mode color theme blocks after the existing `:root` block**

Place these after the `:root` block (after line 188) and before `.dark`:

```css
.theme-mint {
  --primary: 163 54% 42%;
  --primary-foreground: 0 0% 100%;
  --accent: 163 40% 90%;
  --accent-foreground: 163 54% 20%;
  --ring: 163 54% 42%;
  --theme-bg-gradient: linear-gradient(135deg, #A3E7D3 0%, #53D3B1 100%);
}

.theme-blue {
  --primary: 221 56% 55%;
  --primary-foreground: 0 0% 100%;
  --accent: 221 56% 92%;
  --accent-foreground: 221 56% 20%;
  --ring: 221 56% 55%;
  --theme-bg-gradient: linear-gradient(135deg, #B9DAFF 0%, #7FB9FF 100%);
}

.theme-lemon {
  --primary: 66 72% 40%;
  --primary-foreground: 0 0% 100%;
  --accent: 66 72% 90%;
  --accent-foreground: 66 72% 20%;
  --ring: 66 72% 40%;
  --theme-bg-gradient: linear-gradient(135deg, #FFFFB3 0%, #E6FF66 100%);
}

.theme-peach {
  --primary: 0 56% 58%;
  --primary-foreground: 0 0% 100%;
  --accent: 0 56% 92%;
  --accent-foreground: 0 56% 20%;
  --ring: 0 56% 58%;
  --theme-bg-gradient: linear-gradient(135deg, #FFD0B3 0%, #FFA07A 100%);
}

.theme-lavender {
  --primary: 248 74% 63%;
  --primary-foreground: 0 0% 100%;
  --accent: 248 74% 92%;
  --accent-foreground: 248 74% 20%;
  --ring: 248 74% 63%;
  --theme-bg-gradient: linear-gradient(135deg, #DCD3FF 0%, #B3A3FF 100%);
}

.theme-neutral {
  --primary: 220 9% 46%;
  --primary-foreground: 0 0% 100%;
  --accent: 220 9% 93%;
  --accent-foreground: 220 9% 30%;
  --ring: 220 9% 46%;
  --theme-bg-gradient: ;
}
```

- [ ] **Step 3: Add 6 dark-mode color theme blocks after the `.dark` block**

Place these after the `.dark` block (after line 223):

```css
.dark.theme-mint {
  --primary: 163 54% 55%;
  --primary-foreground: 0 0% 8%;
  --accent: 163 30% 18%;
  --accent-foreground: 163 40% 80%;
  --ring: 163 54% 55%;
  --theme-bg-gradient: linear-gradient(135deg, #A3E7D3 0%, #53D3B1 100%);
}

.dark.theme-blue {
  --primary: 221 56% 65%;
  --primary-foreground: 0 0% 8%;
  --accent: 221 30% 18%;
  --accent-foreground: 221 40% 80%;
  --ring: 221 56% 65%;
  --theme-bg-gradient: linear-gradient(135deg, #B9DAFF 0%, #7FB9FF 100%);
}

.dark.theme-lemon {
  --primary: 66 72% 55%;
  --primary-foreground: 0 0% 8%;
  --accent: 66 40% 18%;
  --accent-foreground: 66 50% 80%;
  --ring: 66 72% 55%;
  --theme-bg-gradient: linear-gradient(135deg, #FFFFB3 0%, #E6FF66 100%);
}

.dark.theme-peach {
  --primary: 0 56% 68%;
  --primary-foreground: 0 0% 8%;
  --accent: 0 30% 18%;
  --accent-foreground: 0 40% 80%;
  --ring: 0 56% 68%;
  --theme-bg-gradient: linear-gradient(135deg, #FFD0B3 0%, #FFA07A 100%);
}

.dark.theme-lavender {
  --primary: 248 74% 73%;
  --primary-foreground: 0 0% 8%;
  --accent: 248 30% 18%;
  --accent-foreground: 248 50% 80%;
  --ring: 248 74% 73%;
  --theme-bg-gradient: linear-gradient(135deg, #DCD3FF 0%, #B3A3FF 100%);
}

.dark.theme-neutral {
  --primary: 220 9% 56%;
  --primary-foreground: 0 0% 100%;
  --accent: 220 9% 18%;
  --accent-foreground: 220 9% 80%;
  --ring: 220 9% 56%;
  --theme-bg-gradient: ;
}
```

- [ ] **Step 4: Update the `body` rule in `@layer base`**

Change the existing `body { @apply bg-background text-foreground; }` to:

```css
body {
  @apply text-foreground;
  background: var(--theme-bg-gradient, hsl(var(--background)));
}
```

This makes the body use the theme gradient when set, falling back to the existing solid background.

- [ ] **Step 5: Run check**

Run: `pnpm check`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/client/styles/globals.css
git commit -m "feat(web): add color theme CSS variables and body background rule"
```

---

## Task 6: Add color theme logic to theme-core.ts and theme.ts

**Files:**
- Modify: `apps/web/src/client/lib/theme-core.ts`
- Modify: `apps/web/src/client/lib/theme.ts`
- Create: `apps/web/src/client/lib/theme-color.ts`

- [ ] **Step 1: Create theme-color.ts**

Create `apps/web/src/client/lib/theme-color.ts` with early-boot-safe logic (no React/Electron imports):

```ts
export const COLOR_THEME_KEY = 'theme-color';

export const VALID_COLORS = ['mint', 'blue', 'lemon', 'peach', 'lavender', 'neutral'] as const;

export type ThemeColor = (typeof VALID_COLORS)[number];

export const COLOR_CLASSES = ['theme-mint', 'theme-blue', 'theme-lemon', 'theme-peach', 'theme-lavender', 'theme-neutral'] as const;

export function isValidColor(value: string): value is ThemeColor {
  return (VALID_COLORS as readonly string[]).includes(value);
}

export function applyColorTheme(color: ThemeColor): void {
  const html = document.documentElement;
  html.classList.remove(...COLOR_CLASSES);
  html.classList.add(`theme-${color}`);
}
```

- [ ] **Step 2: Add color theme init to theme-core.ts**

In `apps/web/src/client/lib/theme-core.ts`, import from `theme-color.ts` and add init logic to `initEarlyTheme()`:

After the existing `applyClass(resolveTheme(preference))` call, add:

```ts
import { COLOR_THEME_KEY, isValidColor, applyColorTheme } from './theme-color.js';

// ... in initEarlyTheme(), after applyClass():
let colorValue = 'neutral';
try {
  const stored = localStorage.getItem(COLOR_THEME_KEY);
  if (stored && isValidColor(stored)) colorValue = stored;
} catch {}
applyColorTheme(colorValue);
```

- [ ] **Step 3: Add color theme application to theme.ts**

In `apps/web/src/client/lib/theme.ts`, add `applyColorTheme` and `COLOR_THEME_KEY` exports:

```ts
export { applyColorTheme } from './theme-color.js';
export { COLOR_THEME_KEY } from './theme-color.js';
export type { ThemeColor } from './theme-color.js';
```

- [ ] **Step 4: Run check**

Run: `pnpm -F @myboteam/web check`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/client/lib/theme-color.ts apps/web/src/client/lib/theme-core.ts apps/web/src/client/lib/theme.ts
git commit -m "feat(web): add early-boot color theme init and application logic"
```

---

## Task 7: Add `themeColor` to useTheme hook

**Files:**
- Modify: `apps/web/src/client/hooks/useTheme.ts`

- [ ] **Step 1: Add color theme state and methods to useTheme**

Add imports:

```ts
import { COLOR_THEME_KEY, isValidColor, type ThemeColor } from '@/lib/theme-color';
import { applyColorTheme } from '@/lib/theme-color';
```

Add state and effects inside `useTheme()` hook, following the same pattern as `theme`/`isDark`:

```ts
const [themeColor, setThemeColorState] = useState<ThemeColor>('neutral');

// Sync from backend on mount
useEffect(() => {
  const myboteam = getMyBoTeam();
  myboteam
    .getThemeColor()
    .then((color) => {
      if (hasLocalOverrideRef.current) return;
      if (color && isValidColor(color)) {
        setThemeColorState(color);
      }
    })
    .catch(() => {});

  if (myboteam.onThemeColorChange) {
    const cleanup = myboteam.onThemeColorChange(({ themeColor }) => {
      if (isValidColor(themeColor)) {
        setThemeColorState(themeColor);
        applyColorTheme(themeColor);
      }
    });
    return cleanup;
  }
  return undefined;
}, []);
```

Add `changeThemeColor` callback (follows `setTheme` pattern):

```ts
const changeThemeColor = useCallback((color: ThemeColor) => {
  hasLocalOverrideRef.current = true;
  setThemeColorState(color);
  applyColorTheme(color);
  localStorage.setItem(COLOR_THEME_KEY, color);
  getMyBoTeam().setThemeColor(color).catch(() => {});
}, []);
```

Update the return object to include `themeColor` and `changeThemeColor`.

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/client/hooks/useTheme.ts
git commit -m "feat(web): add themeColor state and changeThemeColor to useTheme hook"
```

---

## Task 8: Create ThemeColorSelector component and integrate into Sidebar

**Files:**
- Create: `apps/web/src/client/components/settings/ThemeColorSelector.tsx`
- Modify: `apps/web/src/client/components/layout/Sidebar.tsx`

- [ ] **Step 1: Create ThemeColorSelector.tsx**

Create `apps/web/src/client/components/settings/ThemeColorSelector.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/useTheme';
import type { ThemeColor } from '@/lib/theme-color';

const THEME_COLORS: { color: ThemeColor; label: string; gradient: string; border: string }[] = [
  {
    color: 'mint',
    label: 'Mint',
    gradient: 'linear-gradient(135deg, #A3E7D3, #53D3B1)',
    border: '#2E8B75',
  },
  {
    color: 'blue',
    label: 'Blue',
    gradient: 'linear-gradient(135deg, #B9DAFF, #7FB9FF)',
    border: '#4A72CD',
  },
  {
    color: 'lemon',
    label: 'Lemon',
    gradient: 'linear-gradient(135deg, #FFFFB3, #E6FF66)',
    border: '#A6B319',
  },
  {
    color: 'peach',
    label: 'Peach',
    gradient: 'linear-gradient(135deg, #FFD0B3, #FFA07A)',
    border: '#CD5C5C',
  },
  {
    color: 'lavender',
    label: 'Lavender',
    gradient: 'linear-gradient(135deg, #DCD3FF, #B3A3FF)',
    border: '#6C5CE7',
  },
  {
    color: 'neutral',
    label: 'Neutral',
    gradient: '#9CA3AF',
    border: '#6B7280',
  },
];

export function ThemeColorSelector() {
  const { t } = useTranslation();
  const { themeColor, changeThemeColor } = useTheme();

  return (
    <div className="flex items-center justify-center gap-2 px-3 py-2">
      {THEME_COLORS.map(({ color, label, gradient, border }) => (
        <Tooltip key={color}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => changeThemeColor(color)}
              className="size-6 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                background: gradient,
                boxShadow: themeColor === color ? `0 0 0 2px var(--background), 0 0 0 4px ${border}` : undefined,
              }}
              aria-label={t(label)}
            />
          </TooltipTrigger>
          <TooltipContent>{t(label)}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Integrate ThemeColorSelector into Sidebar**

In `apps/web/src/client/components/layout/Sidebar.tsx`:

Add import:
```tsx
import { ThemeColorSelector } from '@/components/settings/ThemeColorSelector';
```

In the bottom section, add `<ThemeColorSelector />` between the conversation list's ScrollArea and the existing bottom row. The structure becomes:

```tsx
{/* Theme Color Selector */}
<ThemeColorSelector />

{/* Bottom Section - Logo and Settings */}
<div className="px-3 py-4 border-t border-border flex items-center justify-between">
  {/* ... existing content ... */}
</div>
```

- [ ] **Step 3: Run check**

Run: `pnpm check`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/client/components/settings/ThemeColorSelector.tsx apps/web/src/client/components/layout/Sidebar.tsx
git commit -m "feat(web): add ThemeColorSelector component and integrate into sidebar"
```

---

## Task 9: Install glass-ui components (batch 1: alert, avatar, badge, card, input, label)

**Files:**
- Various UI component files in `apps/web/src/client/components/ui/`

This task follows the same pattern for each component. The shadcn CLI creates files in `/src/lib/` and `/src/components/` instead of `/src/client/lib/` and `/src/client/components/` due to alias resolution. We must manually relocate them.

For each component in this batch:

1. Run `pnpm dlx shadcn@latest add @glass-ui/<name>` from `apps/web`
2. Move generated files from mislocated paths to `src/client/`
3. Fix imports to use `@/` aliases
4. Verify `pnpm check` passes

**Batch 1 components:**
- `@glass-ui/alert`
- `@glass-ui/avatar`
- `@glass-ui/badge`
- `@glass-ui/card`
- `@glass-ui/input`
- `@glass-ui/label`

- [ ] **Step 1: Install alert**
Run: `pnpm dlx shadcn@latest add @glass-ui/alert`
Move any generated `src/lib/` files to `src/client/lib/`, `src/components/` files to `src/client/components/ui/`. Fix `@/` imports.
Delete the `@/` directory and `src/lib/`/`src/components/`/`src/app/` if created.

- [ ] **Step 2: Install avatar**
Same process as step 1.

- [ ] **Step 3: Install badge**
Same process.

- [ ] **Step 4: Install card**
Same process.

- [ ] **Step 5: Install input**
Same process. Before replacing the existing input, compare the glass-ui version with our current one to preserve any customizations.

- [ ] **Step 6: Install label**
Same process.

- [ ] **Step 7: Update consumer imports for replaced components**

For each component replaced, search the codebase for `from '@/components/ui/alert'`, `from '@/components/ui/avatar'`, etc. and verify they still work. The glass-ui components should export the same API, so imports should work without changes.

- [ ] **Step 8: Run check and tests**

Run: `pnpm check && pnpm -F @myboteam/web test`
Expected: No type errors, all tests pass

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/client/
git commit -m "feat(web): add glass-ui components batch 1 (alert, avatar, badge, card, input, label)"
```

---

## Task 10: Install glass-ui components (batch 2: dropdown-menu, scroll-area, separator, skeleton, switch, tabs, textarea, tooltip)

**Files:**
- Various UI component files in `apps/web/src/client/components/ui/`

Same process as Task 9 for the remaining components.

**Batch 2 components:**
- `@glass-ui/dropdown-menu`
- `@glass-ui/scroll-area`
- `@glass-ui/separator`
- `@glass-ui/skeleton`
- `@glass-ui/switch`
- `@glass-ui/tabs`
- `@glass-ui/textarea`
- `@glass-ui/tooltip`

- [ ] **Step 1: Install each component (one at a time)**
Follow the same install-move-fix pattern for each.

- [ ] **Step 2: Verify dialog still works**

The dialog has custom Framer Motion animation. Check that the existing `dialog.tsx` still works after installing glass-ui dropdown-menu and tooltip (which dialog depends on).

- [ ] **Step 3: Run check and tests**

Run: `pnpm check && pnpm -F @myboteam/web test`
Expected: No type errors, all tests pass

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/client/
git commit -m "feat(web): add glass-ui components batch 2 (dropdown, scroll-area, separator, skeleton, switch, tabs, textarea, tooltip)"
```

---

## Task 11: Replace dialog with glass-ui dialog

**Files:**
- Modify: `apps/web/src/client/components/ui/dialog.tsx`

The dialog component has custom Framer Motion animations. We need to install the glass-ui dialog and merge our custom animation behavior.

- [ ] **Step 1: Install @glass-ui/dialog**
Run: `pnpm dlx shadcn@latest add @glass-ui/dialog`

- [ ] **Step 2: Compare with existing dialog**

Read the existing `src/client/components/ui/dialog.tsx` and the glass-ui version. Identify:
- Framer Motion animation logic (DialogContent animation, DialogOverlay transitions)
- Translation hooks (`useTranslation`)
- Any custom styling (close button, backdrop, etc.)

- [ ] **Step 3: Merge custom behavior into glass-ui dialog**

Combine the glass-ui `glass-bg` surface styling with our existing Framer Motion animation and i18n support. The glass dialog overlay gets `.glass-bg` class.

- [ ] **Step 4: Verify dialog usage across app**

Search for all imports of `@/components/ui/dialog` and verify each usage still works.

- [ ] **Step 5: Run check and tests**

Run: `pnpm check && pnpm -F @myboteam/web test`

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/client/components/ui/dialog.tsx
git commit -m "feat(web): replace dialog with glass-ui dialog (preserving animations)"
```

---

## Task 12: Apply glass surfaces to layout containers

**Files:**
- Modify: `apps/web/src/client/components/layout/Sidebar.tsx`
- Various layout/page components

- [ ] **Step 1: Add glass-bg to Sidebar**

In `Sidebar.tsx`, add `glass-bg` class to the main sidebar `<div>`:

```tsx
<div className="flex h-screen w-[260px] flex-col border-r border-border bg-card/70 glass-bg pt-12">
```

- [ ] **Step 2: Find and update card containers**

Search for `bg-card` or `bg-background` classes on content containers that should have glass effect. Add `glass-bg` or `glass-frosted` as appropriate based on visual context.

- [ ] **Step 3: Find and update dialog/popover overlays**

In the dialog overlay, add `glass-bg` class.

- [ ] **Step 4: Run check and tests**

Run: `pnpm check && pnpm -F @myboteam/web test`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/client/
git commit -m "feat(web): apply glass surfaces to layout containers"
```

---

## Task 13: Update the existing Button to use glass-ui button

**Files:**
- Modify: `apps/web/src/client/components/ui/button.tsx`

We already have a `GlassButton` in `components/ui/glass/button.tsx`. The default button should use glass styling.

- [ ] **Step 1: Read the current button and glass button**

Compare `src/client/components/ui/button.tsx` with `src/client/components/ui/glass/button.tsx`.

- [ ] **Step 2: Merge glass button behavior into default button**

Add `glass-bg` class to the default button variant's base styles. Update the button to include glass effect as the default appearance, while keeping all existing variants (default, destructive, outline, secondary, ghost, link).

- [ ] **Step 3: Remove separate glass/button.tsx**

Once merged, the standalone `glass/button.tsx` can be removed or kept as a convenience re-export.

- [ ] **Step 4: Search for any direct imports of glass/button**

Update any `from '@/components/ui/glass/button'` imports to use the standard button.

- [ ] **Step 5: Run check and tests**

Run: `pnpm check && pnpm -F @myboteam/web test`

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/client/components/ui/
git commit -m "feat(web): merge glass button styling into default button component"
```

---

## Task 14: End-to-end verification and cleanup

**Files:**
- Various

- [ ] **Step 1: Run full check**

Run: `pnpm check`
Expected: No errors

- [ ] **Step 2: Run all tests**

Run: `pnpm -F @myboteam/web test && pnpm -F @myboteam/desktop test && pnpm -F @myboteam/agent-core test`
Expected: All tests pass

- [ ] **Step 3: Clean up any leftover mislocated shadcn files**

Check for and remove any `apps/web/@/`, `apps/web/src/lib/`, `apps/web/src/components/` (non-client), or `apps/web/src/app/` directories created by shadcn CLI.

- [ ] **Step 4: Test theme switching manually**

Start the dev server: `pnpm dev:web`
- Click each color circle in the sidebar
- Verify body background changes to the correct gradient
- Verify primary/accent colors change on buttons and interactive elements
- Toggle light/dark mode and verify color themes still apply correctly
- Verify theme color persists across page reloads
- Verify neutral theme shows solid background (no gradient)

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: cleanup and final verification for glass UI theme system"
```