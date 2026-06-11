# Research: UI Package with Design System

**Date**: 2026-06-11 | **Phase 0**

## R1: Fresh Install vs Copy Strategy

### Decision: Fresh install — shadcn init, Storybook init, glass registry install

**Rationale**: User explicitly wants a clean start. Fresh installs avoid carrying over accumulated hacks, inconsistent patterns, and tight coupling from the old codebase. Visual design changes are accepted — the new package uses shadcn defaults, with customization deferred to future specs.

**Implementation**:
- `shadcn init` in `packages/ui/` for component scaffolding + `components.json`
- `npx storybook@latest init` for Storybook scaffolding
- `shadcn add @glass-ui/*` for glass variants from the `@glass-ui` registry
- Custom components (CodeBlock, streaming-text) created from scratch

**Alternatives considered**:
- Copy/migration from `apps/web`: Rejected per user direction — carries over old patterns and prevents clean redesign.

---

## R2: Dialog i18n Handling

### Decision: Use `closeLabel` prop defaulting to "Close"

**Rationale**: Fresh shadcn dialog won't have react-i18next. The close button's screen-reader label needs a prop-based approach. Consumers that need i18n pass their own translated string.

**Implementation**: Add `closeLabel?: string` prop to `DialogContent`, defaulting to `"Close"`.

---

## R3: CSS Delivery Strategy

### Decision: Export CSS files that consumers import directly

**Rationale**: Tailwind CSS v4 uses CSS-based configuration. The `@theme` block and CSS custom properties are available to consumers as CSS files they import.

**Implementation**:
- `@myboteam/ui/tokens.css` — `@theme { ... }` block with shadcn default tokens
- `@myboteam/ui/themes.css` — `:root`, `.dark` variable definitions
- `@myboteam/ui/glass.css` — Glass utility classes

---

## R4: Build Tool Selection

### Decision: Vite library mode

**Rationale**: Consistent with the monorepo's Vite usage. Produces ESM output with type declarations via `vite-plugin-dts`.

---

## R5: Design Token Values

### Decision: Use shadcn defaults; custom values deferred to future specs

**Rationale**: User confirmed "use defaults for now, will be changed in future specs/tickets". This keeps the initial package creation focused and avoids premature design decisions.

**Implementation**: Token files contain shadcn's default neutral palette, standard radius/spacing/shadows. Custom app-specific tokens (provider-*, todo-*, color themes) will be added later.

---

## R6: Package Peer Dependencies

### Decision: React and React-DOM as peer dependencies; all others as regular dependencies

**Rationale**: React packages must not be duplicated. Radix UI, framer-motion, and other UI libs are implementation details.

**Peer deps**: `react`, `react-dom`
**Regular deps**: `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`, `framer-motion`, `prism-react-renderer`

---

## R7: Store-Connected Components

### Decision: Delete from `apps/web/src/client/components/ui/` and recreate in `apps/web/src/client/components/`

**Rationale**: Since all files in `apps/web/src/client/components/ui/` are being deleted, store-connected components need new homes. They move up one level to `apps/web/src/client/components/` (no `ui/` subfolder) and import UI primitives from `@myboteam/ui`.

**Implementation**: Each store-connected component is recreated with imports from `@myboteam/ui` instead of local `@/components/ui/` paths. Component APIs may differ slightly from old versions — adapt as needed.

---

## R8: shadcn CLI Configuration

### Decision: Fresh `components.json` created by `shadcn init`

**Rationale**: Running `shadcn init` in `packages/ui/` creates a fresh `components.json` with correct paths. No need to relocate the old one from `apps/web`.

**Implementation**: After `shadcn init`, relocate `src/lib/utils.ts` to `src/utils/cn.ts` and update `components.json` aliases to match.
