# Biome Migration Design

## Goal

Replace ESLint + Prettier with Biome across all workspaces, add 70% coverage thresholds to vitest configs, and align husky hooks with the v0.2.0 reference project.

## Scope

9 workspace packages across `apps/` and `packages/agent-core/` plus root-level config.

## Changes

### 1. Root `biome.json`

Copy the v0.2.0 `biome.json` with adjustments for the current project structure:
- Add `mcp-tools/**` to the ignores for the noDefaultExport override (config files use default exports)
- Add `**/bundled-skills/**` ignore (auto-generated)
- Remove `specs/` references (not present in v0.3.0)
- Add `**/scripts/**/*.cjs` ignore (CJS scripts not handled by Biome)

Key rules: `recommended` ruleset, `noConsole: error`, `noDefaultExport: error` (with overrides for test files, config files, html, css), `noUnusedVariables: error`, single quotes, trailing commas, 100 line width, organize imports on assist.

### 2. Root `package.json`

**Scripts:**
- Add `"check": "biome check --write apps packages && pnpm -r exec tsc --noEmit"`
- Remove `lint`, `lint:eslint`, `format`, `format:check`
- Replace `typecheck` with `"typecheck": "pnpm -r exec tsc --noEmit"` (switch from `pnpm -r --parallel run typecheck` to direct tsc, since per-package typecheck scripts are being removed)

**devDependencies to REMOVE:**
- `@eslint/js`, `eslint`, `eslint-config-prettier`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `globals`, `prettier`, `typescript-eslint`, `lint-staged`

**devDependencies to ADD:**
- `@biomejs/biome` (version from v0.2.0 or latest compatible)

### 3. Per-package `package.json` scripts

Each workspace package gets a single `check` script:
```json
"check": "biome check --write . && tsc --noEmit"
```

Remove existing `lint`, `typecheck`, `lint:fix` scripts from each workspace.

Packages to update:
- `apps/web`
- `apps/desktop`
- `apps/daemon`
- `packages/agent-core`
- `packages/agent-core/mcp-tools/dev-browser`
- `packages/agent-core/mcp-tools/dev-browser-mcp`
- `packages/agent-core/mcp-tools/gmail-mcp`
- `packages/agent-core/mcp-tools/gws-mcp`
- `packages/agent-core/mcp-tools/whatsapp`
- (any other mcp-tools sub-packages with scripts)

### 4. Vitest coverage thresholds

Add `coverage.thresholds: { statements: 70, branches: 70, functions: 70, lines: 70 }` to all vitest configs.

Configs to update:
- `apps/web/vitest.unit.config.ts` — add thresholds
- `apps/web/vitest.integration.config.ts` — add thresholds
- `apps/desktop/vitest.config.ts` — keep existing (80/70/80/80 — already ≥70)
- `apps/desktop/vitest.unit.config.ts` — add thresholds
- `apps/desktop/vitest.integration.config.ts` — add thresholds
- `apps/daemon/vitest.config.ts` — add thresholds
- `packages/agent-core/vitest.config.ts` — add thresholds
- `packages/agent-core/mcp-tools/dev-browser/vitest.config.ts` — add thresholds
- `packages/agent-core/mcp-tools/dev-browser-mcp/vitest.config.ts` — add thresholds

Packages that need `@vitest/coverage-v8` in devDependencies (currently missing it):
- `apps/daemon`
- `packages/agent-core`
- `packages/agent-core/mcp-tools/dev-browser`
- `packages/agent-core/mcp-tools/dev-browser-mcp`

### 5. Husky hooks

**`.husky/pre-commit`** — v0.2.0 version:
```bash
FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|json|css|html|mjs)$' | tr '\n' ' ' || true)
if [ -n "$FILES" ]; then
  echo "Running Biome on staged files: $FILES"
  pnpm biome check --write $FILES && git add -- $FILES
fi
pnpm -r exec tsc --noEmit
```

**`.husky/pre-push`** — v0.2.0 version:
```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm test:coverage
pnpm test:integration
```

### 6. Files to delete

- `eslint.config.mjs`
- `.prettierrc`
- `.prettierignore`
- `.lintstagedrc.mjs`

### 7. AGENTS.md

Update the "Common Commands" section: replace `pnpm lint`, `pnpm lint:eslint`, `pnpm format:check`, `pnpm format` with `pnpm check` (`pnpm check` — Biome check + typecheck). Update the "Type checking & linting" header to "Validation".

Update "Verification After Changes":
- Replace `pnpm typecheck && pnpm lint:eslint && pnpm format:check` with `pnpm check`
- Replace `pnpm lint && pnpm format:check && pnpm -F @myboteam/web test && ...` with `pnpm check && pnpm -F @myboteam/web test && ...`

Update line 96: change "enforced by `curly` ESLint rule" to "enforced by Biome".

Add a new section below the E2E section: coverage commands (`pnpm test:coverage`, `pnpm -F @myboteam/desktop test:coverage`).

### 8. File ignores

Ensure `.gitignore` or `biome.json` `vcs.useIgnoreFile` handles:
- `dist/`, `dist-electron/`, `release/`, `node_modules/`
- `pnpm-lock.yaml`
- `playwright-report/`, `coverage/`
- Bundled/built artifacts (`**/public/theme-init.js`, `**/mcp-tools/dev-browser/server.mjs`, etc.)

The Biome `vcs.useIgnoreFile: true` setting will respect `.gitignore`, so explicit ignores in biome.json are supplementary.

## Packages NOT changed

- `pnpm-workspace.yaml` — no changes needed
- `apps/desktop/e2e/` — Playwright config uses its own linting
- CI workflows in `.github/` — may need separate update but out of scope for this spec
- `opencode.json` — no changes needed
