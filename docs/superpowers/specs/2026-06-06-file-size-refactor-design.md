# File Size Refactor: <200 Lines Per Source File

Date: 2026-06-06

## Goal

Reduce every source file in the monorepo to ≤200 lines, enforcing this rule via Biome linting and agent instructions. Test files, CSS files, barrel/index files, and build scripts are exempt.

## Scope

103 source files currently exceed 200 lines across 4 workspaces:

| Area | Files >200 lines |
|------|-----------------|
| `packages/agent-core/src/` | 31 |
| `packages/agent-core/mcp-tools/` | ~12 |
| `apps/web/src/` | 25 |
| `apps/desktop/src/` | 20 |
| `apps/daemon/src/` | 15 |

## Approach

**Approach A — Dependency-order, bottom-up (selected).** Split workspace-by-workspace in dependency order, verifying each workspace with its test suite before moving to the next. Minimizes cascading import breakage.

## Enforcement

### Biome Rule

Enable the `nursery.noExcessiveLinesPerFile` linter rule:

```json
{
  "linter": {
    "rules": {
      "nursery": {
        "noExcessiveLinesPerFile": {
          "level": "error",
          "options": { "maxLines": 200, "skipBlankLines": true }
        }
      }
    }
  }
}
```

Exempt files via Biome overrides (already partially defined):
- `**/__tests__/**`, `**/*.test.ts`, `**/*.test.tsx` — tests
- `**/e2e/**` — E2E tests
- `**/*.css` — stylesheets
- `**/scripts/**/*.cjs`, `**/scripts/**/*.mjs`, `**/scripts/**/*.js` — build scripts
- `packages/agent-core/src/index.ts` — root barrel file (purely re-exports)

### AGENTS.md Rule

Add: "No source file should exceed 200 lines. Split large files by class/function first, then by logical concern."

## Splitting Methodology

Priority order for splitting:

1. **One class per file** — each exported class gets its own file named after the class
2. **One function per file** — exported standalone functions grouped by domain into modules
3. **Logical concern grouping** — remaining code grouped by topic

Import updates: Consumer imports are updated to point to new paths. No barrel files created.

## File Layout

- **2-3 files:** same directory, flat
- **4+ files:** subdirectory named after the module
- **Naming:** camelCase, following existing conventions
- **agent-core:** use `.js` extension in imports (ESM requirement)
- **No barrel files** — consumers import directly from new paths

## Workspace Order

```
agent-core → daemon → desktop → web
```

Each workspace verified before proceeding:
- Workspace tests pass
- `pnpm typecheck` passes
- `pnpm check` passes

Within each workspace: leaf modules first (no internal deps), consumer modules last.

## Files to Ignore

- All test files (`__tests__/`, `*.test.ts`, `*.test.tsx`, `e2e/`)
- CSS files (`*.css`)
- Build/script files (`scripts/**/*.cjs`, `scripts/**/*.mjs`, `scripts/**/*.js`)
- Barrel/index files (e.g., `packages/agent-core/src/index.ts`)
