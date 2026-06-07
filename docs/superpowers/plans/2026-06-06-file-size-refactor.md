# File Size Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split all 103 source files exceeding 200 lines, enforce with Biome's `noExcessiveLinesPerFile` rule.

**Architecture:** Dependency-order bottom-up workspace split (agent-core → daemon → desktop → web). Within each workspace, leaf modules first, consumer modules last. Each class/function gets its own file; logical groupings become subdirectories.

**Tech Stack:** TypeScript, Biome, pnpm workspaces

---

## Task 0: Enforcement Setup

**Files:**
- Modify: `biome.json`
- Modify: `AGENTS.md`


- [ ] **Step 1: Add Biome `noExcessiveLinesPerFile` rule**

Add to the `linter.rules` section in `biome.json`:

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

- [ ] **Step 2: Add override exclusions**

Add to the test override block (already covers `__tests__/`, `*.test.ts`, `*.test.tsx`, `e2e/`) and CSS override block. Also add a new override for barrel/index files:

```json
{
  "overrides": [
    // ... existing overrides ...
    {
      "includes": ["packages/agent-core/src/index.ts"],
      "linter": {
        "rules": {
          "nursery": {
            "noExcessiveLinesPerFile": "off"
          }
        }
      }
    }
  ]
}
```

- [ ] **Step 3: Update AGENTS.md**

Add to the "Do NOT" section:

```markdown
- **Do NOT create files over 200 lines** — split large files by class/function first, then by logical concern. Enforced by Biome's `noExcessiveLinesPerFile` rule.
```

- [ ] **Step 4: Run `pnpm check` to verify Biome config is valid**

Run: `pnpm check`
Expected: passes (no files over 200 lines yet, rule only triggers on files being checked)

- [ ] **Step 5: Commit**

```bash
git add biome.json AGENTS.md
git commit -m "feat: enforce max 200 lines per source file via Biome"
```

---

## Workspace 1: agent-core/src

Splitting order: leaf modules first (no internal agent-core imports), then their consumers.

### Task 1: agent-core storage layer

**Files (splits increase file count, original files shrink below 200):**

**`src/storage/secure-storage.ts`** (277 lines) → extract into:
- `src/storage/secure-storage.ts` — core SecureStorage class only
- `src/storage/secure-storage-utils.ts` — helper functions (encryption helpers, key derivation)

**`src/storage/database.ts`** (235 lines) → extract into:
- `src/storage/database.ts` — Database class, connection management
- `src/storage/database-schema.ts` — schema definitions, table creation SQL
- `src/storage/database-queries.ts` — query helpers, prepared statements

**`src/storage/repositories/providerSettings.ts`** (241 lines) → extract into:
- `src/storage/repositories/providerSettings.ts` — ProviderSettingsRepository class
- `src/storage/repositories/provider-settings-types.ts` — types and constants

**`src/storage/repositories/scheduled-tasks.ts`** (268 lines) → extract into:
- `src/storage/repositories/scheduled-tasks.ts` — ScheduledTasksRepository class
- `src/storage/repositories/scheduled-task-types.ts` — types and enums

**`src/storage/repositories/taskHistory.ts`** (229 lines) → extract into:
- `src/storage/repositories/taskHistory.ts` — TaskHistoryRepository class
- `src/storage/repositories/task-history-types.ts` — task history types

**`src/storage/repositories/appSettings.ts`** (229 lines) → extract into:
- `src/storage/repositories/appSettings.ts` — AppSettingsRepository class
- `src/storage/repositories/app-settings-types.ts` — app settings types

**`src/storage/migrations/v001-init.ts`** (201 lines) → extract into:
- `src/storage/migrations/v001-init.ts` — migration definition
- `src/storage/migrations/v001-init-tables.ts` — table creation SQL per domain

- [ ] **Step 1: Split `src/storage/secure-storage.ts`**
  1. Read the file
  2. Extract helper functions into `secure-storage-utils.ts`
  3. Import from `./secure-storage-utils.js` in `secure-storage.ts`
  4. Check both files are ≤200 lines

- [ ] **Step 2: Split `src/storage/database.ts`**
  1. Read the file
  2. Extract schema definitions into `database-schema.ts`
  3. Extract query helpers into `database-queries.ts`
  4. Import both in `database.ts` from `./database-schema.js` and `./database-queries.js`

- [ ] **Step 3: Split `src/storage/repositories/providerSettings.ts`**
  1. Extract types/constants into `provider-settings-types.ts`
  2. Import in `providerSettings.ts` from `./provider-settings-types.js`

- [ ] **Step 4: Split `src/storage/repositories/scheduled-tasks.ts`**
  1. Extract types/enums into `scheduled-task-types.ts`
  2. Import in `scheduled-tasks.ts` from `./scheduled-task-types.js`

- [ ] **Step 5: Split `src/storage/repositories/taskHistory.ts`**

- [ ] **Step 6: Split `src/storage/repositories/appSettings.ts`**

- [ ] **Step 7: Split `src/storage/migrations/v001-init.ts`**

- [ ] **Step 8: Verify**
  Run: `pnpm -F @myboteam/agent-core test && pnpm typecheck`
  Expected: all pass

- [ ] **Step 9: Commit**

```bash
git add packages/agent-core/src/storage/
git commit -m "refactor(agent-core): split storage layer files under 200 lines"
```

---

### Task 2: agent-core types layer

**Files:**

**`src/common/types/daemon.ts`** (775 lines) → extract into:
- `src/common/types/daemon/daemon-types.ts` — DaemonConfig, daemon options
- `src/common/types/daemon/task-types.ts` — task-related types
- `src/common/types/daemon/event-types.ts` — event/notification types
- `src/common/types/daemon/connection-types.ts` — connection/transport types

**`src/common/types/provider.ts`** (542 lines) → extract into:
- `src/common/types/provider/provider-types.ts` — ProviderConfig, ProviderSettings
- `src/common/types/provider/model-types.ts` — model-related types
- `src/common/types/provider/auth-types.ts` — authentication types

**`src/common/types/providerSettings.ts`** (461 lines) → extract into:
- `src/common/types/providerSettings/settings-types.ts` — settings types
- `src/common/types/providerSettings/ui-types.ts` — UI configuration types

**`src/types/storage.ts`** (355 lines) → extract into:
- `src/types/storage/storage-types.ts` — storage interfaces
- `src/types/storage/entity-types.ts` — entity/row types
- `src/types/storage/repository-types.ts` — repository interfaces

**`src/types/task-manager.ts`** (309 lines) → extract into:
- `src/types/task-manager/task-manager-types.ts` — TaskManager interfaces
- `src/types/task-manager/execution-types.ts` — execution/task lifecycle types

- [ ] **Step 1: Split `src/common/types/daemon.ts` into subdirectory**

  1. Create `src/common/types/daemon/` directory
  2. Split type definitions by domain into 4 files
  3. Update all imports across the codebase: `rg 'from.*common/types/daemon' --include '*.ts'`

- [ ] **Step 2: Split `src/common/types/provider.ts`**

- [ ] **Step 3: Split `src/common/types/providerSettings.ts`**

- [ ] **Step 4: Split `src/types/storage.ts`**

- [ ] **Step 5: Split `src/types/task-manager.ts`**

- [ ] **Step 6: Verify**
  Run: `pnpm -F @myboteam/agent-core test && pnpm typecheck`
  Expected: all pass

- [ ] **Step 7: Commit**

```bash
git add packages/agent-core/src/common/types/ packages/agent-core/src/types/
git commit -m "refactor(agent-core): split type definitions under 200 lines"
```

---

### Task 3: agent-core internal/classes

**Files:**

**`src/internal/classes/OpenCodeAdapter.ts`** (1576 lines) → extract into:
- `src/internal/classes/open-code-adapter.ts` — OpenCodeAdapter class (core)
- `src/internal/classes/adapter-config.ts` — configuration/options types
- `src/internal/classes/adapter-execution.ts` — execution methods
- `src/internal/classes/adapter-tools.ts` — MCP tool handling
- `src/internal/classes/adapter-events.ts` — event handling
- `src/internal/classes/adapter-session.ts` — session management
- `src/internal/classes/adapter-utils.ts` — utility functions
- `src/internal/classes/adapter-types.ts` — type definitions

**`src/internal/classes/TaskManager.ts`** (544 lines) → extract into:
- `src/internal/classes/TaskManager.ts` — TaskManager class
- `src/internal/classes/task-manager-execution.ts` — task execution logic
- `src/internal/classes/task-manager-lifecycle.ts` — lifecycle hooks

**`src/internal/classes/speech-api.ts`** (223 lines) → extract:
- `src/internal/classes/speech-api.ts` — SpeechAPI class (keep)
- `src/internal/classes/speech-api-utils.ts` — utility functions

**`src/internal/classes/OpenCodeLogWatcher.ts`** (209 lines) → extract:
- `src/internal/classes/OpenCodeLogWatcher.ts` — keep as single class (under 200 after extraction if needed)

**`src/internal/classes/SecureStorage.ts`** (203 lines) → keep as single class, check ≤200

- [ ] **Step 1: Split `src/internal/classes/OpenCodeAdapter.ts`** — largest file, create 8 files
  1. Read the full file
  2. Identify class methods by domain (config, execution, tools, events, session)
  3. Extract each domain into its own file with `class Xxx { ... }` that the main class extends or delegates to
  4. Update `src/index.ts` and all consumer imports

- [ ] **Step 2: Split `src/internal/classes/TaskManager.ts`**

- [ ] **Step 3: Split `src/internal/classes/speech-api.ts`**

- [ ] **Step 4: Verify**
  Run: `pnpm -F @myboteam/agent-core test && pnpm typecheck`
  Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add packages/agent-core/src/internal/classes/
git commit -m "refactor(agent-core): split adapter and task-manager classes under 200 lines"
```

---

### Task 4: agent-core opencode/ layer

**Files:**

**`src/opencode/config-generator.ts`** (439 lines) → extract into:
- `src/opencode/config-generator.ts` — main config generator
- `src/opencode/config-generator-options.ts` — option definitions
- `src/opencode/config-generator-templates.ts` — template/boilerplate

**`src/opencode/resolve-task-config.ts`** (324 lines) → extract into:
- `src/opencode/resolve-task-config.ts` — main resolver
- `src/opencode/resolve-task-config-utils.ts` — helper functions

**`src/opencode/auth.ts`** (214 lines) → keep as single file, check ≤200

**`src/opencode/generator-mcp.ts`** (242 lines) → extract into:
- `src/opencode/generator-mcp.ts` — MCP generator core
- `src/opencode/generator-mcp-tools.ts` — tool definitions

**`src/opencode/proxies/azure-foundry-proxy.ts`** (242 lines) → extract into:
- `src/opencode/proxies/azure-foundry-proxy.ts` — proxy class
- `src/opencode/proxies/azure-foundry-types.ts` — type definitions

**`src/opencode/completion/completion-enforcer.ts`** (211 lines) → keep, check ≤200

- [ ] **Step 1: Split `src/opencode/config-generator.ts`**

- [ ] **Step 2: Split `src/opencode/resolve-task-config.ts`**

- [ ] **Step 3: Split `src/opencode/generator-mcp.ts`**

- [ ] **Step 4: Split `src/opencode/proxies/azure-foundry-proxy.ts`**

- [ ] **Step 5: Verify**
  Run: `pnpm -F @myboteam/agent-core test && pnpm typecheck`

- [ ] **Step 6: Commit**

---

### Task 5: agent-core remaining files

**Files:**

**`src/google-accounts/prepare-manifest.ts`** (331 lines) → extract:
- `src/google-accounts/prepare-manifest.ts` — main manifest preparation
- `src/google-accounts/prepare-manifest-utils.ts` — utility functions

**`src/factories/storage.ts`** (272 lines) → extract:
- `src/factories/storage.ts` — factory functions
- `src/factories/storage-config.ts` — configuration types

**`src/services/summarizer-providers.ts`** (201 lines) → keep/split minimally

**`src/services/speech.ts`** (201 lines) → keep/split minimally

**`src/browser/server.ts`** (218 lines) → extract:
- `src/browser/server.ts` — server class
- `src/browser/server-config.ts` — server configuration

**`src/desktop-main.ts`** (222 lines) → extract:
- `src/desktop-main.ts` — main entry setup
- `src/desktop-main-ipc.ts` — IPC handler registration

**`src/common.ts`** (232 lines) → extract:
- `src/common/common.ts` — main common exports
- `src/common/common-utils.ts` — utility functions

- [ ] **Step 1–8: Split each file listed above**

- [ ] **Step 9: Full workspace verify**
  Run: `pnpm -F @myboteam/agent-core test && pnpm typecheck`

- [ ] **Step 10: Commit**

```bash
git add packages/agent-core/src/
git commit -m "refactor(agent-core): split remaining source files under 200 lines"
```

---

## Workspace 2: agent-core/mcp-tools

**Note:** MCP tools live in `packages/agent-core/mcp-tools/` and are treated as separate packages. Each is split independently.

### Task 6: dev-browser-mcp

**`mcp-tools/dev-browser-mcp/src/index.ts`** (4724 lines) → largest file in project. Extract into:
- `mcp-tools/dev-browser-mcp/src/index.ts` — entry point, re-exports
- `mcp-tools/dev-browser-mcp/src/server.ts` — server setup/start
- `mcp-tools/dev-browser-mcp/src/session-manager.ts` — session management
- `mcp-tools/dev-browser-mcp/src/browser-actions.ts` — browser action handlers
- `mcp-tools/dev-browser-mcp/src/snapshot-manager.ts` — snapshot functionality
- `mcp-tools/dev-browser-mcp/src/types.ts` — type definitions

- [ ] **Step 1: Split `dev-browser-mcp/src/index.ts` into 6+ files**

- [ ] **Step 2: Verify with typecheck**

- [ ] **Step 3: Commit**

### Task 7: dev-browser

**`mcp-tools/dev-browser/src/relay.ts`** (652 lines) → extract:
- `mcp-tools/dev-browser/src/relay.ts` — relay core
- `mcp-tools/dev-browser/src/relay-transport.ts` — transport layer
- `mcp-tools/dev-browser/src/relay-protocol.ts` — protocol handling

**`mcp-tools/dev-browser/src/browser-page-service.ts`** (491 lines) → extract:
- `mcp-tools/dev-browser/src/browser-page-service.ts` — page service core
- `mcp-tools/dev-browser/src/browser-page-navigation.ts` — navigation methods
- `mcp-tools/dev-browser/src/browser-page-interaction.ts` — interaction methods

**`mcp-tools/dev-browser/src/index.ts`** (443 lines) → extract:
- `mcp-tools/dev-browser/src/index.ts` — entry
- `mcp-tools/dev-browser/src/browser-server.ts` — server setup

**`mcp-tools/dev-browser/src/browser-task-page-factory.ts`** (362 lines) → extract:
- `mcp-tools/dev-browser/src/browser-task-page-factory.ts` — factory
- `mcp-tools/dev-browser/src/browser-task-page-types.ts` — types

**`mcp-tools/dev-browser/src/browser-window-controller.ts`** (236 lines) → keep/split minimal

- [ ] **Step 1–5: Split each file listed above**

- [ ] **Step 6: Verify**

- [ ] **Step 7: Commit**

### Task 8: gws-mcp, whatsapp, calendar-mcp, request-google-file-picker

**`mcp-tools/gws-mcp/src/index.ts`** (314 lines) → extract into 2-3 files
**`mcp-tools/whatsapp/src/index.ts`** (268 lines) → extract into 2 files
**`mcp-tools/calendar-mcp/src/index.ts`** (265 lines) → extract into 2-3 files
**`mcp-tools/calendar-mcp/src/calendar.ts`** (261 lines) → extract into 2 files
**`mcp-tools/request-google-file-picker/src/index.ts`** (261 lines) → extract into 2 files
**`mcp-tools/dev-browser-mcp/src/connection.ts`** (357 lines) → extract into 2 files

- [ ] **Step 1–6: Split each file**

- [ ] **Step 7: Verify with typecheck**

- [ ] **Step 8: Commit**

---

## Workspace 3: apps/daemon/src

### Task 9: daemon core services

**Files:**

**`daemon-routes.ts`** (1200 lines) → extract into:
- `daemon-routes.ts` — route definitions, router setup
- `daemon-routes-tasks.ts` — task-related routes
- `daemon-routes-settings.ts` — settings routes
- `daemon-routes-whatsapp.ts` — WhatsApp routes
- `daemon-routes-google.ts` — Google account routes
- `daemon-routes-mcp.ts` — MCP tool routes
- `daemon-routes-middleware.ts` — middleware/error handling

**`src/opencode/server-manager.ts`** (592 lines) → extract into:
- `src/opencode/server-manager.ts` — manager class
- `src/opencode/server-lifecycle.ts` — lifecycle management
- `src/opencode/server-config.ts` — configuration

**`src/opencode/auth-openai.ts`** (329 lines) → extract into:
- `src/opencode/auth-openai.ts` — auth flow
- `src/opencode/auth-openai-utils.ts` — utilities

- [ ] **Step 1: Split `daemon-routes.ts`** — second largest file, extract by domain

- [ ] **Step 2: Split `src/opencode/server-manager.ts`**

- [ ] **Step 3: Split `src/opencode/auth-openai.ts`**

- [ ] **Step 4: Verify**
  Run: `pnpm -F @myboteam/daemon test && pnpm typecheck`

- [ ] **Step 5: Commit**

### Task 10: daemon remaining services

**Files:**

**`src/index.ts`** (387 lines) → extract into:
- `src/index.ts` — entry point
- `src/app-setup.ts` — app initialization
- `src/app-config.ts` — configuration loading

**`src/task-service.ts`** (387 lines) → extract into:
- `src/task-service.ts` — TaskService class
- `src/task-service-execution.ts` — execution methods
- `src/task-service-utils.ts` — utilities

**`src/google-account-service.ts`** (367 lines) → extract into 2-3 files

**`src/scheduler-service.ts`** (349 lines) → extract into 2 files

**`src/settings-service.ts`** (285 lines) → extract into 2 files

**`src/whatsapp-service.ts`** (275 lines) → extract into 2 files

**`src/whatsapp/WhatsAppService.ts`** (319 lines) → extract into 2 files

**`src/whatsapp/wireTaskBridge.ts`** (254 lines) → extract into 2 files

**`src/whatsapp/taskBridge.ts`** (234 lines) → extract into 2 files

**`src/workspace-service.ts`** (243 lines) → extract into 2 files

**`src/task-config-builder.ts`** (212 lines) → keep/split minimal

- [ ] **Step 1–11: Split each file listed above**

- [ ] **Step 12: Verify**
  Run: `pnpm -F @myboteam/daemon test && pnpm typecheck`

- [ ] **Step 13: Commit**

```bash
git add apps/daemon/src/
git commit -m "refactor(daemon): split source files under 200 lines"
```

---

## Workspace 4: apps/desktop/src

### Task 11: desktop preload and main entry

**Files:**

**`src/preload/index.ts`** (1188 lines) → extract into:
- `src/preload/index.ts` — entry, contextBridge setup
- `src/preload/api-handlers.ts` — API method registration
- `src/preload/ipc-bridge.ts` — IPC bridge helpers
- `src/preload/type-assertions.ts` — type guards

**`src/main/index.ts`** (376 lines) → extract into:
- `src/main/index.ts` — main process entry
- `src/main/app-lifecycle.ts` — app lifecycle hooks
- `src/main/window-manager.ts` — window creation/management

**`src/main/app-startup.ts`** (506 lines) → extract into:
- `src/main/app-startup.ts` — startup sequence
- `src/main/app-startup-init.ts` — initialization steps
- `src/main/app-startup-services.ts` — service registration

**`src/main/daemon-bootstrap.ts`** (315 lines) → extract into:
- `src/main/daemon-bootstrap.ts` — bootstrap process
- `src/main/daemon-bootstrap-config.ts` — configuration

- [ ] **Step 1–4: Split each file**

- [ ] **Step 5: Verify**
  Run: `pnpm -F @myboteam/desktop test && pnpm typecheck`

- [ ] **Step 6: Commit**

### Task 12: desktop IPC handlers

**Files:**

**`src/main/ipc/handlers/analytics-handlers.ts`** (416 lines) → extract into 2 files

**`src/main/ipc/handlers/settings-handlers.ts`** (333 lines) → extract into 2 files

**`src/main/ipc/handlers/task-handlers.ts`** (264 lines) → extract into 2 files

**`src/main/ipc/handlers/connector-handlers.ts`** (204 lines) → extract into 2 files

**`src/main/ipc/handlers/provider-config-handlers/myboteam-ai-handlers.ts`** (272 lines) → extract into 2 files

**`src/main/ipc/handlers/api-key-handlers/api-key-validation-handlers.ts`** (210 lines) → keep/split minimal

- [ ] **Step 1–6: Split each handler file by domain**

- [ ] **Step 7: Verify**
  Run: `pnpm -F @myboteam/desktop test && pnpm typecheck`

- [ ] **Step 8: Commit**

### Task 13: desktop remaining services

**Files:**

**`src/main/analytics/events.ts`** (682 lines) → extract into:
- `src/main/analytics/events.ts` — event definitions
- `src/main/analytics/event-trackers.ts` — tracking implementations
- `src/main/analytics/event-types.ts` — type definitions

**`src/main/analytics/analytics-service.ts`** (368 lines) → extract into 2 files

**`src/main/daemon/daemon-connector.ts`** (586 lines) → extract into:
- `src/main/daemon/daemon-connector.ts` — connector class
- `src/main/daemon/daemon-connector-transport.ts` — transport layer
- `src/main/daemon/daemon-connector-events.ts` — event handling

**`src/main/daemon/service-manager.ts`** (357 lines) → extract into 2 files

**`src/main/test-utils/mock-task-flow.ts`** (383 lines) → extract into 2 files

**`src/main/google-accounts/google-auth.ts`** (272 lines) → extract into 2 files

**`src/main/config/build-config.ts`** (209 lines) → keep/split minimal

**`src/main/providers/huggingface-local/server-lifecycle.ts`** (208 lines) → keep/split minimal

**`src/main/connectors/mcp-oauth-strategies.ts`** (203 lines) → keep/split minimal

- [ ] **Step 1–9: Split each file listed above**

- [ ] **Step 10: Verify**
  Run: `pnpm -F @myboteam/desktop test && pnpm typecheck`

- [ ] **Step 11: Commit**

```bash
git add apps/desktop/src/
git commit -m "refactor(desktop): split source files under 200 lines"
```

---

## Workspace 5: apps/web/src

### Task 14: web lib and hooks

**Files:**

**`src/client/lib/myboteam.ts`** (953 lines) → extract into:
- `src/client/lib/myboteam.ts` — main client API
- `src/client/lib/myboteam-tasks.ts` — task methods
- `src/client/lib/myboteam-settings.ts` — settings methods
- `src/client/lib/myboteam-connectors.ts` — connector methods
- `src/client/lib/myboteam-accounts.ts` — account methods
- `src/client/lib/myboteam-types.ts` — type definitions

**`src/client/hooks/useSpeechInput.ts`** (324 lines) → extract into:
- `src/client/hooks/useSpeechInput.ts` — hook
- `src/client/hooks/use-speech-input-utils.ts` — utilities

- [ ] **Step 1: Split `myboteam.ts`** (the client-facing IPC bridge, 953 lines) by handler domain

- [ ] **Step 2: Split `useSpeechInput.ts`**

- [ ] **Step 3: Verify**
  Run: `pnpm -F @myboteam/web test && pnpm typecheck`

- [ ] **Step 4: Commit**

### Task 15: web components

**Files:**

**`src/client/components/layout/SettingsDialog.tsx`** (269 lines) → extract:
- `src/client/components/layout/SettingsDialog.tsx` — dialog shell
- `src/client/components/layout/settings-dialog-content.tsx` — content panels

**`src/client/components/layout/useSettingsDialog.ts`** (241 lines) → extract:
- `src/client/components/layout/useSettingsDialog.ts` — hook
- `src/client/components/layout/settings-dialog-state.ts` — state management

**`src/client/components/settings/providers/MyboteamAiProviderForm.tsx`** (384 lines) → extract into 2-3 files

**`src/client/components/settings/DaemonSection.tsx`** (260 lines) → extract into 2 files

**`src/client/components/settings/google-accounts/GoogleAccountsSection.tsx`** (252 lines) → extract into 2 files

**`src/client/components/settings/integrations/IntegrationsPanel.tsx`** (238 lines) → extract into 2 files

**`src/client/components/settings/CloudBrowsersPanel.tsx`** (220 lines) → keep/split minimal

**`src/client/components/settings/ProviderFormSelector.tsx`** (214 lines) → keep/split minimal

**`src/client/components/settings/connectors/useConnectors.ts`** (231 lines) → extract into 2 files

**`src/client/components/settings/connectors/useConnectorsPanel.ts`** (223 lines) → keep/split minimal

**`src/client/components/settings/connectors/LightdashConnectorCard.tsx`** (204 lines) → keep/split minimal

**`src/client/components/settings/connectors/DatadogConnectorCard.tsx`** (202 lines) → keep/split minimal

**`src/client/components/ui/ModelIndicator.tsx`** (231 lines) → extract into 2 files

**`src/client/components/ui/dropdown-menu.tsx`** (228 lines) → extract shadcn dropdown parts

**`src/client/components/ui/searchable-select-parts.tsx`** (204 lines) → keep/split minimal

**`src/client/components/execution/MessageList.tsx`** (206 lines) → keep/split minimal

**`src/client/pages/Execution.tsx`** (253 lines) → extract into:
- `src/client/pages/Execution.tsx` — page component
- `src/client/pages/execution-exec.tsx` — execution logic

**`src/client/pages/execution/useExecutionCore.ts`** (202 lines) → keep/split minimal

**`src/client/App.tsx`** (237 lines) → extract into:
- `src/client/App.tsx` — app shell
- `src/client/app-routes.tsx` — route definitions

**`src/client/i18n/index.ts`** (254 lines) → extract by language:
- `src/client/i18n/index.ts` — i18n setup
- `src/client/i18n/en.ts` — English translations
- `src/client/i18n/he.ts` — Hebrew translations

- [ ] **Step 1–19: Split each file listed above**

- [ ] **Step 20: Verify**
  Run: `pnpm -F @myboteam/web test && pnpm typecheck`

- [ ] **Step 21: Commit**

```bash
git add apps/web/src/client/
git commit -m "refactor(web): split source files under 200 lines"
```

---

## Task 16: Full Project Verification

- [ ] **Step 1: Run full check**

```bash
pnpm check
```

Expected: passes with no `noExcessiveLinesPerFile` violations

- [ ] **Step 2: Run all tests**

```bash
pnpm -F @myboteam/agent-core test && pnpm -F @myboteam/desktop test && pnpm -F @myboteam/web test
```

Expected: all pass

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "refactor: complete file size refactor under 200 lines per source file"
```

---

## Self-Review Checklist

1. **Spec coverage:** All spec sections covered: Biome enforcement (Task 0), AGENTS.md rule (Task 0), splitting methodology (Tasks 1-15), workspace order (Tasks 1-15), verification (Task 16)
2. **Placeholder scan:** No TBD/TODO patterns remain
3. **Type consistency:** All split files use consistent naming convention (kebab-case for new files following existing patterns)
