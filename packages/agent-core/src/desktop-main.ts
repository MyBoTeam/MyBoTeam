// =============================================================================
// @myboteam/agent-core/desktop-main
// =============================================================================
// Safe entrypoint for the Electron main process. Every export re-exports from
// a concrete source module that is DB-free (i.e. does NOT transitively import
// `./storage/database.ts` or any storage module).
//
// Invariant: re-exports MUST point at concrete files (e.g. `./daemon/client.js`),
// never at a barrel like `./index.js`, `./daemon/index.js`, or `./common.js`.
// Barrels drag in side-effects and dependency graphs we don't want — that is
// the exact bundling hazard this entrypoint is meant to eliminate.
//
// Milestone 1 of the daemon-only-SQLite migration
// (plan: /Users/yanai/.claude/plans/squishy-exploring-hamster.md).
// =============================================================================

// Dev-browser server lifecycle (child_process + fs only)
export { shutdownDevBrowserServer } from './browser/server.js';
// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
export { DEV_BROWSER_CDP_PORT, DEV_BROWSER_PORT } from './common/constants.js';
// Validation schemas (zod; runtime-safe)
export {
  permissionResponseSchema,
  resumeSessionSchema,
  taskConfigSchema,
  validate,
} from './common/schemas/validation.js';
export type { BedrockCredentials, VertexCredentials } from './common/types/auth.js';
// M2 scope-completeness follow-up: the built-in connector auth-store blob
// that M3 repoints `connector-auth-entry.ts` onto. Lives in
// `common/types/connector.ts` because it's a shared data contract, not a
// daemon-specific payload.
export type {
  McpConnector,
  OAuthClientRegistration,
  OAuthMetadata,
  StoredAuthEntry,
} from './common/types/connector.js';
// Milestone 2 of the daemon-only-SQLite migration. M3 uses these payload
// types to type-check renderer subscriptions to the daemon's
// `settings.changed` and `workspace.changed` notifications, and to type
// the result shape for M5's first-frame `settings.getAll` read.
export type {
  // Milestone 4 — daemon-owned Google accounts + skills notification payloads.
  GwsAccountAddInput,
  GwsAccountStatusChangedPayload,
  GwsAccountTokenResult,
  SettingsChangePayload,
  SettingsSnapshot,
  SkillsChangedPayload,
  WorkspaceChangePayload,
  WorkspaceDeleteResult,
  WorkspaceSetActiveResult,
} from './common/types/daemon.js';
export type { CreditUsage } from './common/types/gateway.js';
export type {
  GoogleAccount,
  GoogleAccountStatus,
  GoogleAccountToken,
} from './common/types/google-account.js';
// Logging types (shared across LogWriter wrappers in main)
export type { LogEntry, LogLevel, LogSource } from './common/types/logging.js';
export type {
  ApiKeyProvider,
  AzureFoundryConfig,
  HuggingFaceLocalConfig,
  LiteLLMConfig,
  LMStudioConfig,
  NimConfig,
  OllamaConfig,
  ProviderType,
  SelectedModel,
} from './common/types/provider.js';
export {
  ALLOWED_API_KEY_PROVIDERS,
  DEFAULT_PROVIDERS,
  STANDARD_VALIDATION_PROVIDERS,
  ZAI_ENDPOINTS,
} from './common/types/provider.js';
export type {
  ConnectedProvider,
  MyboteamAiCredentials,
  ProviderId,
  ZaiRegion,
} from './common/types/providerSettings.js';
export type { Skill } from './common/types/skills.js';
export type { FileAttachmentInfo, Task, TaskConfig, TaskMessage } from './common/types/task.js';
export type { TodoItem } from './common/types/todo.js';
export type {
  KnowledgeNote,
  KnowledgeNoteCreateInput,
  KnowledgeNoteUpdateInput,
  Workspace,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
} from './common/types/workspace.js';
// -----------------------------------------------------------------------------
// ID utilities
// -----------------------------------------------------------------------------
export { createMessageId, createTaskId } from './common/utils/id.js';
// IPC-related re-exports (daemon RPC, OAuth, OpenCode auth)
export * from './desktop-main-ipc.js';
export { createLogWriter } from './factories/log-writer.js';
// Speech service factory (uses SecureStorage for API key — SecureStorage is
// file-based AES, no SQLite)
export { createSpeechService } from './factories/speech.js';
export { testAzureFoundryConnection, validateAzureFoundry } from './providers/azure-foundry.js';
export { fetchBedrockModels, validateBedrockCredentials } from './providers/bedrock.js';
export type {
  CopilotDeviceCodeResponse,
  CopilotOAuthStatus,
  CopilotTokenResponse,
} from './providers/copilot.js';
// GitHub Copilot device OAuth (pure HTTP)
export {
  clearCopilotOAuth,
  getCopilotOAuthStatus,
  pollCopilotDeviceToken,
  requestCopilotDeviceCode,
  setCopilotOAuthTokens,
} from './providers/copilot.js';
export { testCustomConnection } from './providers/custom.js';
export { fetchProviderModels } from './providers/fetch-models.js';
export { fetchLiteLLMModels, testLiteLLMConnection } from './providers/litellm.js';
export {
  fetchLMStudioModels,
  testLMStudioConnection,
  validateLMStudioConfig,
} from './providers/lmstudio.js';
export { fetchNimModels, testNimConnection } from './providers/nim.js';
export { testOllamaConnection } from './providers/ollama.js';
export { fetchOpenRouterModels } from './providers/openrouter.js';
// -----------------------------------------------------------------------------
// Provider validation & model discovery (pure HTTP)
// -----------------------------------------------------------------------------
export { validateApiKey } from './providers/validation.js';
export { fetchVertexModels, validateVertexCredentials } from './providers/vertex.js';
export type { GetApiKeyFn } from './services/summarizer.js';
// Task summary generator (pure LLM HTTP call)
export { generateTaskSummary } from './services/summarizer.js';
// -----------------------------------------------------------------------------
// Schema error class (pure class, no DB imports)
// -----------------------------------------------------------------------------
export { FutureSchemaError } from './storage/migrations/errors.js';
export type { LogWriterAPI, LogWriterOptions } from './types/log-writer.js';
export type {
  SpeechServiceAPI,
  SpeechServiceOptions,
  TranscriptionError,
  TranscriptionResult,
} from './types/speech.js';
export type { SecureStorageAPI } from './types/storage.js';
export type {
  TaskCallbacks,
  TaskManagerAPI,
  TaskManagerOptions,
  TaskProgressEvent,
} from './types/task-manager.js';
// -----------------------------------------------------------------------------
// Pure types used by Electron main
// -----------------------------------------------------------------------------
export type { CliResolverConfig, PlatformConfig, ResolvedCliPaths } from './types.js';
export type { BundledNodePathsExtended } from './utils/bundled-node.js';
export {
  getBundledNodePaths,
  getNodePath,
  getNpmPath,
  getNpxPath,
  isBundledNodeAvailable,
  logBundledNodeInfo,
} from './utils/bundled-node.js';
export { redact } from './utils/redact.js';
// -----------------------------------------------------------------------------
// Pure utilities
// -----------------------------------------------------------------------------
export { sanitizeString } from './utils/sanitize.js';
export { findCommandInPath, getExtendedNodePath } from './utils/system-path.js';
export { validateHttpUrl } from './utils/url.js';
