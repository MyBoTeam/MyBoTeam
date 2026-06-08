# Remove LLM Gateway Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) for tracking.

**Goal:** Remove `@myboteam/llm-gateway-client` and all `myboteam-ai` provider code across web UI, desktop IPC, daemon services, and agent-core types.

**Architecture:** Top-down removal — web UI (consumer) first, then desktop IPC, then daemon services, then agent-core types/definitions (dependencies). Each layer verified with typecheck before proceeding.

**Tech Stack:** TypeScript, React (web), Electron (desktop), Node.js (daemon), ESM

---

## File Structure

### Delete
- `apps/web/src/client/hooks/useCreditsState.ts`
- `apps/web/src/client/pages/settings/providers/components/providers/useMyboteamAiConnect.ts`
- `apps/web/src/client/pages/settings/providers/components/providers/MyboteamAiProviderForm.tsx`
- `apps/web/src/client/pages/settings/providers/components/providers/myboteam-ai-utils.tsx`
- `apps/desktop/src/main/ipc/handlers/provider-config-handlers/myboteam-ai-handlers.ts`
- `apps/desktop/src/main/ipc/handlers/provider-config-handlers/myboteam-ai-usage-handlers.ts`
- `apps/desktop/src/main/ipc/handlers/provider-config-handlers/myboteam-ai-utils.ts`
- `apps/daemon/src/types/gateway-client.d.ts`
- `packages/agent-core/src/common/types/gateway.ts`
- `packages/agent-core/src/opencode/myboteam-runtime.ts`
- `packages/agent-core/src/opencode/config-providers-myboteam.ts`
- `packages/agent-core/src/myboteam-runtime-types.ts`
- `packages/agent-core/tests/unit/opencode/myboteam-runtime.test.ts`
- `apps/web/__tests__/unit/renderer/hooks/useCreditsState.hook.unit.test.ts`

### Modify
- `apps/web/src/client/config/myboteam-types.ts`
- `apps/web/src/client/pages/settings/providers/components/ProviderGrid.tsx`
- `apps/web/src/client/pages/settings/providers/components/ProviderFormSelector.tsx`
- `apps/web/src/client/utils/provider-logos.ts`
- `apps/desktop/src/main/config/build-config-load.ts`
- `apps/desktop/src/main/config/build-config-checks.ts`
- `apps/desktop/src/main/config/build-config.ts`
- `apps/desktop/src/main/daemon/daemon-connector-transport.ts`
- `apps/desktop/src/main/app-startup-init.ts`
- `apps/desktop/src/main/ipc/handlers/settings-handlers.ts`
- `apps/desktop/src/main/daemon-bootstrap-config.ts`
- `apps/desktop/src/preload/handlers/services.ts`
- `apps/daemon/src/app-config.ts`
- `apps/daemon/tsup.config.ts`
- `apps/daemon/src/index.ts`
- `apps/daemon/src/app-setup.ts`
- `apps/daemon/src/task-service.ts`
- `apps/daemon/src/task-config-builder.ts`
- `apps/daemon/src/task-service-events.ts`
- `apps/daemon/src/opencode/server-config.ts`
- `apps/daemon/src/daemon-routes.ts`
- `apps/daemon/src/daemon-routes-misc.ts`
- `packages/agent-core/src/opencode/config-builder.ts`
- `packages/agent-core/src/opencode/resolve-task-config.ts`
- `packages/agent-core/src/index.ts`
- `packages/agent-core/src/common/index.ts`
- `packages/agent-core/src/common.ts`
- `packages/agent-core/src/desktop-main.ts`
- `packages/agent-core/src/types/storage/repository-types.ts`
- `packages/agent-core/src/storage/repositories/myboteam-ai-credits.ts`
- `packages/agent-core/src/common/types/daemon/method-map.ts`
- `packages/agent-core/src/common/types/daemon/method-map-extras.ts`
- `packages/agent-core/src/common/types/daemon/event-types.ts`
- `apps/desktop/__tests__/unit/main/config/build-config.unit.test.ts`
- `apps/desktop/__tests__/unit/main/updater.unit.test.ts`
- `apps/desktop/__tests__/unit/main/updater.manual-manifest.unit.test.ts`
- `apps/daemon/__tests__/unit/task-service-parity.test.ts`

---

### Task 1: Web UI — Delete provider files

**Files:**
- Delete: `apps/web/src/client/hooks/useCreditsState.ts`
- Delete: `apps/web/src/client/pages/settings/providers/components/providers/useMyboteamAiConnect.ts`
- Delete: `apps/web/src/client/pages/settings/providers/components/providers/MyboteamAiProviderForm.tsx`
- Delete: `apps/web/src/client/pages/settings/providers/components/providers/myboteam-ai-utils.tsx`

- [ ] **Step 1: Delete the four files**

```bash
rm apps/web/src/client/hooks/useCreditsState.ts
rm apps/web/src/client/pages/settings/providers/components/providers/useMyboteamAiConnect.ts
rm apps/web/src/client/pages/settings/providers/components/providers/MyboteamAiProviderForm.tsx
rm apps/web/src/client/pages/settings/providers/components/providers/myboteam-ai-utils.tsx
```

- [ ] **Step 2: Verify deletion**

```bash
ls apps/web/src/client/hooks/useCreditsState.ts 2>&1 || echo "Confirmed deleted"
ls apps/web/src/client/pages/settings/providers/components/providers/useMyboteamAiConnect.ts 2>&1 || echo "Confirmed deleted"
ls apps/web/src/client/pages/settings/providers/components/providers/MyboteamAiProviderForm.tsx 2>&1 || echo "Confirmed deleted"
ls apps/web/src/client/pages/settings/providers/components/providers/myboteam-ai-utils.tsx 2>&1 || echo "Confirmed deleted"
```

- [ ] **Step 3: Remove unused imports for CreditUsage in web files (check if any remain)**

After deletion, run `pnpm typecheck -F @myboteam/web` to find remaining references to deleted files/types.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(web): remove myboteam-ai provider UI files"
```

---

### Task 2: Web UI — Edit remaining files

**Files:**
- Modify: `apps/web/src/client/config/myboteam-types.ts`
- Modify: `apps/web/src/client/pages/settings/providers/components/ProviderGrid.tsx`
- Modify: `apps/web/src/client/pages/settings/providers/components/ProviderFormSelector.tsx`
- Modify: `apps/web/src/client/utils/provider-logos.ts`

- [ ] **Step 1: Read and edit myboteam-types.ts**

Remove `MyboteamAiUsageData`, `MyboteamAiStatusData`, `BuildCapabilitiesData` types.

In `apps/web/src/client/config/myboteam-types.ts`, remove these interfaces:
```typescript
export interface MyboteamAiUsageData {
  connected: boolean;
  usage: CreditUsage | null;
  checkCount: number;
}

export interface MyboteamAiStatusData {
  status: "disconnected" | "connected" | "checking" | "exhausted" | "error";
  message: string;
}

export interface BuildCapabilitiesData {
  hasFreeMode: boolean;
}
```

Also remove `CreditUsage` import if `CreditUsage` becomes unused.

- [ ] **Step 2: Read and edit ProviderGrid.tsx**

Remove `'myboteam-ai'` from the provider list/filter array in `ProviderGrid.tsx`.

- [ ] **Step 3: Read and edit ProviderFormSelector.tsx**

Remove the `case 'myboteam-ai'` block from the provider form selector.

- [ ] **Step 4: Read and edit provider-logos.ts**

Remove the `'myboteam-ai'` logo entry.

- [ ] **Step 5: Run typecheck to verify**

```bash
pnpm -F @myboteam/web typecheck
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(web): remove myboteam-ai provider references from config and components"
```

---

### Task 3: Desktop — Delete IPC handler files and edit preload

**Files:**
- Delete: `apps/desktop/src/main/ipc/handlers/provider-config-handlers/myboteam-ai-handlers.ts`
- Delete: `apps/desktop/src/main/ipc/handlers/provider-config-handlers/myboteam-ai-usage-handlers.ts`
- Delete: `apps/desktop/src/main/ipc/handlers/provider-config-handlers/myboteam-ai-utils.ts`
- Modify: `apps/desktop/src/preload/handlers/services.ts`

- [ ] **Step 1: Delete the three IPC handler files**

```bash
rm apps/desktop/src/main/ipc/handlers/provider-config-handlers/myboteam-ai-handlers.ts
rm apps/desktop/src/main/ipc/handlers/provider-config-handlers/myboteam-ai-usage-handlers.ts
rm apps/desktop/src/main/ipc/handlers/provider-config-handlers/myboteam-ai-utils.ts
```

- [ ] **Step 2: Edit preload services.ts**

In `apps/desktop/src/preload/handlers/services.ts`, remove:
- `myboteamAiConnect` function
- `myboteamAiEnsureReady` function
- `myboteamAiDisconnect` function
- `myboteamAiGetUsage` function
- `myboteamAiGetStatus` function
- `onMyboteamAiUsageUpdate` function
- Their respective `expose()` calls

- [ ] **Step 3: Run typecheck**

```bash
pnpm -F @myboteam/desktop typecheck
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(desktop): remove myboteam-ai IPC handlers and preload API"
```

---

### Task 4: Desktop — Edit build config and daemon wiring

**Files:**
- Modify: `apps/desktop/src/main/config/build-config-load.ts`
- Modify: `apps/desktop/src/main/config/build-config-checks.ts`
- Modify: `apps/desktop/src/main/config/build-config.ts`
- Modify: `apps/desktop/src/main/daemon/daemon-connector-transport.ts`
- Modify: `apps/desktop/src/main/app-startup-init.ts`
- Modify: `apps/desktop/src/main/ipc/handlers/settings-handlers.ts`
- Modify: `apps/desktop/src/main/daemon-bootstrap-config.ts`

- [ ] **Step 1: Edit build-config-load.ts**

Remove `myboteamGatewayUrl` from the build config schema, environment variable loading, and the `BuildConfig` type.

- [ ] **Step 2: Edit build-config-checks.ts**

Remove the `isFreeMode()` function entirely.

- [ ] **Step 3: Edit build-config.ts**

Remove the `isFreeMode` export.

- [ ] **Step 4: Edit daemon-connector-transport.ts**

Remove the `MYBOTEAM_GATEWAY_URL` environment variable pass-through to the spawned daemon process.

- [ ] **Step 5: Edit app-startup-init.ts**

Remove the `isFreeMode` import and the conditional block that removes stale `myboteam-ai` provider on startup.

- [ ] **Step 6: Edit settings-handlers.ts**

Remove `hasFreeMode` from the capabilities response in the settings handler.

- [ ] **Step 7: Edit daemon-bootstrap-config.ts**

Remove the notification forwarding for `myboteam-ai.usage-update` from daemon to renderer.

- [ ] **Step 8: Run typecheck**

```bash
pnpm -F @myboteam/desktop typecheck
```

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat(desktop): remove myboteamGatewayUrl, isFreeMode, and myboteam-ai daemon wiring"
```

---

### Task 5: Daemon — Remove gateway client loading

**Files:**
- Delete: `apps/daemon/src/types/gateway-client.d.ts`
- Modify: `apps/daemon/src/app-config.ts`
- Modify: `apps/daemon/tsup.config.ts`
- Modify: `apps/daemon/src/index.ts`

- [ ] **Step 1: Delete the .d.ts file**

```bash
rm apps/daemon/src/types/gateway-client.d.ts
```

- [ ] **Step 2: Edit app-config.ts**

Remove the `loadOptionalRuntime()` function entirely. Remove the `setProxyTaskId` export/wiring.

- [ ] **Step 3: Edit tsup.config.ts**

Remove `'@myboteam/llm-gateway-client'` from the `external` array.

- [ ] **Step 4: Edit index.ts**

Remove the `loadOptionalRuntime()` call. Remove `myboteamRuntime` and `setProxyTaskId` from `BootConfig`.

- [ ] **Step 5: Run typecheck**

```bash
pnpm -F @myboteam/daemon typecheck
```

Wait — daemon may not have a typecheck script. Run `pnpm typecheck` at root to catch errors across all packages.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(daemon): remove llm-gateway-client dynamic loading and module declaration"
```

---

### Task 6: Daemon — Remove myboteamRuntime from services

**Files:**
- Modify: `apps/daemon/src/app-setup.ts`
- Modify: `apps/daemon/src/task-service.ts`
- Modify: `apps/daemon/src/task-config-builder.ts`
- Modify: `apps/daemon/src/task-service-events.ts`
- Modify: `apps/daemon/src/opencode/server-config.ts`

- [ ] **Step 1: Edit app-setup.ts**

Remove `myboteamRuntime` parameter from `createServices()`, `registerRoutes()`, `bootDaemon()`, `BootConfig`, and `BootResult`.

- [ ] **Step 2: Edit task-service.ts**

Remove `myboteamRuntime` from `TaskServiceOptions` and the `TaskService` constructor/class.

- [ ] **Step 3: Edit task-config-builder.ts**

Remove `myboteamRuntime` from `TaskConfigBuilderOptions`.

- [ ] **Step 4: Edit task-service-events.ts**

Remove `myboteamRuntime` from `TaskServiceOptions`.

- [ ] **Step 5: Edit server-config.ts**

Remove `myboteamRuntime` from `ServerManagerDeps`.

- [ ] **Step 6: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(daemon): remove myboteamRuntime from service layer"
```

---

### Task 7: Daemon — Remove RPC handlers

**Files:**
- Modify: `apps/daemon/src/daemon-routes.ts`
- Modify: `apps/daemon/src/daemon-routes-misc.ts`

- [ ] **Step 1: Edit daemon-routes.ts**

Remove `myboteamRuntime` from `RouteServices`.

- [ ] **Step 2: Edit daemon-routes-misc.ts**

Remove all four RPC handlers:
- `myboteam-ai.connect`
- `myboteam-ai.get-usage`
- `myboteam-ai.disconnect`
- `myboteam-ai.usage-update` notification

Remove the `MyboteamRuntime` import if it becomes unused.

- [ ] **Step 3: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(daemon): remove myboteam-ai RPC handlers"
```

---

### Task 8: Agent-Core — Delete type/interface files

**Files:**
- Delete: `packages/agent-core/src/common/types/gateway.ts`
- Delete: `packages/agent-core/src/opencode/myboteam-runtime.ts`
- Delete: `packages/agent-core/src/opencode/config-providers-myboteam.ts`
- Delete: `packages/agent-core/src/myboteam-runtime-types.ts`
- Delete: `packages/agent-core/tests/unit/opencode/myboteam-runtime.test.ts`

- [ ] **Step 1: Delete the files**

```bash
rm packages/agent-core/src/common/types/gateway.ts
rm packages/agent-core/src/opencode/myboteam-runtime.ts
rm packages/agent-core/src/opencode/config-providers-myboteam.ts
rm packages/agent-core/src/myboteam-runtime-types.ts
rm packages/agent-core/tests/unit/opencode/myboteam-runtime.test.ts
```

- [ ] **Step 2: Verify deletion**

```bash
ls packages/agent-core/src/common/types/gateway.ts 2>&1 || echo "Confirmed deleted"
ls packages/agent-core/src/opencode/myboteam-runtime.ts 2>&1 || echo "Confirmed deleted"
ls packages/agent-core/src/opencode/config-providers-myboteam.ts 2>&1 || echo "Confirmed deleted"
ls packages/agent-core/src/myboteam-runtime-types.ts 2>&1 || echo "Confirmed deleted"
```

- [ ] **Step 3: Run typecheck**

Expect failures since exports still reference these files. This is expected.

```bash
pnpm typecheck 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(agent-core): delete myboteam runtime types and interfaces"
```

---

### Task 9: Agent-Core — Edit config builder and resolver

**Files:**
- Modify: `packages/agent-core/src/opencode/config-builder.ts`
- Modify: `packages/agent-core/src/opencode/resolve-task-config.ts`

- [ ] **Step 1: Edit config-builder.ts**

Remove:
- `import { buildMyboteamAiConfig } from './config-providers-myboteam.js'` (or similar)
- `myboteamRuntime` from `BuildProviderConfigsOptions` interface
- `myboteamStorageDeps` from options destructuring
- `myboteamRuntime` in the context object
- `buildMyboteamAiConfig(ctx)` from the `Promise.all` array

- [ ] **Step 2: Edit resolve-task-config.ts**

Remove:
- `myboteamRuntime` and `myboteamStorageDeps` from `ResolveTaskConfigOptions`
- Their destructuring
- Their passing to `buildProviderConfigs`

- [ ] **Step 3: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(agent-core): remove myboteam config builder integration"
```

---

### Task 10: Agent-Core — Edit method/event maps and storage

**Files:**
- Modify: `packages/agent-core/src/common/types/daemon/method-map.ts`
- Modify: `packages/agent-core/src/common/types/daemon/method-map-extras.ts`
- Modify: `packages/agent-core/src/common/types/daemon/event-types.ts`
- Modify: `packages/agent-core/src/types/storage/repository-types.ts`
- Modify: `packages/agent-core/src/storage/repositories/myboteam-ai-credits.ts`

- [ ] **Step 1: Edit method-map.ts**

Remove the `myboteam-ai` method entries:
```typescript
'myboteam-ai.connect': ...
'myboteam-ai.get-usage': ...
'myboteam-ai.disconnect': ...
```

- [ ] **Step 2: Edit method-map-extras.ts**

Remove `CreditUsage` import if it becomes unused.

- [ ] **Step 3: Edit event-types.ts**

Remove `'myboteam-ai.usage-update'` from the event type map.

- [ ] **Step 4: Edit repository-types.ts**

Remove `CreditUsage` import if it becomes unused.

- [ ] **Step 5: Edit myboteam-ai-credits.ts**

Delete the file's contents and replace with a minimal export, or delete the file entirely if it has no other purpose. Check if this is a storage repository implementation — if so, remove the entire file and its registration.

- [ ] **Step 6: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(agent-core): remove myboteam-ai from method maps, events, and storage"
```

---

### Task 11: Agent-Core — Edit exports

**Files:**
- Modify: `packages/agent-core/src/index.ts`
- Modify: `packages/agent-core/src/common/index.ts`
- Modify: `packages/agent-core/src/common.ts`
- Modify: `packages/agent-core/src/desktop-main.ts`

- [ ] **Step 1: Edit index.ts**

Remove exports:
- `MyboteamRuntime`
- `noopRuntime`
- `CreditUsage`

Keep `buildProviderConfigs` — it still orchestrates other (non-myboteam) provider configs.

Also remove any imports of the deleted modules from index.ts.

- [ ] **Step 2: Edit common/index.ts**

Remove `CreditUsage` export.

- [ ] **Step 3: Edit common.ts**

Remove `CreditUsage` export.

- [ ] **Step 4: Edit desktop-main.ts**

Remove `CreditUsage` export.

- [ ] **Step 5: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(agent-core): remove myboteam-ai from public exports"
```

---

### Task 12: Update tests

**Files:**
- Delete: `apps/web/__tests__/unit/renderer/hooks/useCreditsState.hook.unit.test.ts`
- Modify: `apps/desktop/__tests__/unit/main/config/build-config.unit.test.ts`
- Modify: `apps/desktop/__tests__/unit/main/updater.unit.test.ts`
- Modify: `apps/desktop/__tests__/unit/main/updater.manual-manifest.unit.test.ts`
- Modify: `apps/daemon/__tests__/unit/task-service-parity.test.ts`

- [ ] **Step 1: Delete web credits test**

```bash
rm apps/web/__tests__/unit/renderer/hooks/useCreditsState.hook.unit.test.ts
```

- [ ] **Step 2: Edit build-config.unit.test.ts**

Remove any test cases referencing `MYBOTEAM_GATEWAY_URL` or `myboteamGatewayUrl`.

- [ ] **Step 3: Edit updater.unit.test.ts**

Remove `myboteamGatewayUrl: ''` from mock config objects.

- [ ] **Step 4: Edit updater.manual-manifest.unit.test.ts**

Remove `myboteamGatewayUrl: ''` from mock config objects.

- [ ] **Step 5: Edit task-service-parity.test.ts**

Update mocks to exclude myboteam-ai provider from `buildProviderConfigs` results.

- [ ] **Step 6: Run all tests**

```bash
pnpm -F @myboteam/agent-core test
pnpm -F @myboteam/web test
pnpm -F @myboteam/desktop test
```

- [ ] **Step 7: Run full check**

```bash
pnpm check
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "test: update tests for llm-gateway-client removal"
```

---

### Task 13: Final verification

- [ ] **Step 1: Run full check**

```bash
pnpm check
```

- [ ] **Step 2: Verify no remaining references**

```bash
rg -l "myboteam-ai\|myboteam_ai\|MyboteamAi\|MYBOTEAM_GATEWAY\|llm-gateway\|myboteamGatewayUrl\|noopRuntime\|MyboteamRuntime\|CreditUsage" --type ts --type tsx 2>/dev/null || echo "No remaining references"
```

- [ ] **Step 3: Run all test suites**

```bash
pnpm -F @myboteam/agent-core test && pnpm -F @myboteam/web test && pnpm -F @myboteam/desktop test
```

- [ ] **Step 4: Commit final cleanup if any**

```bash
# If there were any stragglers
git add -A && git commit -m "chore: final cleanup after llm-gateway-client removal"
```
