# Biome Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ESLint + Prettier with Biome, add coverage thresholds, and align husky hooks with v0.2.0.

**Architecture:** Single-root `biome.json` config covering all workspaces. Each package gets a simplified `check` script. Husky hooks are replaced with v0.2.0 equivalents. Coverage thresholds added to all vitest configs.

**Tech Stack:** Biome 2.x, Vitest 4.x with `@vitest/coverage-v8`, Husky 9.x, TypeScript 6.x

**Reference spec:** `docs/superpowers/specs/2025-04-16-biome-migration-design.md`

---

## Task 1: Create root `biome.json`

**Files:**
- Create: `biome.json`

- [ ] **Create `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.15/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": true,
    "includes": [
      "**",
      "!**/dist",
      "!**/dist-electron",
      "!**/node_modules",
      "!**/release",
      "!**/.pnpm-store",
      "!**/.worktrees",
      "!**/coverage",
      "!**/playwright-report"
    ]
  },
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "css": {
    "parser": {
      "tailwindDirectives": true
    }
  },
  "assist": { "actions": { "source": { "organizeImports": "on" } } },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noDebugger": "error",
        "noEmptyBlockStatements": "off",
        "noConsoleLog": "error"
      },
      "style": {
        "noDefaultExport": "error"
      },
      "correctness": {
        "noUnusedVariables": "error"
      }
    }
  },
  "overrides": [
    {
      "includes": ["**/__tests__/**", "**/*.test.ts", "**/*.test.tsx"],
      "linter": {
        "rules": {
          "suspicious": {
            "noExplicitAny": "off"
          },
          "correctness": {
            "noUnusedVariables": "off"
          },
          "style": {
            "noDefaultExport": "off"
          }
        }
      }
    },
    {
      "includes": ["**/tsup.config.ts", "**/vitest.config.ts", "**/vitest.integration.config.ts", "**/vitest.unit.config.ts"],
      "linter": {
        "rules": {
          "style": {
            "noDefaultExport": "off"
          }
        }
      }
    },
    {
      "includes": [
        "**/postcss.config.*",
        "**/tailwind.config.*",
        "**/vite.config.*",
        "**/electron-vite.config.*",
        "**/playwright.config.*"
      ],
      "linter": {
        "rules": {
          "style": {
            "noDefaultExport": "off"
          }
        }
      }
    },
    {
      "includes": ["**/*.html"],
      "linter": {
        "rules": {
          "correctness": {
            "noUnusedVariables": "off",
            "noInnerDeclarations": "off"
          }
        }
      }
    },
    {
      "includes": ["**/*.css"],
      "linter": {
        "rules": {
          "suspicious": {
            "noUnknownAtRules": "off"
          }
        }
      }
    },
    {
      "includes": ["apps/desktop/src/main/**/*.ts", "apps/desktop/src/preload/**/*.ts"],
      "linter": {
        "rules": {
          "suspicious": {
            "noConsoleLog": "off"
          }
        }
      }
    },
    {
      "includes": ["**/scripts/**/*.cjs", "**/scripts/**/*.mjs"],
      "formatter": { "enabled": false },
      "linter": { "enabled": false }
    },
    {
      "includes": ["**/public/theme-init.js", "**/mcp-tools/dev-browser/server.cjs", "**/mcp-tools/dev-browser/server.mjs", "**/mcp-tools/dev-browser/.browser-data/**"],
      "formatter": { "enabled": false },
      "linter": { "enabled": false }
    }
  ],
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingCommas": "all"
    }
  }
}
```

- [ ] **Commit**

```bash
git add biome.json
git commit -m "feat: add Biome config"
```

---

## Task 2: Update root `package.json`

**Files:**
- Modify: `package.json`

- [ ] **Update root scripts and deps**

Replace the scripts section and devDependencies:

```json
{
  "scripts": {
    "predev": "node scripts/predev.cjs",
    "dev": "node scripts/dev.cjs",
    "predev:check": "node scripts/predev.cjs",
    "dev:check": "node scripts/dev.cjs --check",
    "predev:clean": "node scripts/predev.cjs",
    "dev:clean": "node scripts/dev.cjs --clean",
    "predev:clean:check": "node scripts/predev.cjs",
    "dev:clean:check": "node scripts/dev.cjs --clean --check",
    "dev:kill": "node scripts/dev-kill.cjs",
    "dev:remote": "node scripts/dev-remote.cjs",
    "postinstall": "node scripts/save-lockfile-hash.cjs",
    "build": "pnpm -r --workspace-concurrency=1 build",
    "build:desktop": "pnpm -F @myboteam/desktop build",
    "dev:web": "pnpm -F @myboteam/web dev",
    "build:web": "pnpm -F @myboteam/web build",
    "test:web": "pnpm -F @myboteam/web test",
    "test:web:unit": "pnpm -F @myboteam/web test:unit",
    "test:web:integration": "pnpm -F @myboteam/web test:integration",
    "check": "biome check --write apps packages && pnpm -r exec tsc --noEmit",
    "typecheck": "pnpm -r exec tsc --noEmit",
    "test:coverage": "pnpm -r --parallel run test:coverage",
    "clean": "pnpm -r clean && rm -rf node_modules",
    "prepare": "husky"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.4.16",
    "husky": "^9.1.7",
    "wait-on": "^9.0.4"
  }
}
```

Remove these devDependencies entirely: `@eslint/js`, `eslint`, `eslint-config-prettier`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `globals`, `prettier`, `typescript-eslint`, `lint-staged`.

Keep the `"pnpm"` overrides block — those are security patches unrelated to linting.

- [ ] **Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: replace ESLint/Prettier with Biome in root package.json"
```

---

## Task 3: Update per-package `package.json` scripts (apps)

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/desktop/package.json`
- Modify: `apps/daemon/package.json`

**Note:** The `lint` script in some packages currently does `tsc --noEmit` — this is already covered by the `check` script's `&& tsc --noEmit` suffix.

- [ ] **Update `apps/web/package.json` scripts**

Replace:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -p tsconfig.client.json --noEmit && vite build",
  "typecheck": "tsc -p tsconfig.client.json --noEmit",
  "lint": "tsc -p tsclient.config.client.json --noEmit",
  "preview": "vite preview",
  "test": "vitest run --config vitest.unit.config.ts && vitest run --config vitest.integration.config.ts",
  "test:unit": "vitest run --config vitest.unit.config.ts",
  "test:integration": "vitest run --config vitest.integration.config.ts",
  "test:watch": "vitest watch"
}
```

With:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -p tsconfig.client.json --noEmit && vite build",
  "check": "biome check --write . && tsc -p tsconfig.client.json --noEmit",
  "preview": "vite preview",
  "test": "vitest run --config vitest.unit.config.ts && vitest run --config vitest.integration.config.ts",
  "test:unit": "vitest run --config vitest.unit.config.ts",
  "test:integration": "vitest run --config vitest.integration.config.ts",
  "test:watch": "vitest watch",
  "test:coverage": "vitest run --coverage --config vitest.unit.config.ts"
}
```

- [ ] **Update `apps/desktop/package.json` scripts**

Remove `lint` and `typecheck` scripts. Add `check` and `test:coverage`:

Replace the scripts section - remove lines `"lint": "tsc --noEmit",` and `"typecheck": "tsc --noEmit",`. Add:
```json
"check": "biome check --write . && tsc --noEmit",
```

Also add `test:coverage` if not present:
```json
"test:coverage": "vitest run --coverage",
```

- [ ] **Update `apps/daemon/package.json` scripts**

Remove `lint` and `typecheck` scripts. Add `check`:
```json
"check": "biome check --write . && tsc --noEmit",
```

Add `test:coverage`:
```json
"test:coverage": "vitest run --coverage",
```

Also add `@vitest/coverage-v8` to `apps/daemon` devDependencies:
```json
"devDependencies": {
  "@vitest/coverage-v8": "^4.1.0",
  ...
}
```

- [ ] **Commit**

```bash
git add apps/web/package.json apps/desktop/package.json apps/daemon/package.json
git commit -m "feat: update app workspace scripts for Biome"
```

---

## Task 4: Update per-package `package.json` scripts (agent-core + mcp-tools)

**Files:**
- Modify: `packages/agent-core/package.json`
- Modify: `packages/agent-core/mcp-tools/dev-browser/package.json`
- Modify: `packages/agent-core/mcp-tools/dev-browser-mcp/package.json`

- [ ] **Update `packages/agent-core/package.json`**

Remove `typecheck` script. Add `check` and `test:coverage`:
```json
"scripts": {
  "build": "tsc",
  "dev": "tsc --watch",
  "check": "biome check --write . && tsc --noEmit",
  "test": "vitest",
  "test:coverage": "vitest --coverage"
}
```

Add `@vitest/coverage-v8` to devDependencies:
```json
"devDependencies": {
  "@vitest/coverage-v8": "^4.1.0",
  ...
}
```

- [ ] **Update `packages/agent-core/mcp-tools/dev-browser/package.json`**

Add `check` and `test:coverage` scripts:
```json
"scripts": {
  "check": "biome check --write . && tsc --noEmit",
  "test:coverage": "vitest run --coverage",
  ...
}
```

Add `@vitest/coverage-v8` to devDependencies:
```json
"devDependencies": {
  "@vitest/coverage-v8": "^4.1.0",
  ...
}
```

- [ ] **Update `packages/agent-core/mcp-tools/dev-browser-mcp/package.json`**

Add `check` and `test:coverage` scripts:
```json
"scripts": {
  "check": "biome check --write . && tsc --noEmit",
  "test:coverage": "vitest run --coverage",
  ...
}
```

Add `@vitest/coverage-v8` to devDependencies:
```json
"devDependencies": {
  "@vitest/coverage-v8": "^4.1.0",
  ...
}
```

- [ ] **Commit**

```bash
git add packages/agent-core/package.json packages/agent-core/mcp-tools/dev-browser/package.json packages/agent-core/mcp-tools/dev-browser-mcp/package.json
git commit -m "feat: update agent-core and mcp-tools scripts for Biome"
```

---

## Task 5: Add coverage thresholds to vitest configs

**Files:**
- Modify: `apps/web/vitest.unit.config.ts`
- Modify: `apps/web/vitest.integration.config.ts`
- Modify: `apps/daemon/vitest.config.ts`
- Modify: `packages/agent-core/vitest.config.ts`
- Modify: `packages/agent-core/mcp-tools/dev-browser/vitest.config.ts`
- Modify: `packages/agent-core/mcp-tools/dev-browser-mcp/vitest.config.ts`
- No change: `apps/desktop/vitest.config.ts` (already has thresholds ≥70)
- No change: `apps/desktop/vitest.unit.config.ts`, `apps/desktop/vitest.integration.config.ts`

- [ ] **Update `apps/web/vitest.unit.config.ts`**

Add coverage block inside the `test` object:
```typescript
test: {
  name: 'unit',
  globals: true,
  root: __dirname,
  include: ['__tests__/**/*.unit.test.{ts,tsx}'],
  setupFiles: ['__tests__/setup.ts'],
  environment: 'jsdom',
  testTimeout: 5000,
  hookTimeout: 10000,
  coverage: {
    provider: 'v8',
    reporter: ['text', 'lcov'],
    thresholds: { statements: 70, branches: 70, functions: 70, lines: 70 },
  },
},
```

- [ ] **Update `apps/web/vitest.integration.config.ts`**

Add coverage block:
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov'],
  thresholds: { statements: 70, branches: 70, functions: 70, lines: 70 },
},
```

- [ ] **Update `apps/daemon/vitest.config.ts`**

Add coverage block inside `test`:
```typescript
test: {
  globals: true,
  root: __dirname,
  include: ['__tests__/**/*.test.ts'],
  exclude: ['**/node_modules/**', '**/dist/**'],
  environment: 'node',
  testTimeout: 5000,
  hookTimeout: 10000,
  coverage: {
    provider: 'v8',
    reporter: ['text', 'lcov'],
    thresholds: { statements: 70, branches: 70, functions: 70, lines: 70 },
  },
},
```

- [ ] **Update `packages/agent-core/vitest.config.ts`**

Add thresholds to existing coverage block:
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  include: ['src/**/*.ts'],
  exclude: ['src/**/*.d.ts', 'src/**/index.ts'],
  thresholds: { statements: 70, branches: 70, functions: 70, lines: 70 },
},
```

- [ ] **Update `packages/agent-core/mcp-tools/dev-browser/vitest.config.ts`**

Add coverage block:
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov'],
  thresholds: { statements: 70, branches: 70, functions: 70, lines: 70 },
},
```

- [ ] **Update `packages/agent-core/mcp-tools/dev-browser-mcp/vitest.config.ts`**

Add coverage block:
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov'],
  thresholds: { statements: 70, branches: 70, functions: 70, lines: 70 },
},
```

- [ ] **Commit**

```bash
git add apps/web/vitest.unit.config.ts apps/web/vitest.integration.config.ts apps/daemon/vitest.config.ts packages/agent-core/vitest.config.ts packages/agent-core/mcp-tools/dev-browser/vitest.config.ts packages/agent-core/mcp-tools/dev-browser-mcp/vitest.config.ts
git commit -m "feat: add 70% coverage thresholds to all vitest configs"
```

---

## Task 6: Replace `.husky/pre-commit`

**Files:**
- Modify: `.husky/pre-commit`

- [ ] **Replace `.husky/pre-commit`**

Current content: `lint-staged`

New content:
```bash
FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|json|css|html|mjs)$' | tr '\n' ' ' || true)
if [ -n "$FILES" ]; then
  echo "Running Biome on staged files: $FILES"
  pnpm biome check --write $FILES && git add -- $FILES
fi
pnpm -r exec tsc --noEmit
```

- [ ] **Make executable and commit**

```bash
chmod +x .husky/pre-commit
git add .husky/pre-commit
git commit -m "feat: update pre-commit hook to use Biome"
```

---

## Task 7: Replace `.husky/pre-push`

**Files:**
- Modify: `.husky/pre-push`

- [ ] **Replace `.husky/pre-push`**

Replace entire file with:
```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm test:coverage
pnpm test:integration
```

- [ ] **Make executable and commit**

```bash
chmod +x .husky/pre-push
git add .husky/pre-push
git commit -m "feat: update pre-push hook to match v0.2.0"
```

---

## Task 8: Delete old ESLint/Prettier/lint-staged configs

**Files:**
- Delete: `eslint.config.mjs`
- Delete: `.prettierrc`
- Delete: `.prettierignore`
- Delete: `.lintstagedrc.mjs`

- [ ] **Delete config files and update `.gitignore` if needed**

```bash
git rm eslint.config.mjs .prettierrc .prettierignore .lintstagedrc.mjs
git commit -m "chore: remove ESLint, Prettier, and lint-staged configs"
```

---

## Task 9: Update `AGENTS.md`

**Files:**
- Modify: `AGENTS.md`

- [ ] **Update "Common Commands" section**

Replace:
```text
# Type checking & linting
pnpm lint                                       # TypeScript + ESLint (all workspaces)
pnpm typecheck                                  # Type validation (all workspaces)
pnpm lint:eslint                                # ESLint only (flat config)
pnpm format:check                               # Prettier check (no writes)
pnpm format                                     # Prettier write (auto-fix)
```

With:
```text
# Validation
pnpm check                                      # Biome check + typecheck (all workspaces)
pnpm typecheck                                  # TypeScript type validation (all workspaces)
```

- [ ] **Update "Verification After Changes" section**

Replace:
```text
# After ANY code change — always run typecheck + lint
pnpm typecheck && pnpm lint:eslint && pnpm format:check
```

With:
```text
# After ANY code change — always run check
pnpm check
```

Replace:
```text
# Full verification before PR
pnpm lint && pnpm format:check && pnpm -F @myboteam/web test && pnpm -F @myboteam/desktop test && pnpm -F @myboteam/agent-core test
```

With:
```text
# Full verification before PR
pnpm check && pnpm -F @myboteam/web test && pnpm -F @myboteam/desktop test && pnpm -F @myboteam/agent-core test
```

Also add coverage testing section:
```text
# Full verification before PR
pnpm check && pnpm -F @myboteam/web test && pnpm -F @myboteam/desktop test && pnpm -F @myboteam/agent-core test

# Coverage
pnpm test:coverage                             # Run all workspace tests with coverage
pnpm -F @myboteam/desktop test:coverage         # Desktop test coverage
```

- [ ] **Update line referencing ESLint rule**

Change line 96 from:
```text
- **Always use braces for `if`/`else`/`for`/`while`** - No single-line braceless statements (enforced by `curly` ESLint rule)
```
To:
```text
- **Always use braces for `if`/`else`/`for`/`while`** - No single-line braceless statements (enforced by Biome)
```

- [ ] **Commit**

```bash
git add AGENTS.md
git commit -m "docs: update AGENTS.md for Biome migration"
```

---

## Task 10: Install dependencies and verify

- [ ] **Install dependencies**

```bash
pnpm install
```

Expected: `@biomejs/biome` installed, eslint/prettier packages removed from lockfile.

- [ ] **Run Biome check on the codebase**

```bash
pnpm biome check --write apps packages
```

Expected: Biome formats and lints all files. Some warnings/errors may appear — note them but don't block on pre-existing issues.

- [ ] **Run typecheck**

```bash
pnpm typecheck
```

Expected: TypeScript compiles without errors across all workspaces.

- [ ] **Run full check**

```bash
pnpm check
```

Expected: Biome + tsc pass cleanly.

- [ ] **Run tests to verify coverage configs don't break**

```bash
pnpm -F @myboteam/web test:unit
pnpm -F @myboteam/desktop test:unit
pnpm -F @myboteam/agent-core test
```

Expected: Tests pass with coverage thresholds enabled.

- [ ] **Commit any remaining fixes**

```bash
git add -A
git commit -m "chore: post-migration fixes and dependency updates"
```

---

## Task 11: Final verification and cleanup

- [ ] **Run the full verification suite**

```bash
pnpm check && pnpm -F @myboteam/web test:unit && pnpm -F @myboteam/desktop test:unit && pnpm -F @myboteam/agent-core test
```

Expected: All checks pass.

- [ ] **Verify no ESLint or Prettier configs remain**

```bash
ls -la eslint* .prettier* .lintstagedrc* 2>/dev/null && echo "FOUND" || echo "OK - configs removed"
```

Expected: `OK - configs removed`

- [ ] **Do a final commit if any changes remain**

```bash
git status
```
