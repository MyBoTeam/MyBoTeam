# Specification: UI Package with Design System

**Goal**: Create a fresh `packages/ui` workspace package with a new shadcn installation, fresh Storybook, glass theme integration, and design tokens — replacing the existing scattered UI components in the web app.

**Success Criteria**:
- A new `packages/ui/` package with its own package.json, TypeScript config, and build pipeline, containing fresh shadcn components, glass variants, and Storybook
- Design tokens (colors, spacing, radii, shadows, typography) and theme definitions (light/dark) are defined and exported using shadcn defaults (to be customized in future specs)
- Storybook is configured and renders every component in isolation with controls for variants and themes
- The web app imports UI components from `@myboteam/ui` instead of local paths; existing local UI component files are deleted
- The package is structured for future consumption by other workspace members (e.g., `apps/daemon`)

**Constraints**:
- Web app must compile and run after migration; visual design changes are expected and accepted (fresh shadcn defaults replace old custom styles)
- Must follow existing monorepo conventions (pnpm workspaces, TypeScript path aliases, ESM where applicable)
- Package must be consumable by `apps/web` and potentially `apps/daemon` in the future

---

## User Scenarios & Testing

### Scenario 1: Developer consumes a UI component from the package
**As a** developer working on the web app,
**I want to** import a Button component from `@myboteam/ui`,
**So that** I can use the shared design system without duplicating code.

**Acceptance**:
- `import { Button } from '@myboteam/ui'` resolves and renders
- Button supports standard shadcn variants (default, destructive, outline, secondary, ghost, link) and glass variants
- All standard shadcn component imports resolve from the package

### Scenario 2: Developer browses components in Storybook
**As a** developer or designer,
**I want to** open Storybook and see every UI component rendered in isolation,
**So that** I can verify visual appearance and behavior without running the full app.

**Acceptance**:
- Every exported component has at least one Story
- Light/dark mode toggle works in Storybook
- Glass variants (default, frosted, fluted, crystal) are viewable

### Scenario 3: Designer reviews design tokens
**As a** designer,
**I want to** see all design tokens (colors, spacing, radii, shadows, typography) defined in a single source,
**So that** I can ensure visual consistency across the product.

**Acceptance**:
- Tokens are defined as structured, programmatically accessible values
- Tokens are documented in Storybook with visual previews
- Light and dark mode token values are both present
- Token values use shadcn defaults (to be customized in future specs)

### Scenario 4: Developer adds a new workspace consumer
**As a** developer,
**I want to** add `@myboteam/ui` as a dependency to another workspace package,
**So that** I can reuse the design system without copying code.

**Acceptance**:
- Adding `"@myboteam/ui": "workspace:*"` to a package.json resolves correctly
- TypeScript types are available without additional configuration
- Components render with correct styles when the consumer provides the required CSS variables

---

## Functional Requirements

### FR-1: Package scaffolding
The `packages/ui/` workspace package must have:
- A `package.json` with name `@myboteam/ui`, following workspace conventions (`"type": "module"`, `"private": true`)
- A TypeScript configuration that compiles the package and produces type declarations
- A build pipeline that outputs consumable ESM and type definitions, where individual component imports resolve without bundling all components (tree-shakeable)
- An `index.ts` barrel file exporting all components, utilities, and tokens

### FR-2: Fresh component installation
UI components must be freshly installed into `packages/ui/` (not copied from `apps/web`):
- Initialize shadcn via CLI in the new package, installing fresh standard components: alert, avatar, badge, button, card, dialog, dropdown-menu (and sub-components), input, label, scroll-area, separator, skeleton, switch, tabs, textarea, tooltip
- Install glass variants via the `@glass-ui` shadcn registry
- Create custom presentational components (CodeBlock, streaming-text) from scratch
- Components that depend on app stores or i18n (ThemeToggle, ThemeColorSelector, ProviderIcon, StarButton, SpeechInputButton, ModelIndicator, ProviderSubMenu, ErrorBoundary, RouteErrorFallback) remain in `apps/web` and import UI primitives from `@myboteam/ui`

### FR-3: Shared utilities
The package must provide its own utilities:
- `cn()` (clsx + tailwind-merge utility)
- Glass utilities: `GlassCustomization` type, `getGlassStyles()`, `getGlassCSSVars()` (provided by glass registry or created fresh)
- Hover effect utilities: `hoverEffects` cva, `HoverEffect` type
- Animation utilities: Framer Motion springs, variants, settings helpers

### FR-4: Design tokens
Design tokens must be defined as structured, programmatically accessible values using shadcn defaults:
- Color tokens: shadcn default palette (background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring)
- Typography tokens: font family and weight definitions
- Spacing/radius tokens: standard radius values
- Shadow tokens: standard shadow scale
- Animation tokens: standard easing and keyframe definitions
- Token values use shadcn defaults; custom app-specific tokens (provider-*, todo-* etc.) will be added in future specs

### FR-5: Theme definitions
The package must export theme definitions for:
- Light mode (root CSS variables) using shadcn defaults
- Dark mode (`.dark` CSS variables) using shadcn defaults
- Glass theme variants
- Color theme variants (mint, blue, lemon, peach, lavender, neutral) and custom app tokens will be added in future specs

### FR-6: Storybook configuration
A fresh Storybook instance must be initialized within `packages/ui/` that:
- Is installed via `npx storybook@latest init`
- Discovers and renders all exported components automatically
- Provides controls for component variants, sizes, and glass customizations
- Supports light/dark mode toggle
- Runs as a standalone dev server independent of the web app

### FR-7: Web app migration
The web app (`apps/web`) must:
- Delete all existing UI component files from `apps/web/src/client/components/ui/` (both migrated and store-connected — store-connected components will be recreated to import from the package)
- Add `@myboteam/ui` as a workspace dependency in its `package.json`
- Add a TypeScript path alias for `@myboteam/ui` in `tsconfig.client.json`
- Retain its own `globals.css` for app-specific styles (font faces, base layer, scrollbar, drag regions, textarea placeholders)
- Import theme CSS from `@myboteam/ui` (tokens and theme variable definitions)
- Recreate store-connected components (ErrorBoundary, ThemeToggle, etc.) to import UI primitives from `@myboteam/ui` instead of deleted local files
- Compile and run after migration (visual design changes are expected and accepted)

### FR-8: shadcn CLI integration
The `components.json` configuration must be set up in `packages/ui/` so that:
- Running the shadcn CLI adds new components to `packages/ui/`
- The CLI aliases resolve to the package's internal paths

---

## Key Entities

### Package: `@myboteam/ui`
- **Components**: Fresh shadcn components + glass variants + custom presentational components (CodeBlock, streaming-text); excludes store-connected components
- **Tokens**: Structured design token definitions (shadcn defaults)
- **Themes**: Light/dark mode (shadcn defaults)
- **Utilities**: cn(), glass-utils, hover-effects, animations
- **Stories**: One Storybook story file per component

### Consumer: `apps/web`
- Depends on `@myboteam/ui` via workspace protocol
- Provides CSS variables at runtime (applied via class names on `<html>`)
- Retains app-specific styles and logic not belonging in the UI package

---

## Clarifications

### Session 2026-06-11
- Q: Which app-specific components should be migrated to `@myboteam/ui`? → A: Primitives only — migrate only components with zero app-store/i18n dependencies (button, CodeBlock, streaming-text). Keep connected components (ThemeToggle, ThemeColorSelector, ProviderIcon, StarButton, SpeechInputButton, ModelIndicator, ProviderSubMenu, ErrorBoundary, RouteErrorFallback) in `apps/web`.
- Q: Fresh install vs copy/migration? → A: Fresh install. Initialize shadcn, Storybook, and glass registry from scratch in the new package. Do not copy existing UI elements from `apps/web`. Delete the old UI files from `apps/web`. Visual design changes are expected and accepted.
- Q: Design token values — extract existing or redesign? → A: Use shadcn defaults. Custom values (app-specific colors, color themes) will be added in future specs.

---

## Assumptions

- Only purely presentational components with zero app-store/i18n dependencies belong in the package. Components that import from app-specific stores (Zustand, i18n) remain in `apps/web`.
- Fresh shadcn defaults may differ visually from the current app — this is accepted and expected.
- The package uses Vite library mode for building (consistent with monorepo tooling)
- Theme CSS (variable definitions) is exported as CSS files from the package that consumers import
- Font face declarations remain in `apps/web` since they reference app-local font files
- The `components.json` shadcn configuration lives in `packages/ui/`
- Custom color themes (mint, blue, etc.), app-specific tokens, and custom glass effects will be layered on top in future specs
