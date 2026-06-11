# Data Model: UI Package with Design System

**Date**: 2026-06-11 | **Phase 1**

## Entities

### E1: DesignToken

Structured representation of a single design token value.

| Field | Type | Description |
|---|---|---|
| name | `string` | Canonical token name (e.g., `color-primary`, `radius-md`) |
| value | `string \| Record<string, string>` | Token value; record when light/dark variants differ |
| category | `TokenCategory` | Classification: `color`, `typography`, `spacing`, `shadow`, `glass`, `animation` |
| cssProperty | `string` | Corresponding CSS custom property name (e.g., `--color-primary`) |
| description | `string` | Human-readable description |

```
TokenCategory = 'color' | 'typography' | 'spacing' | 'shadow' | 'glass' | 'animation'
```

**Validation**: `name` must be unique within `category`. `cssProperty` must start with `--`.

---

### E2: ThemeDefinition

A named theme variant with its CSS variable overrides.

| Field | Type | Description |
|---|---|---|
| name | `string` | Theme name (e.g., `light`, `dark`, `mint`, `blue`) |
| mode | `'light' \| 'dark'` | Base mode |
| cssClass | `string` | CSS class that activates the theme (e.g., `.theme-mint`, `.dark.theme-mint`) |
| variables | `Record<string, string>` | CSS custom property overrides for this theme |

**Validation**: `name` must be unique. `cssClass` must be a valid CSS class selector.

**Relationships**: A ThemeDefinition overrides values from the base `light` or `dark` theme.

---

### E3: ComponentExport

A React component exposed by the package.

| Field | Type | Description |
|---|---|---|
| name | `string` | Export name (e.g., `Button`, `Card`) |
| filePath | `string` | Source file path relative to `src/` |
| category | `'shadcn' \| 'glass' \| 'app'` | Component classification |
| dependencies | `string[]` | Other ComponentExports this depends on |
| hasStory | `boolean` | Whether a Storybook story exists |

**Validation**: `name` must be unique. `filePath` must exist. `dependencies` must reference valid ComponentExport names.

---

### E4: GlassCustomization

Configuration object for glass morphism effects (existing type, relocated).

| Field | Type | Description |
|---|---|---|
| color | `string?` | Background color override |
| transparency | `number?` | Opacity value (0–1) |
| blur | `number \| string?` | Backdrop blur amount |
| outline | `string?` | Border color override |
| outlineWidth | `number \| string?` | Border width |
| shadow | `string?` | Custom box-shadow |
| innerGlow | `string?` | Inner glow color |
| innerGlowBlur | `number \| string?` | Inner glow blur amount |

---

### E5: HoverEffect

Animation preset for interactive elements (existing type, relocated).

| Value | Description |
|---|---|
| `none` | No hover animation |
| `glow` | Purple glow shadow on hover |
| `shimmer` | Translating gradient sweep |
| `ripple` | Expanding circular background |
| `lift` | Upward translate + shadow |
| `scale` | 105% scale on hover |

---

## Entity Relationships

```text
ThemeDefinition ──overrides──► DesignToken (via CSS custom properties)
ComponentExport ──depends on──► ComponentExport
ComponentExport ──uses──► GlassCustomization (button, dialog, glass variants)
ComponentExport ──uses──► HoverEffect (button, glass variants)
DesignToken ──grouped by──► TokenCategory
```

## Data Volume Estimates

- ~60 color tokens (light/dark + 6 color themes × 2 modes)
- ~10 typography tokens
- ~6 spacing/radius tokens
- ~10 shadow tokens
- ~30 glass tokens (light/dark variants)
- ~6 animation tokens
- ~30 ComponentExports (shadcn standard)
- ~15 ComponentExports (glass variants)
- ~3 ComponentExports (app-specific: button, CodeBlock, streaming-text)
- ~15 ThemeDefinitions (light base, dark base, 6 light themes, 6 dark themes, glass variants)
