# Remove LLM Gateway Client

## Goal

Remove `@myboteam/llm-gateway-client` and all associated `myboteam-ai` provider code across the entire codebase — external package references, types, interfaces, RPC methods, IPC handlers, preload API, web UI components, config, and tests.

## Scope: Full Removal

Everything `myboteam-ai`-related is removed. Not just the external NPM package, but the entire provider abstraction:

- `MyboteamRuntime` interface and `noopRuntime`
- `CreditUsage`, `StorageDeps`, `MyboteamConnectResult`, `ProviderBuildResult` types
- Dynamic import of `@myboteam/llm-gateway-client` in the daemon
- All RPC methods (`myboteam-ai.connect`, `myboteam-ai.disconnect`, `myboteam-ai.get-usage`)
- Event `myboteam-ai.usage-update`
- Desktop IPC handlers, build config (`myboteamGatewayUrl`, `isFreeMode`), daemon bootstrap
- Preload API surface
- Web UI: `useCreditsState`, `MyboteamAiProviderForm`, provider grid entry, logos
- `buildProviderConfigs` myboteam-ai integration in config builder
- `myboteam-ai` storage repository (`myboteam-ai-credits.ts`)

## Sequencing: Top-Down (Approach B)

Removed in dependency order — consumer code before definitions — so each layer can be typechecked independently.

### Layer 1: Web UI

**Delete:**
- `apps/web/src/client/hooks/useCreditsState.ts`
- `apps/web/src/client/pages/settings/providers/components/providers/useMyboteamAiConnect.ts`
- `apps/web/src/client/pages/settings/providers/components/providers/MyboteamAiProviderForm.tsx`
- `apps/web/src/client/pages/settings/providers/components/providers/myboteam-ai-utils.tsx`

**Edit:**
- `apps/web/src/client/config/myboteam-types.ts` — remove `MyboteamAiUsageData`, `MyboteamAiStatusData`, `BuildCapabilitiesData`
- `apps/web/src/client/pages/settings/providers/components/ProviderGrid.tsx` — remove `'myboteam-ai'` from provider filter
- `apps/web/src/client/pages/settings/providers/components/ProviderFormSelector.tsx` — remove `'myboteam-ai'` case
- `apps/web/src/client/utils/provider-logos.ts` — remove `'myboteam-ai'` logo entry

### Layer 2: Desktop (IPC + Build Config + Preload)

**Delete:**
- `apps/desktop/src/main/ipc/handlers/provider-config-handlers/myboteam-ai-handlers.ts`
- `apps/desktop/src/main/ipc/handlers/provider-config-handlers/myboteam-ai-usage-handlers.ts`
- `apps/desktop/src/main/ipc/handlers/provider-config-handlers/myboteam-ai-utils.ts`

**Edit:**
- `apps/desktop/src/main/config/build-config-load.ts` — remove `myboteamGatewayUrl` from schema and loading
- `apps/desktop/src/main/config/build-config-checks.ts` — remove `isFreeMode()`
- `apps/desktop/src/main/config/build-config.ts` — remove `isFreeMode` export
- `apps/desktop/src/main/daemon/daemon-connector-transport.ts` — remove `MYBOTEAM_GATEWAY_URL` pass-through
- `apps/desktop/src/main/app-startup-init.ts` — remove `isFreeMode` check and myboteam-ai cleanup block
- `apps/desktop/src/main/ipc/handlers/settings-handlers.ts` — remove `hasFreeMode`
- `apps/desktop/src/main/daemon-bootstrap-config.ts` — remove `myboteam-ai.usage-update` forwarding
- `apps/desktop/src/preload/handlers/services.ts` — remove `myboteamAiConnect`, `myboteamAiEnsureReady`, `myboteamAiDisconnect`, `myboteamAiGetUsage`, `myboteamAiGetStatus`, `onMyboteamAiUsageUpdate`

### Layer 3: Daemon (Services + RPC + Config)

**Delete:**
- `apps/daemon/src/types/gateway-client.d.ts`

**Edit:**
- `apps/daemon/src/app-config.ts` — remove `loadOptionalRuntime()`, remove `setProxyTaskId` wiring
- `apps/daemon/tsup.config.ts` — remove `'@myboteam/llm-gateway-client'` from `external`
- `apps/daemon/src/index.ts` — remove `loadOptionalRuntime()` call, remove `myboteamRuntime`/`setProxyTaskId`
- `apps/daemon/src/app-setup.ts` — remove `myboteamRuntime` from `createServices`, `registerRoutes`, `bootDaemon`, `BootConfig`, `BootResult`
- `apps/daemon/src/task-service.ts` — remove `myboteamRuntime` from options
- `apps/daemon/src/task-config-builder.ts` — remove `myboteamRuntime` from `TaskConfigBuilderOptions`
- `apps/daemon/src/task-service-events.ts` — remove `myboteamRuntime` from `TaskServiceOptions`
- `apps/daemon/src/opencode/server-config.ts` — remove `myboteamRuntime` from `ServerManagerDeps`
- `apps/daemon/src/daemon-routes.ts` — remove `myboteamRuntime` from `RouteServices`
- `apps/daemon/src/daemon-routes-misc.ts` — remove all 4 myboteam-ai RPC handlers

### Layer 4: Agent-Core (Types + Interfaces + Config Builder)

**Delete:**
- `packages/agent-core/src/common/types/gateway.ts`
- `packages/agent-core/src/opencode/myboteam-runtime.ts`
- `packages/agent-core/src/opencode/config-providers-myboteam.ts`
- `packages/agent-core/src/myboteam-runtime-types.ts`

**Edit:**
- `packages/agent-core/src/opencode/config-builder.ts` — remove `buildMyboteamAiConfig`, remove `myboteamRuntime` from options/context
- `packages/agent-core/src/opencode/resolve-task-config.ts` — remove `myboteamRuntime` and `myboteamStorageDeps`
- `packages/agent-core/src/index.ts` — remove `MyboteamRuntime`, `noopRuntime`, `CreditUsage`, `buildProviderConfigs` exports
- `packages/agent-core/src/common/index.ts` — remove `CreditUsage` export
- `packages/agent-core/src/common.ts` — remove `CreditUsage` export
- `packages/agent-core/src/desktop-main.ts` — remove `CreditUsage` export
- `packages/agent-core/src/types/storage/repository-types.ts` — remove `CreditUsage` import
- `packages/agent-core/src/storage/repositories/myboteam-ai-credits.ts` — remove or adapt
- `packages/agent-core/src/common/types/daemon/method-map.ts` — remove `myboteam-ai` methods
- `packages/agent-core/src/common/types/daemon/method-map-extras.ts` — remove `CreditUsage` import
- `packages/agent-core/src/common/types/daemon/event-types.ts` — remove `myboteam-ai.usage-update`

### Layer 5: Tests

Update all test files referencing removed modules:
- `packages/agent-core/tests/unit/opencode/myboteam-runtime.test.ts` — delete
- `apps/desktop/__tests__/unit/main/config/build-config.unit.test.ts` — remove `MYBOTEAM_GATEWAY_URL` references
- `apps/desktop/__tests__/unit/main/updater.unit.test.ts` — remove `myboteamGatewayUrl` mock
- `apps/desktop/__tests__/unit/main/updater.manual-manifest.unit.test.ts` — remove `myboteamGatewayUrl` mock
- `apps/web/__tests__/unit/renderer/hooks/useCreditsState.hook.unit.test.ts` — delete
- `apps/daemon/__tests__/unit/task-service-parity.test.ts` — update mock

## Verification

After each layer, run:
- `pnpm typecheck` — ensure no type errors
- `pnpm -F @myboteam/agent-core test` — agent-core tests pass
- `pnpm -F @myboteam/web test` — web tests pass
- `pnpm -F @myboteam/desktop test` — desktop tests pass

After all layers, run:
- `pnpm check` — full Biome check + typecheck
- All three workspace test suites

## Future

After removal, users connect their own API keys directly via OpenAI/Anthropic/other providers — no MyBoTeam AI proxy layer needed.
