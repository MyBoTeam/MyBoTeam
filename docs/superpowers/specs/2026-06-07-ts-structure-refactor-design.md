# TypeScript Structure Refactor

**Date:** 2026-06-07  
**Goal:** Enforce granularity rules across all source code — no `.js`/`.jsx` files, one component per `.tsx` file, one class per `.ts` file, max 5 exported functions per `.ts` file.

## Scope

- **Workspaces:** `agent-core`, `daemon`, `desktop`, `web`
- **Exempt:**
  - shadcn/ui multi-component files (dialog, dropdown-menu, dropdown-menu-sub, searchable-select-parts, tabs, tooltip) — these follow the shadcn convention of co-locating tightly-coupled sub-components
  - `apps/web/postcss.config.js` — build config, not source logic
- **Test files:** excluded from the max-5-exports and max-1-class rules (test helpers often need multiple exports per file)

## Rules

1. **No `.js` / `.jsx` source files.** All source code must be TypeScript. (Zero violations currently — postcss.config.js exempted as build config.)
2. **One component per `.tsx` file.** A "component" is a React function or const that returns JSX. Helper functions that aren't components may stay in the same file.
3. **One class per `.ts` file.** Error subclasses that are tightly coupled (e.g., extending a base error in the same file) may stay together.
4. **Max 5 exported functions per `.ts` file.** Only functions count toward the limit — types, interfaces, enums, and non-function constants/values do not. Group remaining functions into new files by logical concern.

## Violation Inventory

### Non-shadcn `.tsx` with >1 component (5 files)

| File | Components | Split target |
|---|---|---|
| `apps/web/src/client/components/settings/providers/myboteam-ai-utils.tsx` | 7 | 7 files |
| `apps/web/src/client/components/settings/WorkspacePanelForm.tsx` | 4 | 4 files |
| `apps/web/src/client/components/settings/providers/NimFormSections.tsx` | 3 | 3 files |
| `apps/web/src/client/components/BrowserScriptCardHelpers.tsx` | 3 | 3 files |
| `apps/web/src/client/components/TodoSidebar.tsx` | 3 | 3 files |

### `.ts` with >1 class (2 files)

| File | Classes | Split target |
|---|---|---|
| `packages/agent-core/src/internal/classes/adapter-types.ts` | 2 error classes | 2 files |
| `packages/agent-core/src/storage/migrations/errors.ts` | 2 error classes | 2 files |

### `.ts` with >5 exported functions (preliminary count: 26+ files)

> Note: The count below is preliminary. Files may export types, constants, or other non-function items that don't count toward the limit. Each file will be verified at implementation time.

Broken down by workspace:

**agent-core (~14 files):** ui-settings (17), provider-settings (16), providerSettings (16), taskHistory (12), adapter-utils (11), auth-slack-mcp (11), constants (10), v001-init-tables (10), browser-node-env (10), workspaces (9), auth (8), copilot-auth (8), database (8), appSettings (8), connectors (8), scheduled-tasks (8), adapter-session (7), skill-importer (7), skill-parser (7), task-manager-lifecycle (7), cli-path-utils (7), models (7), knowledgeNotes (7), skills (7), paths (7), plus several with 6 exports.

**daemon (~1 file)**

**desktop (~8 files)**

**web (~4 `.ts` files)**

## Execution Strategy: Dependency-Order Workspace-by-Workspace

```
agent-core  →  daemon  →  desktop  →  web
```

### Per-Workspace Steps

1. **Identify** all files violating the rules (per the inventory above, re-verified at time of execution)
2. **Split multi-class files** — extract each class into its own file
3. **Split >5-export files** — group exports by logical concern (e.g., queries vs mutations, or by entity sub-domain); create new files alongside the original
4. **Split multi-component `.tsx` files** (web only) — extract each component into its own file
5. **Update all imports** — both internal (within the same workspace) and cross-workspace
6. **Run verification gate** — `pnpm check && <workspace tests>`
7. **Commit** the workspace

### Cross-Workspace Import Strategy

When splitting exports in agent-core, downstream consumers (daemon, desktop, web) import via `@myboteam/agent-core` path aliases that resolve to `packages/agent-core/src/index.ts`. We may need to:

- Add re-exports from `index.ts` for new files
- Or create barrel files at directory level
- Prefer the approach that minimizes consumer-side import changes

### Splitting Heuristics for >5 Exports

- Group by **domain concept** (e.g., `ui-settings.ts` — split into `ui-settings.ts` + `ui-settings-utils.ts` or by setting category)
- Group by **operation type** (queries / mutations / utils)
- Keep tightly coupled functions together even if it means >5 exports in rare cases
- Name new files with descriptive suffixes (e.g., `-utils`, `-queries`, `-types`, `-helpers`)

## Verification

After each workspace:

```bash
pnpm check
# Then workspace-specific tests:
pnpm -F @myboteam/agent-core test  # after agent-core
pnpm -F @myboteam/desktop test     # after desktop  
pnpm -F @myboteam/web test         # after web
```

## AGENTS.md Updates

Add the following to the `Code Conventions` section:

- **One component per `.tsx` file** — shadcn/ui multi-component files are exempt
- **One class per `.ts` file** — tightly coupled error subclasses are exempt
- **Max 5 exported functions per `.ts` file** — types, interfaces, and non-function constants are excluded from the count; group additional functions into separate files by logical concern
