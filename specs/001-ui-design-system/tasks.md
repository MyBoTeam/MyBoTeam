# Tasks: UI Package with Design System

**Feature**: UI Package with Design System
**Branch**: `MAO-131-ui-package`
**Plan**: [plan.md](./plan.md)

## Implementation Strategy

**MVP scope**: Phase 1 + Phase 2 + Phase 3 (US1) — deliver a consumable package with fresh components, then iterate on tokens and Storybook.

**Key principle**: Fresh installs only. No copying from `apps/web`. Visual design changes are expected and accepted.

---

## Phase 1: Setup

- [x] T001 [SYNC] Create `packages/ui/package.json` with name `@myboteam/ui`, `"type": "module"`, `"private": true`, peer deps (react, react-dom), exports map per `contracts/package-api.md` — `packages/ui/package.json`
- [x] T002 [SYNC] Create `packages/ui/tsconfig.json` with `declaration: true`, `outDir: "./dist"`, `rootDir: "./src"`, JSX react-jsx, ES2022 target, bundler module resolution — `packages/ui/tsconfig.json`
- [x] T003 [SYNC] Create `packages/ui/vite.config.ts` with library mode entry `src/index.ts`, Vite plugin dts for type generation, PostCSS CSS processing — `packages/ui/vite.config.ts`
- [x] - [x] T004 [ASYNC] Create `packages/ui/postcss.config.js` with `@tailwindcss/postcss` plugin — `packages/ui/postcss.config.js`
- [x] - [x] T005 [ASYNC] Create directory structure: `packages/ui/src/{components/ui,components/glass,utils,tokens,themes,styles,stories}` — `packages/ui/src/`

---

## Phase 2: Fresh Tooling Init

- [x] - [x] T006 [SYNC] Run `pnpm dlx shadcn@latest init` in `packages/ui/` — configure for Tailwind CSS v4, neutral base color, CSS variables enabled, no RSC. This creates `components.json` and `src/lib/utils.ts` (containing `cn()`) — `packages/ui/`
- [x] T007 [SYNC] Run `npx storybook@latest init` in `packages/ui/` — configure Storybook with Vite builder, set stories path to `src/stories/**/*.stories.tsx` — `packages/ui/`
- [x] - [x] T008 [ASYNC] Move `packages/ui/src/lib/utils.ts` → `packages/ui/src/utils/cn.ts` (shadcn init creates it at `src/lib/utils.ts`; relocate to match our structure). Update `components.json` `utils` alias to `src/utils/cn` — `packages/ui/src/utils/cn.ts`, `packages/ui/components.json`

---

## Phase 3: User Story 1 — Developer consumes a UI component from the package

**Goal**: `import { Button } from '@myboteam/ui'` resolves and renders. Standard shadcn + glass variants available.

**Independent test criteria**: Web app builds and runs with `@myboteam/ui` imports; `pnpm check` passes.

### Fresh Component Installation

- [x] - [x] T009 [SYNC] [US1] Install standard shadcn components via CLI: `pnpm dlx shadcn@latest add alert avatar badge button card dialog dropdown-menu input label scroll-area separator skeleton switch tabs textarea tooltip` in `packages/ui/` — `packages/ui/src/components/ui/*.tsx`
- [x] - [x] T010 [ASYNC] [US1] Install glass variant components via `@glass-ui` registry: `pnpm dlx shadcn@latest add @glass-ui/alert @glass-ui/avatar @glass-ui/badge @glass-ui/button @glass-ui/card @glass-ui/dialog @glass-ui/dropdown-menu @glass-ui/input @glass-ui/label @glass-ui/scroll-area @glass-ui/separator @glass-ui/skeleton @glass-ui/switch @glass-ui/tabs @glass-ui/textarea @glass-ui/tooltip` — `packages/ui/src/components/glass/*.tsx`

### Custom Components

- [x] - [x] T011 [SYNC] [US1] Create `packages/ui/src/components/code-block.tsx` — syntax-highlighted code block using prism-react-renderer with copy button — `packages/ui/src/components/code-block.tsx`
- [x] - [x] T012 [ASYNC] [US1] Create `packages/ui/src/components/streaming-text.tsx` — streaming text animation component — `packages/ui/src/components/streaming-text.tsx`

### Utilities

- [x] - [x] T013 [ASYNC] [US1] Create `packages/ui/src/utils/glass-utils.ts` — if not provided by glass registry, create `GlassCustomization` type, `getGlassStyles()`, `getGlassCSSVars()` — `packages/ui/src/utils/glass-utils.ts`
- [x] - [x] T014 [ASYNC] [US1] Create `packages/ui/src/utils/hover-effects.ts` — hover effects cva with variants (none, glow, shimmer, ripple, lift, scale) — `packages/ui/src/utils/hover-effects.ts`
- [x] - [x] T015 [ASYNC] [US1] Create `packages/ui/src/utils/animations.ts` — Framer Motion springs, variants, settings helpers — `packages/ui/src/utils/animations.ts`
- [x] - [x] T016 [ASYNC] [US1] Create `packages/ui/src/utils/index.ts` — barrel export cn, glass-utils, hover-effects, animations — `packages/ui/src/utils/index.ts`

### CSS & Tokens

- [x] - [x] T017 [SYNC] [US1] Create `packages/ui/src/styles/tokens.css` — `@theme` block with shadcn default tokens (colors, typography, radius, shadows, animations) — `packages/ui/src/styles/tokens.css`
- [x] - [x] T018 [SYNC] [US1] Create `packages/ui/src/styles/themes.css` — `:root` and `.dark` CSS variable definitions using shadcn defaults — `packages/ui/src/styles/themes.css`
- [x] - [x] T019 [SYNC] [US1] Create `packages/ui/src/styles/glass.css` — glass utility classes (`.glass-bg`, `.glass-frosted`, `.glass-fluted`, `.glass-crystal`) — `packages/ui/src/styles/glass.css`

### Barrel Exports

- [x] - [x] T020 [SYNC] [US1] Create `packages/ui/src/index.ts` — barrel export all components (standard, glass, custom), utilities, tokens, themes per `contracts/package-api.md` — `packages/ui/src/index.ts`

### Web App Migration

- [x] - [x] T021 [SYNC] [US1] Add `"@myboteam/ui": "workspace:*"` to `apps/web/package.json` dependencies and add `@myboteam/ui` path alias to `apps/web/tsconfig.client.json` — `apps/web/package.json`, `apps/web/tsconfig.client.json`
- [x] - [x] T022 [SYNC] [US1] Update `apps/web/vite.config.ts` — add alias for `@myboteam/ui` pointing to `../../packages/ui/src/index.ts` — `apps/web/vite.config.ts`
- [x] - [x] T023 [SYNC] [US1] Update `apps/web/src/client/styles/globals.css` — replace inline `@theme`, `:root`, `.dark`, `.theme-*`, and `@layer utilities` glass blocks with `@import '@myboteam/ui/tokens.css'`, `@import '@myboteam/ui/themes.css'`, `@import '@myboteam/ui/glass.css'`; retain font faces, scrollbar styles, drag regions, base layer, textarea placeholders — `apps/web/src/client/styles/globals.css`
- [x] - [x] T024 [SYNC] [US1] Delete ALL files in `apps/web/src/client/components/ui/` (standard shadcn, glass, and app-specific components) — `apps/web/src/client/components/ui/`
- [x] - [x] T025 [SYNC] [US1] Recreate store-connected components in `apps/web/src/client/components/` (not `ui/` subfolder): ErrorBoundary, RouteErrorFallback, ModelIndicator, ProviderIcon, ProviderSubMenu, StarButton, SpeechInputButton, ThemeToggle, ThemeColorSelector — each importing UI primitives (Button, Tooltip, etc.) from `@myboteam/ui` instead of deleted local files. Adapt to new component APIs where they differ — `apps/web/src/client/components/`
- [x] - [x] T026 [ASYNC] [US1] Replace all `@/components/ui/` imports across `apps/web/src/client/` with `@myboteam/ui` imports. Update ~40 consumer files — `apps/web/src/client/**/*.tsx`
- [x] - [x] T027 [SYNC] [US1] Verify: `pnpm install && pnpm check` passes — `packages/ui/`, `apps/web/`

---

## Phase 4: User Story 3 — Designer reviews design tokens

**Goal**: Tokens are importable as JS objects; light/dark values present; Storybook shows token preview page.

**Independent test criteria**: Token imports resolve; Storybook token page renders.

- [x] T028 [P] [ASYNC] [US3] Create `packages/ui/src/tokens/colors.ts` — structured color token definitions using shadcn defaults — `packages/ui/src/tokens/colors.ts`
- [x] T029 [P] [ASYNC] [US3] Create `packages/ui/src/tokens/typography.ts` — font family and weight token definitions — `packages/ui/src/tokens/typography.ts`
- [x] T030 [P] [ASYNC] [US3] Create `packages/ui/src/tokens/spacing.ts` — radius and spacing token definitions — `packages/ui/src/tokens/spacing.ts`
- [x] T031 [P] [ASYNC] [US3] Create `packages/ui/src/tokens/shadows.ts` — shadow token definitions — `packages/ui/src/tokens/shadows.ts`
- [x] T032 [P] [ASYNC] [US3] Create `packages/ui/src/tokens/animations.ts` — animation/easing token definitions — `packages/ui/src/tokens/animations.ts`
- [x] T033 [SYNC] [US3] Create `packages/ui/src/tokens/index.ts` — barrel export all token modules — `packages/ui/src/tokens/index.ts`
- [x] T034 [SYNC] [US3] Update `packages/ui/src/index.ts` — add token and theme exports — `packages/ui/src/index.ts`

### Theme Definitions

- [x] T035 [P] [ASYNC] [US3] Create `packages/ui/src/themes/light.ts` — light mode token value map (shadcn defaults) — `packages/ui/src/themes/light.ts`
- [x] T036 [P] [ASYNC] [US3] Create `packages/ui/src/themes/dark.ts` — dark mode token value map (shadcn defaults) — `packages/ui/src/themes/dark.ts`
- [x] T037 [ASYNC] [US3] Create `packages/ui/src/themes/index.ts` — barrel export light, dark, ThemeDefinition type — `packages/ui/src/themes/index.ts`

---

## Phase 5: User Story 2 — Developer browses components in Storybook

**Goal**: Every exported component has a Story; light/dark + glass variants viewable.

**Independent test criteria**: `pnpm -F @myboteam/ui storybook` starts; all stories render; theme switching works.

- [x] T038 [SYNC] [US2] Update `packages/ui/.storybook/preview.ts` — configure global decorator with theme CSS, light/dark toolbar toggle — `packages/ui/.storybook/preview.ts`
- [x] T039 [P] [ASYNC] [US2] Create `packages/ui/src/stories/Alert.stories.tsx` — `packages/ui/src/stories/Alert.stories.tsx`
- [x] T040 [P] [ASYNC] [US2] Create `packages/ui/src/stories/Avatar.stories.tsx` — `packages/ui/src/stories/Avatar.stories.tsx`
- [x] T041 [P] [ASYNC] [US2] Create `packages/ui/src/stories/Badge.stories.tsx` — `packages/ui/src/stories/Badge.stories.tsx`
- [x] T042 [P] [ASYNC] [US2] Create `packages/ui/src/stories/Button.stories.tsx` — with variant, size, hover, glass controls — `packages/ui/src/stories/Button.stories.tsx`
- [x] T043 [P] [ASYNC] [US2] Create `packages/ui/src/stories/Card.stories.tsx` — `packages/ui/src/stories/Card.stories.tsx`
- [x] T044 [P] [ASYNC] [US2] Create `packages/ui/src/stories/Dialog.stories.tsx` — `packages/ui/src/stories/Dialog.stories.tsx`
- [x] T045 [P] [ASYNC] [US2] Create `packages/ui/src/stories/DropdownMenu.stories.tsx` — `packages/ui/src/stories/DropdownMenu.stories.tsx`
- [x] T046 [P] [ASYNC] [US2] Create `packages/ui/src/stories/Input.stories.tsx` — `packages/ui/src/stories/Input.stories.tsx`
- [x] T047 [P] [ASYNC] [US2] Create `packages/ui/src/stories/Label.stories.tsx` — `packages/ui/src/stories/Label.stories.tsx`
- [x] T048 [P] [ASYNC] [US2] Create `packages/ui/src/stories/ScrollArea.stories.tsx` — `packages/ui/src/stories/ScrollArea.stories.tsx`
- [x] T049 [P] [ASYNC] [US2] Create `packages/ui/src/stories/Separator.stories.tsx` — `packages/ui/src/stories/Separator.stories.tsx`
- [x] T050 [P] [ASYNC] [US2] Create `packages/ui/src/stories/Skeleton.stories.tsx` — `packages/ui/src/stories/Skeleton.stories.tsx`
- [x] T051 [P] [ASYNC] [US2] Create `packages/ui/src/stories/Switch.stories.tsx` — `packages/ui/src/stories/Switch.stories.tsx`
- [x] T052 [P] [ASYNC] [US2] Create `packages/ui/src/stories/Tabs.stories.tsx` — `packages/ui/src/stories/Tabs.stories.tsx`
- [x] T053 [P] [ASYNC] [US2] Create `packages/ui/src/stories/Textarea.stories.tsx` — `packages/ui/src/stories/Textarea.stories.tsx`
- [x] T054 [P] [ASYNC] [US2] Create `packages/ui/src/stories/Tooltip.stories.tsx` — `packages/ui/src/stories/Tooltip.stories.tsx`
- [x] T055 [P] [ASYNC] [US2] Create `packages/ui/src/stories/CodeBlock.stories.tsx` — `packages/ui/src/stories/CodeBlock.stories.tsx`
- [x] T056 [P] [ASYNC] [US2] Create `packages/ui/src/stories/StreamingText.stories.tsx` — `packages/ui/src/stories/StreamingText.stories.tsx`
- [x] T057 [P] [ASYNC] [US2] Create `packages/ui/src/stories/GlassVariants.stories.tsx` — all glass variants side-by-side — `packages/ui/src/stories/GlassVariants.stories.tsx`
- [x] T058 [ASYNC] [US2] Create `packages/ui/src/stories/DesignTokens.stories.tsx` — token overview with visual previews — `packages/ui/src/stories/DesignTokens.stories.tsx`
- [x] T059 [SYNC] [US2] Add `storybook` and `build-storybook` scripts to `packages/ui/package.json`; verify all stories are auto-discovered — `packages/ui/package.json`

---

## Phase 6: User Story 4 — Developer adds a new workspace consumer

**Goal**: Adding `@myboteam/ui` as workspace dep resolves correctly with TypeScript types and CSS.

**Independent test criteria**: `pnpm build` succeeds; types resolve; CSS imports work.

- [x] T060 [SYNC] [US4] Build: `pnpm -F @myboteam/ui build` — verify `dist/index.js`, `dist/index.d.ts`, `dist/tokens.css`, `dist/themes.css`, `dist/glass.css` — `packages/ui/dist/`
- [x] T061 [SYNC] [US4] Verify `apps/web` builds: `pnpm -F @myboteam/web build` — `apps/web/`
- [x] T062 [SYNC] [US4] Verify dev server starts and renders: `pnpm -F @myboteam/web dev:web` — `apps/web/`

---

## Phase 7: Polish & Cross-Cutting

- [x] T063 [ASYNC] Add `build`, `check`, `dev` scripts to `packages/ui/package.json` — `packages/ui/package.json`
- [x] T064 [ASYNC] Clean up any stale imports (`@/utils/glass-utils`, `@/utils/hover-effects`, `@/utils/animations`) in `apps/web` that should now come from `@myboteam/ui` — `apps/web/src/client/**/*.tsx`
- [x] T065 [SYNC] Final verification: `pnpm check && pnpm -F @myboteam/web test` passes — root

---

## Dependencies

```text
Phase 1 (Setup)
  └─► Phase 2 (Fresh Tooling Init) — needs package.json + tsconfig
       └─► Phase 3 (US1) — needs shadcn + storybook initialized
            └─► Phase 4 (US3) — needs component barrel exports
            └─► Phase 5 (US2) — needs component barrel exports
                 └─► Phase 6 (US4) — needs everything built
                      └─► Phase 7 (Polish)
```

## Parallel Execution Examples

**Within Phase 4 (US3)**: T028–T032 (token files) are [P] parallel — different files.
**Within Phase 4 (US3)**: T035–T036 (theme files) are [P] parallel — different files.
**Within Phase 5 (US2)**: T039–T058 (stories) are [P] parallel — different files.

## Task Summary

| Phase | Tasks | SYNC | ASYNC |
|---|---|---|---|
| Phase 1: Setup | 5 | 3 | 2 |
| Phase 2: Fresh Tooling Init | 3 | 2 | 1 |
| Phase 3: US1 — Component consumption | 19 | 10 | 9 |
| Phase 4: US3 — Design tokens | 10 | 3 | 7 |
| Phase 5: US2 — Storybook | 22 | 2 | 20 |
| Phase 6: US4 — Workspace consumer | 3 | 3 | 0 |
| Phase 7: Polish | 3 | 1 | 2 |
| **Total** | **65** | **24** | **41** |
