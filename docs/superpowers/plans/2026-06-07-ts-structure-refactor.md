# TS Structure Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce granularity rules across all workspaces — one component per `.tsx`, one class per `.ts`, max 5 exported functions per `.ts`.

**Architecture:** Dependency-order workspace-by-workspace (agent-core → daemon → desktop → web). Each workspace is fully validated before moving to the next. Files are split by logical concern with barrel re-exports to minimize consumer import changes.

**Violation counts:** agent-core (25 files), daemon (3 files), desktop (11 files), web (16 `.tsx` files).

---

### Task 1: Update AGENTS.md with new conventions

**Files:**
- Modify: `AGENTS.md` (append rules to Code Conventions section)

- [ ] **Step 1: Add code convention rules to AGENTS.md**

Edit `AGENTS.md` and add these bullet points to the `## Code Conventions` section (before `### Image Assets in Web UI`):

```markdown
- **One component per `.tsx` file** — shadcn/ui multi-component files are exempt
- **One class per `.ts` file** — tightly coupled error subclasses are exempt
- **Max 5 exported functions per `.ts` file** — types, interfaces, and non-function constants are excluded; group additional functions into separate files by logical concern
```

- [ ] **Step 2: Verify**

Run: `pnpm check`
Expected: No errors (this is a markdown-only change).

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add TS structure conventions to AGENTS.md"
```

---

## agent-core workspace

### Task 2: Split multi-class files in agent-core

**Files:**
- Modify: `packages/agent-core/src/internal/classes/adapter-types.ts`
- Create: `packages/agent-core/src/internal/classes/open-code-runtime-unavailable-error.ts`
- Modify: `packages/agent-core/src/storage/migrations/errors.ts`
- Create: `packages/agent-core/src/storage/migrations/corrupt-database-error.ts`

- [ ] **Step 1: Split adapter-types.ts**

Read `packages/agent-core/src/internal/classes/adapter-types.ts`. It has 2 error classes:
- `OpenCodeCliNotFoundError`
- `OpenCodeRuntimeUnavailableError`

Move `OpenCodeRuntimeUnavailableError` to a new file `open-code-runtime-unavailable-error.ts`. Keep `OpenCodeCliNotFoundError` in the original. File structure:

```typescript
// open-code-runtime-unavailable-error.ts
export class OpenCodeRuntimeUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenCodeRuntimeUnavailableError';
  }
}
```

Update `adapter-types.ts`: remove the moved class and its import references. Add re-export if needed.

- [ ] **Step 2: Split migrations/errors.ts**

Read `packages/agent-core/src/storage/migrations/errors.ts`. It has 2 error classes:
- `FutureSchemaError`
- `CorruptDatabaseError`

Move `CorruptDatabaseError` to a new file `corrupt-database-error.ts`. Keep `FutureSchemaError` in the original.

- [ ] **Step 3: Update all imports**

Search for imports of `OpenCodeRuntimeUnavailableError` and `CorruptDatabaseError` across the entire codebase. Update their import paths to point to the new files.

```bash
rg "OpenCodeRuntimeUnavailableError" packages/ apps/ --type ts --type tsx -l
rg "CorruptDatabaseError" packages/ apps/ --type ts --type tsx -l
```

Update each finding.

- [ ] **Step 4: Verify**

```bash
pnpm check
pnpm -F @myboteam/agent-core test
```

- [ ] **Step 5: Commit**

```bash
git add packages/agent-core/src/internal/classes/adapter-types.ts packages/agent-core/src/internal/classes/open-code-runtime-unavailable-error.ts packages/agent-core/src/storage/migrations/errors.ts packages/agent-core/src/storage/migrations/corrupt-database-error.ts
git commit -m "refactor(agent-core): split multi-class files into single-class files"
```

### Task 3: Split storage/repositories/ui-settings.ts (14 exports)

**Files:**
- Create: `packages/agent-core/src/storage/repositories/ui-settings-debug.ts`
- Create: `packages/agent-core/src/storage/repositories/ui-settings-theme.ts`
- Create: `packages/agent-core/src/storage/repositories/ui-settings-behavior.ts`
- Create: `packages/agent-core/src/storage/repositories/ui-settings-language.ts`
- Modify: `packages/agent-core/src/storage/repositories/ui-settings.ts`

- [ ] **Step 1: Read and analyze the file**

Read `packages/agent-core/src/storage/repositories/ui-settings.ts` and identify groups of getter/setter pairs.

- [ ] **Step 2: Extract debug settings**

Create `ui-settings-debug.ts` with functions related to debug mode, onboarding:
```typescript
export function getIsDebugMode(db: Database): boolean;
export function setIsDebugMode(db: Database, value: boolean): void;
export function getHasCompletedOnboarding(db: Database): boolean;
export function setHasCompletedOnboarding(db: Database, value: boolean): void;
```

- [ ] **Step 3: Extract theme settings**

Create `ui-settings-theme.ts`:
```typescript
export function getTheme(db: Database): Theme;
export function setTheme(db: Database, theme: Theme): void;
export function getThemeColor(db: Database): string;
export function setThemeColor(db: Database, color: string): void;
```

- [ ] **Step 4: Extract behavior settings**

Create `ui-settings-behavior.ts`:
```typescript
export function getCloseBehavior(db: Database): CloseBehavior;
export function setCloseBehavior(db: Database, value: CloseBehavior): void;
export function getNotificationsEnabled(db: Database): boolean;
export function setNotificationsEnabled(db: Database, value: boolean): void;
```

- [ ] **Step 5: Extract language settings**

Create `ui-settings-language.ts`:
```typescript
export function getLanguage(db: Database): string;
export function setLanguage(db: Database, lang: string): void;
```

- [ ] **Step 6: Update original file**

Strip all function bodies from `ui-settings.ts`, keep only re-exports:
```typescript
export {
  getIsDebugMode, setIsDebugMode,
  getHasCompletedOnboarding, setHasCompletedOnboarding,
} from './ui-settings-debug.js';
export {
  getTheme, setTheme,
  getThemeColor, setThemeColor,
} from './ui-settings-theme.js';
export {
  getCloseBehavior, setCloseBehavior,
  getNotificationsEnabled, setNotificationsEnabled,
} from './ui-settings-behavior.js';
export {
  getLanguage, setLanguage,
} from './ui-settings-language.js';
```

- [ ] **Step 7: Update all imports across codebase**

```bash
rg "from.*ui-settings" packages/ apps/ --type ts --type tsx -l
```

For consumers that import specific functions from `./ui-settings.js`, the barrel re-exports in the original file mean they should still work. Verify none need direct imports to new paths.

- [ ] **Step 8: Verify**

```bash
pnpm check
pnpm -F @myboteam/agent-core test
```

- [ ] **Step 9: Commit**

```bash
git add packages/agent-core/src/storage/repositories/ui-settings*.ts
git commit -m "refactor(agent-core): split ui-settings.ts into domain-specific files"
```

### Task 4: Split storage/repositories/provider-settings.ts (16 exports) and providerSettings.ts (16 exports)

**Files:**
- Create: Multiple new files per provider domain
- Modify: `provider-settings.ts` and `providerSettings.ts`

- [ ] **Step 1: Analyze provider-settings.ts**

Read `packages/agent-core/src/storage/repositories/provider-settings.ts` (16 function exports). Group by provider: ollama, litellm, azure-foundry, lmstudio, huggingface-local, nim. Create one file per provider:
- `provider-settings-ollama.ts`
- `provider-settings-litellm.ts`
- `provider-settings-azure-foundry.ts`
- `provider-settings-lmstudio.ts`
- `provider-settings-huggingface-local.ts`
- `provider-settings-nim.ts`

Keep shared functions (like `get/setSelectedModel`, `get/setOpenAiBaseUrl`) in `provider-settings.ts`.

- [ ] **Step 2: Analyze providerSettings.ts**

Read `packages/agent-core/src/storage/repositories/providerSettings.ts` (16 function exports). Group by operation:
- `provider-settings-meta.ts`: `getProviderSettings`, `getActiveProviderId`, `setActiveProvider`, `getProviderDebugMode`, `setProviderDebugMode`, `clearProviderSettings`
- `provider-connections.ts`: `getConnectedProvider`, `setConnectedProvider`, `removeConnectedProvider`, `getConnectedProviderIds`, `hasReadyProvider`, `updateProviderModel`, `getActiveProviderModel`
- `myboteam-ai-credits.ts`: `getMyboteamAiCredits`, `saveMyboteamAiCredits`, `clearMyboteamAiCredits`

- [ ] **Step 3: Create files and update originals**

For each grouping above: create the new file(s), extract functions, and set up barrel re-exports in the original file.

- [ ] **Step 4: Update imports and verify**

```bash
rg "from.*provider-settings\|from.*providerSettings" packages/ apps/ --type ts --type tsx -l
pnpm check
pnpm -F @myboteam/agent-core test
```

- [ ] **Step 5: Commit**

```bash
git add packages/agent-core/src/storage/repositories/provider-settings*.ts packages/agent-core/src/storage/repositories/providerSettings*.ts packages/agent-core/src/storage/repositories/provider-connections*.ts packages/agent-core/src/storage/repositories/myboteam-ai-credits*.ts
git commit -m "refactor(agent-core): split provider-settings files by domain"
```

### Task 5: Split storage/repositories/taskHistory.ts (12 exports)

**Files:**
- Create: `packages/agent-core/src/storage/repositories/task-crud.ts`
- Create: `packages/agent-core/src/storage/repositories/task-messages.ts`
- Create: `packages/agent-core/src/storage/repositories/task-updates.ts`
- Modify: `packages/agent-core/src/storage/repositories/taskHistory.ts`

- [ ] **Step 1: Read and split by operation type**

- `task-crud.ts`: `getTasks`, `getTask`, `saveTask`, `deleteTask`, `clearHistory`
- `task-messages.ts`: `addTaskMessage`, `insertAttachments` (helper)
- `task-updates.ts`: `updateTaskStatus`, `updateTaskSessionId`, `updateTaskSummary`, `setMaxHistoryItems`, `clearTaskHistoryStore`, `flushPendingTasks`

Create each file with the extracted functions, set up barrel re-exports in `taskHistory.ts`.

- [ ] **Step 2: Verify and commit**

```bash
rg "from.*taskHistory" packages/ apps/ --type ts --type tsx -l
pnpm check && pnpm -F @myboteam/agent-core test
git add packages/agent-core/src/storage/repositories/task-crud*.ts packages/agent-core/src/storage/repositories/task-messages*.ts packages/agent-core/src/storage/repositories/task-updates*.ts
git commit -m "refactor(agent-core): split taskHistory.ts into crud/messages/updates"
```

### Task 6: Split internal/classes/adapter-utils.ts (11 exports)

**Files:**
- Create: `packages/agent-core/src/internal/classes/task-utils.ts`
- Create: `packages/agent-core/src/internal/classes/permission-utils.ts`
- Create: `packages/agent-core/src/internal/classes/message-utils.ts`
- Create: `packages/agent-core/src/internal/classes/auth-utils.ts`
- Modify: `packages/agent-core/src/internal/classes/adapter-utils.ts`

- [ ] **Step 1: Read and split by domain**

- `task-utils.ts`: `generateTaskId`, `deriveTitle`, `buildModelParam`, `buildWorkspaceInstructionRuntimeBlock`
- `permission-utils.ts`: `generateRequestId`, `inferFileOperation`, `formatPermissionToolName`, `buildPermissionToolInput`, `inferFilePath`
- `message-utils.ts`: `partToOpenCodeMessage`
- `auth-utils.ts`: `parseConnectorAuthPayload`

Create each file, set up barrel re-exports.

- [ ] **Step 2: Verify and commit**

```bash
rg "from.*adapter-utils" packages/ apps/ --type ts --type tsx -l
pnpm check && pnpm -F @myboteam/agent-core test
git add packages/agent-core/src/internal/classes/task-utils*.ts packages/agent-core/src/internal/classes/permission-utils*.ts packages/agent-core/src/internal/classes/message-utils*.ts packages/agent-core/src/internal/classes/auth-utils*.ts
git commit -m "refactor(agent-core): split adapter-utils.ts by domain"
```

### Task 7: Split storage/migrations/v001-init-tables.ts (10 exports)

**Files:**
- Create: `packages/agent-core/src/storage/migrations/v001-app-settings-table.ts`
- Create: `packages/agent-core/src/storage/migrations/v001-provider-tables.ts`
- Create: `packages/agent-core/src/storage/migrations/v001-tasks-tables.ts`
- Create: `packages/agent-core/src/storage/migrations/v001-skills-connectors-tables.ts`
- Modify: `packages/agent-core/src/storage/migrations/v001-init-tables.ts`

- [ ] **Step 1: Read and split by table domain**

The file exports table creator functions. Each group gets its own file:
- `v001-app-settings-table.ts`: app settings table creator
- `v001-provider-tables.ts`: provider-related table creators
- `v001-tasks-tables.ts`: task/execution table creators
- `v001-skills-connectors-tables.ts`: skills and connectors table creators

Keep `v001-init-tables.ts` as a barrel that re-exports all. The migration runner imports from this file.

- [ ] **Step 2: Verify and commit**

```bash
rg "from.*v001-init-tables" packages/ apps/ --type ts --type tsx -l
pnpm check && pnpm -F @myboteam/agent-core test
git add packages/agent-core/src/storage/migrations/v001-init-tables*.ts packages/agent-core/src/storage/migrations/v001-*-tables*.ts
git commit -m "refactor(agent-core): split v001-init-tables.ts by table domain"
```

### Task 8: Split storage/repositories/workspaces.ts (9 exports)

**Files:**
- Create: `packages/agent-core/src/storage/repositories/workspace-crud.ts`
- Create: `packages/agent-core/src/storage/repositories/workspace-active.ts`
- Modify: `packages/agent-core/src/storage/repositories/workspaces.ts`

- [ ] **Step 1: Split by operation type**

- `workspace-crud.ts`: `listWorkspaces`, `getWorkspace`, `getDefaultWorkspace`, `createWorkspace`, `createDefaultWorkspace`, `updateWorkspace`, `deleteWorkspace`
- `workspace-active.ts`: `getActiveWorkspaceId`, `setActiveWorkspaceId`

- [ ] **Step 2: Verify and commit**

```bash
pnpm check && pnpm -F @myboteam/agent-core test
git add packages/agent-core/src/storage/repositories/workspace-*.ts
git commit -m "refactor(agent-core): split workspaces.ts into crud and active"
```

### Task 9: Split storage/database.ts (8 exports), appSettings.ts (8), connectors.ts (8), scheduled-tasks.ts (8)

**Files:**
- Create: `packages/agent-core/src/storage/database-init.ts`, `database-access.ts`, `database-lifecycle.ts`
- Create: `packages/agent-core/src/storage/repositories/sandbox-settings.ts`, `cloud-browser-settings.ts`, `messaging-settings.ts`, `app-settings-aggregate.ts`
- Create: `packages/agent-core/src/storage/repositories/connector-queries.ts`, `connector-mutations.ts`
- Create: `packages/agent-core/src/storage/repositories/scheduled-task-queries.ts`, `scheduled-task-mutations.ts`
- Modify: originals

- [ ] **Step 1: Split database.ts**

- `database-init.ts`: `initializeDatabase`
- `database-access.ts`: `getDatabase`, `isDatabaseInitialized`, `getDatabasePath`, `flushDatabase`
- `database-lifecycle.ts`: `closeDatabase`, `resetDatabase`, `resetDatabaseInstance`

- [ ] **Step 2: Split appSettings.ts**

- `sandbox-settings.ts`: `getSandboxConfig`, `setSandboxConfig`
- `cloud-browser-settings.ts`: `getCloudBrowserConfig`, `setCloudBrowserConfig`
- `messaging-settings.ts`: `getMessagingConfig`, `setMessagingConfig`
- `app-settings-aggregate.ts`: `getAppSettings`, `clearAppSettings`

- [ ] **Step 3: Split connectors.ts**

- `connector-queries.ts`: `getAllConnectors`, `getEnabledConnectors`, `getConnectorById`
- `connector-mutations.ts`: `upsertConnector`, `setConnectorEnabled`, `setConnectorStatus`, `deleteConnector`, `clearAllConnectors`

- [ ] **Step 4: Split scheduled-tasks.ts**

- `scheduled-task-queries.ts`: `getAllScheduledTasks`, `getEnabledScheduledTasks`, `getScheduledTasksByWorkspace`, `getScheduledTaskById`
- `scheduled-task-mutations.ts`: `createScheduledTask`, `deleteScheduledTask`, `setScheduledTaskEnabled`, `updateScheduledTaskLastRun`

- [ ] **Step 5: Verify and commit**

```bash
pnpm check && pnpm -F @myboteam/agent-core test
git add packages/agent-core/src/storage/database*.ts packages/agent-core/src/storage/repositories/sandbox-settings*.ts packages/agent-core/src/storage/repositories/cloud-browser-settings*.ts packages/agent-core/src/storage/repositories/messaging-settings*.ts packages/agent-core/src/storage/repositories/app-settings-aggregate*.ts packages/agent-core/src/storage/repositories/connector-*.ts packages/agent-core/src/storage/repositories/scheduled-task-*.ts
git commit -m "refactor(agent-core): split database, appSettings, connectors, scheduled-tasks"
```

### Task 10: Split opencode/auth.ts (8 exports)

**Files:**
- Create: `packages/agent-core/src/opencode/auth-paths.ts`
- Create: `packages/agent-core/src/opencode/auth-openai-status.ts`
- Create: `packages/agent-core/src/opencode/auth-openai-plan.ts`
- Create: `packages/agent-core/src/opencode/auth-write.ts`
- Modify: `packages/agent-core/src/opencode/auth.ts`

- [ ] **Step 1: Split by domain**

- `auth-paths.ts`: `getOpenCodeDataHome`, `getOpenCodeAuthJsonPath`, `getOpenCodeAuthPath`
- `auth-openai-status.ts`: `getOpenAiOauthStatus`, `getOpenAiOauthAccessToken`
- `auth-openai-plan.ts`: `readOpenAiOauthPlan`, `detectOpenAiOauthPlan`
- `auth-write.ts`: `writeOpenCodeAuth`

- [ ] **Step 2: Verify and commit**

```bash
pnpm check && pnpm -F @myboteam/agent-core test
git add packages/agent-core/src/opencode/auth-paths*.ts packages/agent-core/src/opencode/auth-openai*.ts packages/agent-core/src/opencode/auth-write*.ts
git commit -m "refactor(agent-core): split auth.ts into domain files"
```

### Task 11: Split remaining agent-core files (6-7 exports each)

**Files to split (11 files):**
1. `adapter-session.ts` (7) → `adapter-session-lifecycle.ts` + `adapter-session-watchdog.ts`
2. `skill-importer.ts` (7) → `skill-importer-validate.ts` + `skill-importer-actions.ts`
3. `task-manager-lifecycle.ts` (7) → `task-cancel.ts` + `task-cleanup.ts` + `task-queue.ts`
4. `models.ts` (7) → `models-by-provider.ts` + `models-validation.ts`
5. `knowledgeNotes.ts` (7) → `knowledge-note-crud.ts` + `knowledge-note-formatter.ts`
6. `skills.ts` (7) → `skill-queries.ts` + `skill-mutations.ts`
7. `paths.ts` (7) → `path-defaults.ts` + `path-resolve.ts`
8. `skill-parser.ts` (6) → `skill-parser-frontmatter.ts` + `skill-parser-fs.ts`
9. `cli-path-utils.ts` (6) → `cli-platform.ts` + `cli-resolve-paths.ts`
10. `auth-slack-mcp.ts` (6) → `auth-slack-mcp-constants.ts` (consts only, already compliant) + `auth-slack-mcp-functions.ts` (functions)
11. `browser-node-env.ts` (6) → `browser-env.ts` + `browser-install.ts` + `browser-wait.ts`

- [ ] **Step 1: Split adapter-session.ts**

Create `adapter-session-lifecycle.ts` with (`runEventSubscription`, `abortSession`, `teardown`, `markTaskComplete`) and `adapter-session-watchdog.ts` with (`startWatchdog`, `sampleWatchdogState`, `handleWatchdogHardTimeout`). Update original to barrel re-export.

- [ ] **Step 2: Split skill-importer.ts**

Create `skill-importer-validate.ts` with (`validateSkillFrontmatter`, `prepareSkillDir`) and `skill-importer-actions.ts` with (`persistSkill`, `addFromFile`, `addFromFolder`, `resolveGithubRawUrl`, `addFromUrl`).

- [ ] **Step 3: Split task-manager-lifecycle.ts**

Create `task-cancel.ts` with (`cancelTask`, `interruptTask`, `cancelQueuedTask`, `cancelAllTasks`), `task-cleanup.ts` with (`cleanupTask`, `dispose`), and `task-queue.ts` with (`processQueue`).

- [ ] **Step 4: Split models.ts**

Create `models-by-provider.ts` with (`getModelsForProvider`, `getDefaultModelForProvider`, `getProviderById`) and `models-validation.ts` with (`isValidModel`, `findModelById`, `providerRequiresApiKey`, `getApiKeyEnvVar`).

- [ ] **Step 5: Split knowledgeNotes.ts**

Create `knowledge-note-crud.ts` with (`listKnowledgeNotes`, `getKnowledgeNote`, `createKnowledgeNote`, `updateKnowledgeNote`, `deleteKnowledgeNote`) and `knowledge-note-formatter.ts` with (`getFormattedKnowledgeNotes`, `getKnowledgeNotesForPrompt`).

- [ ] **Step 6: Split skills.ts**

Create `skill-queries.ts` with (`getAllSkills`, `getEnabledSkills`, `getSkillById`) and `skill-mutations.ts` with (`upsertSkill`, `setSkillEnabled`, `deleteSkill`, `clearAllSkills`).

- [ ] **Step 7: Split paths.ts**

Create `path-defaults.ts` with (`getDefaultUserDataPath`, `getDefaultTempPath`, `createDefaultPlatformConfig`) and `path-resolve.ts` with (`resolveUserDataPath`, `resolveResourcesPath`, `resolveAppPath`, `getMcpToolsPath`).

- [ ] **Step 8: Split skill-parser.ts**

Create `skill-parser-frontmatter.ts` with (`parseFrontmatter`, `normalizeSkillSlug`, `generateId`, `sanitizeSkillName`) and `skill-parser-fs.ts` with (`isPathWithinDirectory`, `scanDirectory`).

- [ ] **Step 9: Split cli-path-utils.ts**

Create `cli-platform.ts` with (`detectWindowsAvx2Support`, `getWindowsPackageNames`, `getLinuxPackageNames`, `getOpenCodePlatformInfo`) and `cli-resolve-paths.ts` with (`getCandidateAppRoots`, `resolveWindowsCliFromLauncher`).

- [ ] **Step 10: Split auth-slack-mcp.ts**

Move all const exports (already <5) to `auth-slack-mcp-constants.ts`. Move the 6 function exports to `auth-slack-mcp-functions.ts`. Original barrel re-exports both.

- [ ] **Step 11: Split browser-node-env.ts**

Create `browser-env.ts` with (`buildNodeEnvironment`, `getNodeExecutable`, `resolvePlaywrightCliPath`), `browser-install.ts` with (`installPlaywrightChromium`), and `browser-wait.ts` with (`isDevBrowserServerReady`, `waitForDevBrowserServer`).

- [ ] **Step 12: Verify and commit**

```bash
pnpm check && pnpm -F @myboteam/agent-core test
git add -A packages/agent-core/src/
git commit -m "refactor(agent-core): split remaining files with >5 exports"
```

---

## daemon workspace

### Task 12: Split daemon files with >5 exports (3 files)

**Files:**
- Create: `apps/daemon/src/google-account-constants.ts`, `google-account-types-queries.ts`
- Create: `apps/daemon/src/task-service-queries.ts`, `task-service-mutations.ts`
- Create: `apps/daemon/src/whatsapp/task-bridge-rate-limit-config.ts`, `task-bridge-rate-limit-queries.ts`
- Modify: originals

- [ ] **Step 1: Read and split each file**

- `google-account-types.ts` (8 exports): split by entity group
- `task-service-utils.ts` (8 exports): split into queries/mutations
- `whatsapp/task-bridge-rate-limit.ts` (6 exports): split into config/queries

- [ ] **Step 2: Verify and commit**

```bash
pnpm check && pnpm -F @myboteam/agent-core test
git add -A apps/daemon/src/
git commit -m "refactor(daemon): split files with >5 exports"
```

---

## desktop workspace

### Task 13: Split desktop analytics files (3 files, ~47 exports combined)

**Files:**
- Create: Multiple new files in `apps/desktop/src/main/analytics/`
- Modify: `analytics-service-utils.ts`, `event-trackers.ts`, `event-trackers-feature.ts`, `event-trackers-task-interaction.ts`

- [ ] **Step 1: Read and split analytics-service-utils.ts (19 exports)**

Split into multiple files by utility domain (e.g., `-formatting.ts`, `-queries.ts`, `-aggregation.ts`).

- [ ] **Step 2: Read and split event-trackers.ts (19 exports)**

Split into files grouped by event category.

- [ ] **Step 3: Read and split event-trackers-feature.ts (21 exports)**

Split into files grouped by feature area.

- [ ] **Step 4: Read and split event-trackers-task-interaction.ts (7 exports)**

Split into 2 files if logical groupings exist.

- [ ] **Step 5: Verify and commit**

```bash
pnpm check && pnpm -F @myboteam/desktop test
git add -A apps/desktop/src/main/analytics/
git commit -m "refactor(desktop): split analytics files with >5 exports"
```

### Task 14: Split remaining desktop files (7 files)

**Files:**
- Create: Multiple new files
- Modify: `build-config.ts`, `daemon-connector.ts`, `browser-preview-utils.ts`, `secureStorage.ts`, `workspaceManager.ts`, `state.ts`, `bundled-node.ts`

- [ ] **Step 1: Split each file by logical concern**

For each file (all have 6-10 exports), read and split into domain groups.

| File | Exports | Suggested split |
|------|---------|----------------|
| `daemon-connector.ts` | 9 | `-lifecycle.ts` (start/stop/restart), `-status.ts` (status queries) |
| `workspaceManager.ts` | 10 | `-crud.ts`, `-active.ts`, `-config.ts` |
| `state.ts` | 10 | `-getters.ts`, `-setters.ts` |
| `browser-preview-utils.ts` | 8 | by utility domain |
| `secureStorage.ts` | 8 | by operation type |
| `build-config.ts` | 6 | single file, if logical split exists |
| `bundled-node.ts` | 6 | single file, if logical split exists |

- [ ] **Step 2: Verify and commit**

```bash
pnpm check && pnpm -F @myboteam/desktop test
git add -A apps/desktop/src/
git commit -m "refactor(desktop): split remaining files with >5 exports"
```

---

## web workspace

### Task 15: Split .tsx files with >1 component (16 files, excluding shadcn/ui)

**Files to split:**

| File | Components | Split into |
|------|-----------|------------|
| `App.components.tsx` | 2 | keep `AnimatedOutlet`, extract `AnimatedOutletWrapper` |
| `BrowserScriptCard.tsx` | 2 | keep `BrowserScriptCard`, extract `SpinningIcon` |
| `BrowserScriptCardHelpers.tsx` | 2 | keep `BrowserScriptCardHelpers`, extract `ActionChip` and `Arrow` (note: original says 3 but audit says 2) |
| `TaskHistory.tsx` | 2 | keep `TaskHistory`, extract `TaskHistoryItem` |
| `Header.tsx` | 2 | keep `Header`, extract `NavLink` |
| `Sidebar.tsx` | 2 | keep `Sidebar`, extract `NavItem` |
| `GoogleLabelDialog.tsx` | 2 | keep `GoogleLabelDialog`, extract `GoogleLabelDialogInner` |
| `HuggingFaceProviderForm.tsx` | 2 | keep `HuggingFaceProviderForm`, extract `DownloadProgressBar` |
| `LiteLLMFormSections.tsx` | 2 | keep `LiteLLMConnectedSection`, extract `LiteLLMDisconnectedForm` |
| `myboteam-ai-utils.tsx` | 4 | extract `UsageSkeleton`, `ConnectionRetryNotice`, `UsageRetryNotice`; keep `UsagePanel` |
| `NimFormSections.tsx` | 2 | keep `ConnectedNimDetails`, extract `DisconnectedNimForm` |
| `WorkspacePanelForm.tsx` | 3 | extract `ColorPicker`, `CreateWorkspaceForm`; keep `EditWorkspaceForm` |
| `TodoSidebar.tsx` | 3 | extract `TodoListItem`, `StatusIcon`; keep `TodoSidebar` |
| `ExecutionHeader.tsx` | 2 | keep `ExecutionHeader`, extract `StatusBadge` |
| `FollowUpAttachments.tsx` | 2 | keep `FollowUpAttachments`, extract `DragOverlay` |
| `QueuedState.tsx` | 2 | keep `QueuedWithMessages`, extract `QueuedEmptyState` |

- [ ] **Step 1: Process 4 files from layout/components**

Split `Header.tsx` (extract `NavLink`), `Sidebar.tsx` (extract `NavItem`), `TodoSidebar.tsx` (extract `TodoListItem`, `StatusIcon`), `BrowserScriptCard.tsx` (extract `SpinningIcon`), `BrowserScriptCardHelpers.tsx` (extract `ActionChip`, `Arrow`).

For each: create new file named after the extracted component, update the original to import from the new file, update all consumer imports.

- [ ] **Step 2: Process 4 files from pages**

Split `ExecutionHeader.tsx` (extract `StatusBadge`), `FollowUpAttachments.tsx` (extract `DragOverlay`), `QueuedState.tsx` (extract `QueuedEmptyState`), `App.components.tsx` (extract `AnimatedOutletWrapper`).

- [ ] **Step 3: Process 4 files from providers/settings**

Split `myboteam-ai-utils.tsx` (extract 3 components), `NimFormSections.tsx` (extract `DisconnectedNimForm`), `LiteLLMFormSections.tsx` (extract `LiteLLMDisconnectedForm`), `HuggingFaceProviderForm.tsx` (extract `DownloadProgressBar`).

- [ ] **Step 4: Process remaining 4 files**

Split `WorkspacePanelForm.tsx` (extract `ColorPicker`, `CreateWorkspaceForm`), `TaskHistory.tsx` (extract `TaskHistoryItem`), `GoogleLabelDialog.tsx` (extract `GoogleLabelDialogInner`).

- [ ] **Step 5: Verify and commit**

```bash
pnpm check && pnpm -F @myboteam/web test
git add -A apps/web/src/client/
git commit -m "refactor(web): split .tsx files into one component per file"
```

---

### Task 16: Final full verification

- [ ] **Step 1: Run full verification**

```bash
pnpm check && pnpm -F @myboteam/web test && pnpm -F @myboteam/desktop test && pnpm -F @myboteam/agent-core test
```

Expected: All checks pass. All files comply with the 4 rules.

- [ ] **Step 2: Verify compliance**

Run a manual check:
```bash
# Check for .js files in source (should be 0, ignoring config)
find packages apps -name "*.js" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.worktrees/*" | grep -v postcss.config
# Expected: no output

# Check for .tsx files with >1 default export
# Check for .ts files with >1 class
# Check for .ts files with >5 exported functions
```

If all pass, commit the final verification:
```bash
git commit --allow-empty -m "chore: final verification of TS structure rules"
```
