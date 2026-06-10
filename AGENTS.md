# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

This file provides general guidance for agents working with code in this repository.

## Project Overview

MyBoTeam is an AI automation assistant with a split architecture: `apps/web` contains the standalone React UI, `apps/desktop` is a thin Electron shell that loads web's build output, and `apps/daemon` is a long-lived background process that owns task execution. The daemon spawns `opencode serve` subprocesses and speaks to them via `@opencode-ai/sdk` to run user tasks. API keys are stored with AES-256-GCM encryption.

## Common Commands

```bash
# Development
pnpm dev                                        # Run desktop app in dev mode (web dev server + Electron)
pnpm dev:web                                    # Run web UI only (Vite dev server on localhost:5173)
pnpm dev:clean                                  # Dev mode with CLEAN_START=1 (clears stored data)

# Building
pnpm build                                      # Build all workspaces
pnpm build:web                                  # Build web UI only
pnpm build:desktop                              # Build desktop app (builds web first)

# Validation
pnpm check                                      # Biome check + typecheck (all workspaces)
pnpm typecheck                                  # TypeScript type validation (all workspaces)

# Testing (web workspace — renderer/UI tests)
pnpm -F @myboteam/web test                    # Run all web Vitest tests
pnpm -F @myboteam/web test:unit               # Web unit tests only
pnpm -F @myboteam/web test:integration        # Web integration tests only

# Testing (desktop workspace — main process + preload tests)
pnpm -F @myboteam/desktop test                # Run all desktop Vitest tests
pnpm -F @myboteam/desktop test:unit           # Desktop unit tests only
pnpm -F @myboteam/desktop test:integration    # Desktop integration tests only
pnpm -F @myboteam/desktop test:e2e            # Docker-based E2E tests
pnpm -F @myboteam/desktop test:e2e:native     # Native Playwright E2E tests (serial, Electron requirement)

# Testing (agent-core)
pnpm -F @myboteam/agent-core test          # Run agent-core Vitest tests

# Cleanup
pnpm clean                                      # Clean build outputs and node_modules
```

## Verification After Changes

Always verify before committing. Run the relevant commands for what you changed:

```bash
# After ANY code change — always run check
pnpm check

# After changing web UI code (components, pages, stores, styles)
pnpm -F @myboteam/web test

# After changing desktop main process or preload code
pnpm -F @myboteam/desktop test

# After changing agent-core code
pnpm -F @myboteam/agent-core test

# Full verification before PR
pnpm check && pnpm -F @myboteam/web test && pnpm -F @myboteam/desktop test && pnpm -F @myboteam/agent-core test
```

## Do NOT

- **Do NOT use `require()`** in agent-core — it is ESM (`"type": "module"`)
- **Do NOT forget `.js` extensions** on imports within agent-core (e.g., `import { foo } from './utils/bar.js'` NOT `./utils/bar`)
- **Do NOT use absolute paths for images** in the web UI — use ES module imports (see Image Assets below)
- **Do NOT modify released migration files** — create a new migration instead
- **Do NOT add root-level test scripts** — tests are workspace-scoped (`-F @myboteam/web`, `-F @myboteam/desktop`, or `-F @myboteam/agent-core`)
- **Do NOT spawn `npx`/`node`** without adding bundled Node.js bin to PATH (see [architecture.md](docs/architecture.md#spawning-npxnode-in-main-process))
- **Do NOT create source files over 200 lines** — split large files by class/function first, then by logical concern. Markdown/documentation files are exempt when a single cohesive document is clearer. Enforced for source files by Biome's `noExcessiveLinesPerFile` rule.

## Architecture

See [docs/architecture.md](docs/architecture.md) for full architecture details (monorepo layout, package structure, IPC flow, storage, bundled Node.js).

Key packages:

- `@myboteam/agent-core` — Core business logic, types, storage, MCP tools (ESM, internal workspace package)
- `@myboteam/web` — Standalone React UI (Vite + React Router + Zustand)
- `@myboteam/desktop` — Thin Electron shell (main process + preload), loads web's build output

## Code Conventions

- TypeScript everywhere (no JS for app logic)
- **ESM package**: `@myboteam/agent-core` uses `"type": "module"` — all imports MUST use `.js` extensions
- Shared types go in `packages/agent-core/src/common/types/`
- Core business logic goes in `packages/agent-core/src/`
- UI state via Zustand store actions (in `apps/web/src/client/stores/`)
- IPC handlers in `apps/desktop/src/main/ipc/handlers.ts` must match `window.myboteam` API in preload
- **Always use braces for `if`/`else`/`for`/`while`** - No single-line braceless statements (enforced by Biome)
- **Avoid nested ternaries** - Use mapper objects or if/else for readability
- **No unnecessary comments** - Don't add comments that restate what the code does. Comments should explain _why_, not _what_
- **Reuse UI components** - Check `apps/web/src/client/components/ui/` before creating new ones
- **One component per `.tsx` file** — shadcn/ui multi-component files are exempt
- **One class per `.ts` file** — tightly coupled error subclasses are exempt
- **Max 5 exported functions per `.ts` file** — types, interfaces, and non-function constants are excluded; group additional functions into separate files by logical concern

### Image Assets in Web UI

**IMPORTANT:** Always use ES module imports for images, never absolute paths.

```typescript
// CORRECT - Use ES imports
import logoImage from '/assets/logo.png';
<img src={logoImage} alt="Logo" />

// WRONG - Absolute paths break in packaged app
<img src="/assets/logo.png" alt="Logo" />
```

Static assets go in `apps/web/public/assets/`.

## Common Workflows

### Adding a New IPC Handler

1. Add the handler in `apps/desktop/src/main/ipc/handlers.ts`
2. Expose the method in `apps/desktop/src/preload/index.ts` via `contextBridge`
3. Add the typed wrapper in `apps/web/src/client/lib/myboteam.ts`
4. Use from components or `taskStore.ts`
5. Run `pnpm typecheck` to verify the chain matches

### Adding a New Migration

1. Create `packages/agent-core/src/storage/migrations/vXXX-description.ts` (use `.js` extension in imports)
2. Include executable `up` and `down` migration paths and tests for both directions
3. Import and add to the `migrations` array in `packages/agent-core/src/storage/migrations/index.ts`
4. Bump `CURRENT_VERSION` (see the `CURRENT_VERSION` export in `packages/agent-core/src/storage/migrations/index.ts` for the current value)
5. Run `pnpm -F @myboteam/agent-core test`

### Changing Agent-Core Public API

1. Add/modify the implementation in `packages/agent-core/src/`
2. Export from `packages/agent-core/src/index.ts` (or `common.ts` for shared types)
3. All internal imports must use `.js` extensions
4. Run `pnpm typecheck` to verify downstream consumers still compile

## TypeScript Path Aliases

### Web (`apps/web`)

```typescript
"@/*"                              → "src/client/*"
"@myboteam/agent-core"        → "../../packages/agent-core/src/index.ts"
"@myboteam/agent-core/*"      → "../../packages/agent-core/src/*"
"@myboteam/agent-core/common" → "../../packages/agent-core/src/common.ts"
```

### Desktop (`apps/desktop`)

```typescript
"@main/*"                          → "src/main/*"
"@myboteam/agent-core"        → "../../packages/agent-core/src/index.ts"
"@myboteam/agent-core/*"      → "../../packages/agent-core/src/*"
"@myboteam/agent-core/common" → "../../packages/agent-core/src/common.ts"
```

Note: Desktop no longer has `@/*` alias — UI code lives in `apps/web`.

## Environment Variables

- `CLEAN_START=1` - Clear all stored data on app start
- `E2E_SKIP_AUTH=1` - Skip onboarding flow (for testing)
- `E2E_MOCK_TASK_EVENTS=1` - Mock task events (for testing)
- `MYBOTEAM_BUNDLED_MCP=1` - Bundle MCP tools in packaged build (used in package/release scripts)

## Testing

### E2E Tests (Playwright)

- Config: `apps/desktop/e2e/playwright.config.ts`
- Tests: `apps/desktop/e2e/specs/`
- Page objects: `apps/desktop/e2e/pages/`
- Serial execution (Electron requirement)
- Docker support: `apps/desktop/e2e/docker/`

### Unit/Integration Tests (Vitest)

- Web config: `apps/web/vitest.unit.config.ts`, `apps/web/vitest.integration.config.ts`
- Desktop config: `apps/desktop/vitest.config.ts`
- Agent-core config: `packages/agent-core/vitest.config.ts`

## Styling

- Framework: Tailwind CSS + shadcn/ui
- CSS variables for theming
- Font: DM Sans
- Animation library: Framer Motion
- Reusable variants in `apps/web/src/client/lib/animations.ts`

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

- `ci.yml` - Core tests, unit tests, integration tests, typecheck, E2E
- `release.yml` - Desktop app build and publish to GitHub releases
- `commitlint.yml` - Conventional commit validation

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
