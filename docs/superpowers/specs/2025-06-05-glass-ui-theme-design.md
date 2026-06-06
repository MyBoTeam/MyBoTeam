# Glass UI Theme & Color Selector Design

## Overview

Replace all shadcn UI components with glass-ui equivalents, apply glass surfaces throughout the app, add a 6-option color theme selector (5 colored + 1 neutral), and integrate the selector into the sidebar.

## Architecture: CSS Class-based Theming

The `<html>` element gets two independent classes:

- **Mode class:** `dark` or nothing (existing light/dark system, unchanged)
- **Color class:** `theme-mint`, `theme-blue`, `theme-lemon`, `theme-peach`, `theme-lavender`, or `theme-neutral`

```html
<html class="dark theme-mint">   <!-- dark mode + mint green -->
<html class="theme-blue">         <!-- light mode + baby blue -->
<html class="theme-neutral">      <!-- light mode + neutral gray -->
```

This extends the existing class-switching pattern (no architectural changes to the theme system).

## Color Themes

6 options with CSS class names and primary/gradient definitions:

| Name | Class | Circle fill gradient | Primary (hex) | Primary (HSL light) | Primary (HSL dark) |
|------|-------|---------------------|----------------|---------------------|---------------------|
| Mint Green | `.theme-mint` | `#A3E7D3 → #53D3B1` | `#2E8B75` | `163 54% 42%` | `163 54% 55%` |
| Baby Blue | `.theme-blue` | `#B9DAFF → #7FB9FF` | `#4A72CD` | `221 56% 55%` | `221 56% 65%` |
| Lemon Yellow | `.theme-lemon` | `#FFFFB3 → #E6FF66` | `#A6B319` | `66 72% 40%` | `66 72% 55%` |
| Peach Orange | `.theme-peach` | `#FFD0B3 → #FFA07A` | `#CD5C5C` | `0 56% 58%` | `0 56% 68%` |
| Lavender Purple | `.theme-lavender` | `#DCD3FF → #B3A3FF` | `#6C5CE7` | `248 74% 63%` | `248 74% 73%` |
| Neutral Gray | `.theme-neutral` | solid `#9CA3AF` | `#6B7280` | `220 9% 46%` | `220 9% 56%` |

## CSS Variable Overrides

Each color theme class overrides a focused set of variables. All other variables (`--background`, `--foreground`, `--card`, `--muted`, `--border`, `--input`, `--destructive`, etc.) remain defined by `:root` / `.dark`.

### Variables overridden per theme (light mode example, mint):

```css
.theme-mint {
  --primary: 163 54% 42%;
  --primary-foreground: 0 0% 100%;
  --accent: 163 40% 90%;
  --accent-foreground: 163 54% 20%;
  --ring: 163 54% 42%;
  --theme-bg-gradient: linear-gradient(135deg, #A3E7D3 0%, #53D3B1 100%);
}
```

### Dark mode overrides for same theme:

```css
.dark.theme-mint {
  --primary: 163 54% 55%;
  --primary-foreground: 0 0% 8%;
  --accent: 163 30% 18%;
  --accent-foreground: 163 40% 80%;
  --ring: 163 54% 55%;
  --theme-bg-gradient: linear-gradient(135deg, #A3E7D3 0%, #53D3B1 100%);
}
```

Note: `--theme-bg-gradient` is re-declared in dark mode for each colored theme so it always applies. In colored themes, the body background is always the gradient in both light and dark. Only `theme-neutral` skips the gradient and uses solid backgrounds.

### Neutral theme (no gradient):

```css
.theme-neutral {
  --primary: 220 9% 46%;
  --primary-foreground: 0 0% 100%;
  --accent: 220 9% 93%;
  --accent-foreground: 220 9% 30%;
  --ring: 220 9% 46%;
  /* No --theme-bg-gradient — body uses existing solid bg */
}
```

### Body background:

When a color theme is active and `--theme-bg-gradient` is defined, apply it as `body` background. When neutral or no theme, fall back to existing `bg-background`. This can be a simple CSS rule:

```css
body {
  background: var(--theme-bg-gradient, hsl(var(--background)));
}
```

## Theme Color Persistence

Follows the exact same pattern as light/dark mode:

- **localStorage key:** `"theme-color"` (values: `"mint"`, `"blue"`, `"lemon"`, `"peach"`, `"lavender"`, `"neutral"`)
- **Electron backend:** `myboteam.setThemeColor(color)` / `myboteam.getThemeColor()` persists to DB
- **Cross-window sync:** `myboteam.onThemeColorChange()` IPC event
- **Default:** `"neutral"` — applies `.theme-neutral` class. There is no "no theme" state; neutral IS the default/baseline state.

Storage is written on both localStorage (for early-boot synchronous read) and the Electron backend (source of truth for persistence).

## Early-Boot Theme Init (`theme-core.ts`)

Add `applyColorTheme()` to the early-boot script, called right after `applyClass()` in `initEarlyTheme()`:

```ts
const COLOR_THEME_KEY = 'theme-color';
const COLOR_CLASSES = ['theme-mint', 'theme-blue', 'theme-lemon', 'theme-peach', 'theme-lavender', 'theme-neutral'];
const VALID_COLORS = ['mint', 'blue', 'lemon', 'peach', 'lavender', 'neutral'];

function applyColorTheme(color: string) {
  const html = document.documentElement;
  html.classList.remove(...COLOR_CLASSES);
  if (color && color !== 'default' && VALID_COLORS.includes(color)) {
    html.classList.add(`theme-${color}`);
  }
}

// In initEarlyTheme(), after applyClass():
const storedColor = localStorage.getItem(COLOR_THEME_KEY);
if (storedColor) applyColorTheme(storedColor);
```

This is compiled into `theme-init.js` alongside the existing dark-mode logic — zero FOUC for color themes.

## React Layer (`useTheme` hook)

Add to the existing `useTheme` hook:

```ts
const [themeColor, setThemeColor] = useState<string>('neutral');

// On mount: read from backend
useEffect(() => {
  myboteam.getThemeColor().then(color => setThemeColor(color || 'neutral'));
}, []);

// toggle/set pattern mirrors existing theme functions
const changeThemeColor = useCallback((color: string) => {
  applyColorTheme(color);
  localStorage.setItem(COLOR_THEME_KEY, color);
  setThemeColor(color);
  myboteam.setThemeColor(color);
}, []);
```

## IPC Bridge Additions (`myboteam.ts`)

Three new methods mirroring the existing theme IPC pattern:

- `getThemeColor(): Promise<string>`
- `setThemeColor(color: string): Promise<void>`
- `onThemeColorChange?(callback: ({ color }) => void): () => void`

## Sidebar Theme Selector

### Layout

Two rows in the sidebar bottom section (inside the existing `border-t` area):

```
Row 1: [O][O][O][O][O][O]          ← 6 color circles, centered
Row 2: [workspace logo] [⚙️] [●]  ← existing bottom bar, unchanged
```

The circles row sits above the existing logo/settings/daemon row.

### Circle design

- Small circles (~24px) with the theme's gradient fill
- Active theme gets a ring/border highlight (2px solid primary or ring color)
- Hover: slight scale or brightness increase
- Tooltip on hover showing theme name (Mint, Blue, Lemon, Peach, Lavender, Neutral)
- No labels on the circles — color-only identification
- Uses the existing `Tooltip` component

### Component location

New component: `src/client/components/settings/ThemeColorSelector.tsx`
Imported and rendered in `Sidebar.tsx` above the existing bottom row.

## Component Migration: Existing → Glass UI

### Replace with glass-ui versions

| Current | Glass-ui replacement | Notes |
|---------|---------------------|-------|
| `ui/button` | `@glass-ui/button` | Already installed |
| `ui/alert` | `@glass-ui/alert` | |
| `ui/avatar` | `@glass-ui/avatar` | |
| `ui/badge` | `@glass-ui/badge` | |
| `ui/card` | `@glass-ui/card` | |
| `ui/dialog` | `@glass-ui/dialog` | Preserve custom Framer Motion animation |
| `ui/dropdown-menu` | `@glass-ui/dropdown-menu` | |
| `ui/input` | `@glass-ui/input` | |
| `ui/label` | `@glass-ui/label` | |
| `ui/scroll-area` | `@glass-ui/scroll-area` | |
| `ui/separator` | `@glass-ui/separator` | |
| `ui/skeleton` | `@glass-ui/skeleton` | |
| `ui/switch` | `@glass-ui/switch` | |
| `ui/tabs` | `@glass-ui/tabs` | |
| `ui/textarea` | `@glass-ui/textarea` | |
| `ui/tooltip` | `@glass-ui/tooltip` | |

### Keep as-is (no glass-ui equivalent or too custom)

- `CodeBlock`, `ErrorBoundary`, `RouteErrorFallback`
- `searchable-select`, `SpeechInputButton`, `StarButton`, `streaming-text`
- `ModelIndicator`, `ProviderIcon`, `ProviderSubMenu`, `ThemeToggle`

### Migration approach (per component)

1. Run `pnpm dlx shadcn@latest add @glass-ui/<name>` — creates files in mislocated paths
2. Move files to `src/client/components/ui/` and fix `@/` alias imports
3. Merge any custom behavior from original (e.g., dialog animations) into glass version
4. Update all consumer imports across the app
5. Verify with `pnpm check` and tests after each batch

## Glass Surface Application

Apply glass backgrounds to key surfaces:

- **Sidebar background** → `.glass-bg` class
- **Page background** → theme gradient via `--theme-bg-gradient` (or solid for neutral)
- **Card containers** → `.glass-bg` or `.glass-frosted`
- **Dialog overlays** → `.glass-bg`
- **Popover/dropdown menus** → `.glass-bg`

All glass CSS variables (`--glass-bg`, `--glass-border`, `--glass-shadow`, etc.) remain shared across all color themes.

## Glass UI CSS & Utilities

Already integrated into `globals.css`:
- Glass CSS variables in `:root` and `.dark`
- `.glass-bg`, `.glass-frosted`, `.glass-fluted`, `.glass-crystal` utility classes
- `glass-utils.ts` and `hover-effects.ts` in `src/client/lib/`
- `GlassButton` component in `src/client/components/ui/glass/`

New glass-ui components will be installed via `pnpm dlx shadcn@latest add @glass-ui/<name>` and relocated to `src/client/components/ui/` with fixed imports.

## New files to create

- `src/client/components/settings/ThemeColorSelector.tsx` — the 6-circle selector
- Color theme CSS blocks in `globals.css` (6 themes × 2 modes = 12 variable sets)
- `theme-core.ts` additions: `applyColorTheme()`, `COLOR_THEME_KEY`, validation
- `theme.ts` additions: color theme application and system listener
- `useTheme.ts` additions: `themeColor` state, `changeThemeColor()`
- `myboteam.ts` additions: `getThemeColor`, `setThemeColor`, `onThemeColorChange`
- Desktop IPC handler additions for theme-color channel