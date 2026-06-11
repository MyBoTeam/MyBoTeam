# Implementation Plan: UI Package with Design System

**Branch**: `MAO-131-ui-package` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-ui-design-system/spec.md`

## Summary

Create a fresh `packages/ui` workspace package with new shadcn installation, fresh Storybook, glass theme registry integration, and design tokens using shadcn defaults. Existing UI components in `apps/web` are deleted and replaced with package imports. Visual design changes are expected and accepted.

## Technical Context

**Language/Version**: TypeScript 6.x, React 19
**Primary Dependencies**: Radix UI primitives, class-variance-authority, framer-motion, tailwind-merge, clsx, prism-react-renderer
**Storage**: N/A (UI package)
**Testing**: Vitest (unit), Storybook (visual/component)
**Target Platform**: Web (browser) — consumed by Vite-bundled apps
**Project Type**: Library (workspace package)
**Performance Goals**: Package build <10s; Storybook cold start <15s
**Constraints**: Web app must compile and run; visual changes accepted; must produce ESM + type declarations
**Scale/Scope**: ~16 standard shadcn components installed fresh, ~16 glass variants from registry, 2 custom components (CodeBlock, streaming-text), utilities, tokens (shadcn defaults), themes, Storybook

## Constitution Check

*No constitution file found. Passing gate by default.*

## Project Structure

### Documentation (this feature)

```text
specs/001-ui-design-system/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── package-api.md   # Public API contract
└── tasks.md             # Phase 2 output (/spec.tasks)
```

### Source Code (repository root)

```text
packages/ui/
├── package.json
├── tsconfig.json
├── vite.config.ts          # Library mode build
├── postcss.config.js       # Tailwind CSS v4 processing
├── components.json         # shadcn CLI config (fresh init)
├── .storybook/
│   ├── main.ts
│   └── preview.ts
├── src/
│   ├── index.ts            # Barrel exports
│   ├── styles/
│   │   ├── tokens.css      # @theme block with shadcn defaults
│   │   ├── themes.css      # :root, .dark variable definitions
│   │   └── glass.css       # Glass utility classes
│   ├── tokens/
│   │   ├── colors.ts       # Structured color token definitions
│   │   ├── typography.ts   # Font family/weight tokens
│   │   ├── spacing.ts      # Radius/spacing tokens
│   │   ├── shadows.ts      # Shadow token definitions
│   │   ├── animations.ts   # Animation/easing tokens
│   │   └── index.ts        # Token barrel
│   ├── themes/
│   │   ├── light.ts        # Light mode token values
│   │   ├── dark.ts         # Dark mode token values
│   │   └── index.ts
│   ├── utils/
│   │   ├── cn.ts           # clsx + tailwind-merge
│   │   ├── glass-utils.ts  # GlassCustomization, getGlassStyles, getGlassCSSVars
│   │   ├── hover-effects.ts # hoverEffects cva, HoverEffect type
│   │   ├── animations.ts   # Framer Motion springs, variants
│   │   └── index.ts
│   ├── components/
│   │   ├── ui/             # Fresh shadcn components (installed via CLI)
│   │   │   ├── alert.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── tooltip.tsx
│   │   ├── glass/          # Glass variants (installed via @glass-ui registry)
│   │   │   ├── alert.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── tooltip.tsx
│   │   ├── code-block.tsx  # Custom: syntax-highlighted code
│   │   └── streaming-text.tsx  # Custom: streaming text animation
│   └── stories/
│       ├── Button.stories.tsx
│       ├── Card.stories.tsx
│       ├── Dialog.stories.tsx
│       └── ... (one per component)

apps/web/
├── src/client/
│   ├── components/ui/      # DELETED: all old UI components removed
│   ├── components/         # Store-connected components recreated here
│   │   ├── ErrorBoundary.tsx
│   │   ├── RouteErrorFallback.tsx
│   │   ├── ModelIndicator.tsx
│   │   ├── ProviderIcon.tsx
│   │   ├── ProviderSubMenu.tsx
│   │   ├── StarButton.tsx
│   │   ├── SpeechInputButton.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── ThemeColorSelector.tsx
│   └── styles/
│       └── globals.css     # Imports @myboteam/ui styles + app-specific CSS
├── package.json            # Adds @myboteam/ui workspace dep
└── tsconfig.client.json    # Adds @myboteam/ui path alias
```

**Structure Decision**: New `packages/ui/` workspace package. Fresh shadcn init installs components into `src/components/ui/`. Glass variants installed from `@glass-ui` registry into `src/components/glass/`. Custom components created manually. Storybook initialized fresh via CLI.

## Triage Framework: [SYNC] vs [ASYNC] Classification

**Execution Strategy**: Architectural decisions and CLI init commands are [SYNC]; individual component creation and Storybook stories are [ASYNC].

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|---|---|---|---|---|
| Package scaffolding (package.json, tsconfig, vite) | SYNC | Architectural decision | High | Build pipeline defines how all consumers integrate |
| shadcn init + component installs | SYNC | CLI interaction | Medium | Must run interactively, config decisions |
| Storybook init | SYNC | CLI interaction | Medium | Must run interactively, config decisions |
| Glass registry installs | ASYNC | Repetitive CLI commands | Low | Same pattern per component |
| Token/theme file creation | ASYNC | Structured data | Low | shadcn defaults, no design decisions |
| Custom components (CodeBlock, streaming-text) | SYNC | Design decisions | Medium | New component API design |
| Web app deletion + re-wiring | SYNC | Integration point | High | Must correctly wire everything |
| Individual Storybook stories | ASYNC | Formulaic | Low | Follow conventions |

## Complexity Tracking

No constitution violations to justify.
