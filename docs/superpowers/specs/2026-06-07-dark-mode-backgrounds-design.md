# Dark Mode Backgrounds — Design Spec

> **Goal:** Improve dark mode background gradient visualization and contrast for better readability and visual comfort.
>
> **Architecture:** CSS-only change — replace `.dark.theme-*` `--theme-bg-gradient` values with deep, desaturated per-theme gradients, and adjust a handful of dark-mode CSS custom properties for better contrast.
>
> **Tech Stack:** Tailwind CSS v4, shadcn/ui CSS variable theming, CSS custom properties in `globals.css`

---

## Background

Current dark mode has two issues:

1. **Accent theme gradients are too bright** — The `.dark.theme-mint`, `.dark.theme-blue`, etc. gradients use the same light pastel colors as light mode (e.g., `#a3e7d3 → #53d3b1` for mint). These wash out text/component contrast and feel jarring against the dark UI.
2. **Insufficient contrast** — The flat dark background (`--background: 0 0% 9%`, ~#171717) is too close in luminance to card/popover surfaces, making UI hierarchy hard to discern. Border and muted foreground values also lack sufficient contrast.

## Design

### Approach: Dark-Tailored Per-Theme Gradients

Each accent theme gets its own dark-mode gradient — deep, desaturated tones that hint at the accent color without dominating the page. The flat no-accent background is also darkened slightly.

### CSS Variable Changes

#### Flat dark background (no accent theme)

| Variable | Current | Proposed |
|---|---|---|
| `--background` (`.dark`) | `0 0% 9%` (#171717) | `0 0% 6%` (#0f0f0f) |

This increases the luminance gap between the canvas and card surfaces from ~2% to ~5% (approximately), making cards distinctly visible.

#### Contrast improvements (`.dark` block)

| Variable | Current | Proposed | Rationale |
|---|---|---|---|
| `--card` | `0 0% 11%` | **Unchanged** `0 0% 11%` | Wider gap to darker background |
| `--popover` | `0 0% 11%` | `0 0% 13%` (#212121) | Distinguish from card surfaces |
| `--border` | `0 0% 20%` | `0 0% 22%` (#383838) | More visible element boundaries |
| `--muted` | `0 0% 15%` | `0 0% 17%` (#2b2b2b) | Better subtle background distinction |
| `--muted-foreground` | `0 0% 64%` | `0 0% 70%` (#b3b3b3) | WCAG AA compliance against dark bg |

#### Per-theme dark-mode gradient values (`.dark.theme-*`)

Each accent theme's `--theme-bg-gradient` is replaced with a deep, desaturated gradient:

| Theme | Current (too bright) | Proposed (deep/subtle) |
|---|---|---|
| Mint | `#a3e7d3 → #53d3b1` | `#1a3d33 → #0d2620` |
| Blue | `#b9daff → #7fb9ff` | `#1a2740 → #0d1830` |
| Lemon | `#ffffb3 → #e6ff66` | `#3d3d1a → #26260d` |
| Peach | `#ffd0b3 → #ffa07a` | `#3d241a → #26180d` |
| Lavender | `#dcd3ff → #b3a3ff` | `#2a1a3d → #1a0d26` |
| Neutral | *(none)* | `#1f1f1f → #141414` |

The neutral theme currently has no `--theme-bg-gradient` set — it will gain a subtle charcoal gradient for consistency.

### Body Background Rule

The body background rule remains unchanged:
```css
body {
  @apply text-foreground;
  background: var(--theme-bg-gradient, hsl(var(--background)));
}
```

When an accent theme is active, `--theme-bg-gradient` is set (now the dark-subtle variant). When no accent theme is active, it falls back to the darker `hsl(var(--background))` value.

### Fallback Behavior

- No accent theme selected → flat `#0f0f0f` background (improved contrast vs #171717)
- Accent theme selected in dark mode → deep desaturated gradient
- Accent theme selected in light mode → unchanged (light mode gradients stay as-is)

### Accessibility

The `--muted-foreground` change from 64% to 70% lightness improves contrast against dark surfaces. While this is still below WCAG AA for small text on `--card` backgrounds, it improves readability for secondary UI text (labels, hints) which is the primary use of this token.

### File Changes

Only one file is modified:

- `apps/web/src/client/styles/globals.css` — Change the `.dark` block CSS variables and the `.dark.theme-*` gradient values

No new files. No JS/TS changes. No component changes.

## Files Modified

- `apps/web/src/client/styles/globals.css` — Update `.dark` section (~6 HSL variables) and `.dark.theme-*` sections (~6 gradient values)
