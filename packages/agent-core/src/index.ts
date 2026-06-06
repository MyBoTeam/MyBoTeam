// =============================================================================
// @myboteam/core - Public API (v0.4.0)
// =============================================================================
// This file explicitly exports the public API for the @myboteam/core package.
// All exports are explicit named exports to ensure API stability and clarity.
// =============================================================================

// -----------------------------------------------------------------------------
// Factory Functions (NEW - Preferred API)
// -----------------------------------------------------------------------------
// Use these factory functions instead of directly instantiating classes.
// Factories return interfaces, hiding internal implementation details.

// Factory functions - new encapsulated API
export {
  createLogWriter,
  createPermissionHandler,
  createSkillsManager,
  createSpeechService,
  createStorage,
  createTaskManager,
} from './factories/index.js';

export { createSandboxProvider } from './factories/sandbox.js';

// -----------------------------------------------------------------------------
// API Interfaces (NEW - Public contracts)
// -----------------------------------------------------------------------------
// These interfaces define the public API contracts returned by factory functions.

// Preferred API names (aliased for clarity)
// Backward-compatible re-exports (original names)
export type {
  AppSettings,
  AppSettingsAPI,
  DatabaseLifecycleAPI,
  FilePermissionRequestData as PermissionFileRequestData,
  LogEntry as LogWriterEntry,
  // Log Writer API
  LogWriterAPI,
  LogWriterOptions,
  OnBeforeStartContext,
  OnBeforeStartResult,
  // Permission Handler API
  PermissionHandlerAPI,
  PermissionHandlerOptions,
  PermissionValidationResult,
  ProviderSettingsAPI,
  QuestionRequestData as PermissionQuestionRequestData,
  QuestionResponseData as PermissionQuestionResponseData,
  SecureStorageAPI,
  // Skills Manager API
  SkillsManagerAPI,
  SkillsManagerOptions,
  // Speech Service API
  SpeechServiceAPI,
  SpeechServiceOptions,
  // Storage API
  StorageAPI,
  StorageOptions,
  StoredFavorite,
  StoredTask,
  TaskAdapterOptions,
  TaskCallbacks as TaskManagerCallbacks,
  TaskCallbacks,
  // Task Manager API
  TaskManagerAPI,
  TaskManagerOptions as TaskManagerFactoryOptions,
  TaskManagerOptions,
  TaskProgressEvent as TaskManagerProgressEvent,
  TaskProgressEvent,
  TaskStorageAPI,
  ThemeColorPreference,
  ThemePreference,
  TranscriptionError as SpeechTranscriptionError,
  TranscriptionError,
  TranscriptionResult as SpeechTranscriptionResult,
  TranscriptionResult,
} from './types/index.js';

// -----------------------------------------------------------------------------
// Types (from ./types.ts)
// -----------------------------------------------------------------------------
export type {
  BundledNodePaths,
  CliResolverConfig,
  PlatformConfig,
  ResolvedCliPaths,
} from './types.js';

// -----------------------------------------------------------------------------
// OpenCode Module (from ./opencode/)
// -----------------------------------------------------------------------------

// Error classes (still exported - these are safe)
export { OpenCodeCliNotFoundError } from './internal/classes/adapter-types.js';
// Adapter types - AdapterOptions/OpenCodeAdapterEvents are internal (use TaskAdapterOptions)
// createLogWatcher/OpenCodeLogError are internal (used by OpenCodeAdapter internally)

// Low-level OpenCode utilities for advanced integrations
export { isCliAvailable, resolveCliPath } from './opencode/cli-resolver.js';
export { generateConfig, MYBOTEAM_AGENT_NAME } from './opencode/config-generator.js';

// Phase 4b of the OpenCode SDK cutover port deleted `./opencode/cli-args.js`
// (the SDK adapter uses `session.prompt`, not CLI args).

export type { OpenAiOauthPlan } from './common/types/providerSettings.js';
export {
  OPENAI_OAUTH_FREE_MODEL_IDS,
  OPENAI_OAUTH_MODEL_IDS,
} from './common/types/providerSettings.js';
export type { DetectOpenAiOauthPlanOptions, OpenCodeMcpOauthStatus } from './opencode/auth.js';
export {
  clearSlackMcpAuth,
  detectOpenAiOauthPlan,
  getOpenAiOauthAccessToken,
  // Re-exported so the daemon's OAuth manager
  // (`apps/daemon/src/opencode/auth-openai.ts`) can consume them through
  // agent-core's public surface. Desktop MUST NOT import these directly —
  // Phase 4a of the SDK cutover port routes desktop's status / access-token
  // reads through the daemon's `auth.openai.*` RPCs so desktop and daemon
  // agree on auth.json path (XDG drift would otherwise produce silent
  // fallbacks to the hardcoded OpenAI model list).
  //
  // The verification grep in the plan enforces this:
  //   grep -rnE "import.*getOpenAiOauth(Status|AccessToken)" apps packages \
  //     | grep -vE "packages/agent-core/src/opencode/|apps/daemon/src/opencode/auth-openai\.ts"
  //   # expected: zero hits
  getOpenAiOauthStatus,
  getOpenCodeAuthJsonPath,
  getOpenCodeAuthPath,
  getOpenCodeMcpAuthJsonPath,
  getSlackMcpCallbackUrl,
  getSlackMcpOauthStatus,
  OPENCODE_SLACK_MCP_CALLBACK_HOST,
  OPENCODE_SLACK_MCP_CALLBACK_PATH,
  OPENCODE_SLACK_MCP_CALLBACK_PORT,
  OPENCODE_SLACK_MCP_CLIENT_ID,
  OPENCODE_SLACK_MCP_SERVER_URL,
  readOpenAiOauthPlan,
  setSlackMcpPendingAuth,
  setSlackMcpTokens,
} from './opencode/auth.js';
export { buildProviderConfigs, syncApiKeysToOpenCodeAuth } from './opencode/config-builder.js';
export type { EnvironmentConfig } from './opencode/environment.js';
export { buildOpenCodeEnvironment } from './opencode/environment.js';
export type { BrowserConfig } from './opencode/generator-mcp.js';
export { sanitizeAssistantTextForDisplay } from './opencode/message-processor.js';
export type { SdkSelectedModelRef } from './opencode/model-runtime-mapping.js';
// SDK-era model-runtime mapping (port of commercial 1a320029). Normalises OSS
// `SelectedModel` into the `{ providerID, modelID }` shape the OpenCode SDK v2
// session.prompt API expects. Populated in Phase 2 when the daemon constructs
// the adapter's `AdapterOptions.getServerUrl` + selected-model plumbing.
export {
  normalizeSelectedModelForSdk,
  resolveLlamaCppRuntimeModelName,
} from './opencode/model-runtime-mapping.js';
export type {
  ResolvedTaskConfig,
  ResolveTaskConfigOptions,
} from './opencode/resolve-task-config.js';
// `resolveTaskConfig` was retained at merge time (rather than fully deleted in
// Phase 4b of the SDK cutover port) because the desktop config-generator —
// which on `main` was extended with GWS manifest preparation in #921 — still
// imports it. The function is dead at runtime under SDK architecture (the
// daemon owns config generation via `apps/daemon/src/task-config-builder.ts`)
// but kept for type compatibility until the desktop config-generator is
// either rewritten for the SDK era or deleted as part of GWS daemon-side wiring.
export { resolveTaskConfig } from './opencode/resolve-task-config.js';

// Message processing is now internal to TaskManager (use onBatchedMessages callback)
// CompletionEnforcerCallbacks is internal (wiring between adapter and enforcer)
// Proxy lifecycle is now internal to TaskManager.dispose()

export type {
  MyboteamConnectResult,
  MyboteamRuntime,
  StorageDeps,
} from './opencode/myboteam-runtime.js';

// MyBoTeam AI runtime adapter
export { noopRuntime } from './opencode/myboteam-runtime.js';
export { getAzureEntraToken } from './opencode/proxies/index.js';

// -----------------------------------------------------------------------------
// Storage Module (from ./storage/)
// -----------------------------------------------------------------------------

// Errors
export { FutureSchemaError } from './storage/migrations/errors.js';
// Knowledge Notes repository
export {
  createKnowledgeNote,
  deleteKnowledgeNote,
  getKnowledgeNote,
  getKnowledgeNotesForPrompt,
  listKnowledgeNotes,
  updateKnowledgeNote,
} from './storage/repositories/knowledgeNotes.js';
export { getEnabledSkills } from './storage/repositories/skills.js';
// Workspace repository
export {
  createDefaultWorkspace,
  createWorkspace as createWorkspaceRecord,
  deleteWorkspace as deleteWorkspaceRecord,
  getActiveWorkspaceId,
  getDefaultWorkspace,
  getWorkspace,
  listWorkspaces,
  setActiveWorkspaceId,
  updateWorkspace as updateWorkspaceRecord,
} from './storage/repositories/workspaces.js';

// -----------------------------------------------------------------------------
// Providers Module (from ./providers/)
// -----------------------------------------------------------------------------

export { testAzureFoundryConnection, validateAzureFoundry } from './providers/azure-foundry.js';

export { fetchBedrockModels, validateBedrockCredentials } from './providers/bedrock.js';
export type {
  CopilotDeviceCodeResponse,
  CopilotOAuthStatus,
  CopilotTokenResponse,
} from './providers/copilot.js';
export {
  clearCopilotOAuth,
  GITHUB_COPILOT_AUTH_URL,
  GITHUB_COPILOT_OAUTH_CLIENT_ID,
  getCopilotOAuthStatus,
  pollCopilotDeviceToken,
  requestCopilotDeviceCode,
  setCopilotOAuthTokens,
} from './providers/copilot.js';
export { testCustomConnection } from './providers/custom.js';
export type { FetchProviderModelsResult } from './providers/fetch-models.js';
export { fetchProviderModels } from './providers/fetch-models.js';
export { fetchLiteLLMModels, testLiteLLMConnection } from './providers/litellm.js';
export {
  fetchLMStudioModels,
  testLMStudioConnection,
  validateLMStudioConfig,
} from './providers/lmstudio.js';
export { fetchNimModels, NIM_DEFAULT_BASE_URL, testNimConnection } from './providers/nim.js';
export { testOllamaConnection } from './providers/ollama.js';
export { fetchOpenRouterModels } from './providers/openrouter.js';
export { testOllamaModelToolSupport } from './providers/tool-support-testing.js';
// Validation functions
export { validateApiKey } from './providers/validation.js';
export { fetchVertexModels, VertexClient, validateVertexCredentials } from './providers/vertex.js';

// -----------------------------------------------------------------------------
// Utils Module (from ./utils/)
// -----------------------------------------------------------------------------

export type {
  GwsAccountEntry,
  GwsAccountSummary,
  PrepareGwsManifestResult,
} from './google-accounts/index.js';
// Google Workspace account manifest helper (daemon-portable). The desktop
// side keeps its own `AccountManager` / `TokenManager` singletons; agent-core
// exports only the stateless pieces the daemon needs for per-task manifest
// generation at `onBeforeStart` time.
export {
  GOOGLE_TOKEN_ENDPOINT,
  gwsTokenKey,
  prepareGwsManifest,
  TOKEN_REFRESH_MARGIN_MS,
} from './google-accounts/index.js';
export type { BundledNodePathsExtended } from './utils/bundled-node.js';
// Bundled Node.js binary path resolution
export {
  getBundledNodePaths,
  getNodePath,
  getNpmPath,
  getNpxPath,
  isBundledNodeAvailable,
  logBundledNodeInfo,
} from './utils/bundled-node.js';
export type { SafeParseResult } from './utils/json.js';
// JSON parsing functions
export { safeParseJson } from './utils/json.js';
// Redaction functions
export { redact } from './utils/redact.js';
// Sanitization functions
export { PROMPT_DEFAULT_MAX_LENGTH, sanitizeString } from './utils/sanitize.js';
// System PATH resolution
export { findCommandInPath, getExtendedNodePath } from './utils/system-path.js';
export { mapResultToStatus } from './utils/task-status.js';
// Task validation functions
export { validateTaskConfig } from './utils/task-validation.js';
// URL validation functions
export { validateHttpUrl } from './utils/url.js';

// Logging - use createLogWriter factory from ./factories/log-writer.js instead

// -----------------------------------------------------------------------------
// Browser Module (from ./browser/)
// -----------------------------------------------------------------------------

export type { BrowserServerConfig } from './browser/server.js';
// Browser server for dev-browser MCP tool
export { ensureDevBrowserServer, shutdownDevBrowserServer } from './browser/server.js';

// -----------------------------------------------------------------------------
// Services Module (from ./services/)
// -----------------------------------------------------------------------------

export type { GetApiKeyFn } from './services/summarizer.js';
// Summarizer functions
export { generateTaskSummary } from './services/summarizer.js';

// -----------------------------------------------------------------------------
// Skills Module (from ./skills/)
// -----------------------------------------------------------------------------

// Use createSkillsManager factory from ./factories/skills-manager.js instead

// -----------------------------------------------------------------------------
// Shared Module (from ./common/) - Merged from @myboteam/shared
// -----------------------------------------------------------------------------

export {
  getModelDisplayName,
  MODEL_DISPLAY_NAMES,
  PROVIDER_PREFIXES,
} from './common/constants/model-display.js';
// Constants
export {
  CONNECTOR_AUTH_REQUIRED_MARKER,
  DEV_BROWSER_CDP_PORT,
  DEV_BROWSER_PORT,
  LOG_BUFFER_FLUSH_INTERVAL_MS,
  LOG_BUFFER_MAX_ENTRIES,
  LOG_MAX_FILE_SIZE_BYTES,
  LOG_RETENTION_DAYS,
  PERMISSION_REQUEST_TIMEOUT_MS,
  WHATSAPP_API_PORT,
} from './common/constants.js';
// Schemas
export {
  authOpenAiAwaitCompletionSchema,
  permissionResponseSchema,
  resumeSessionSchema,
  taskConfigSchema,
  validate,
} from './common/schemas/validation.js';
// Auth types
export type {
  ApiKeyConfig,
  BedrockAccessKeyCredentials,
  BedrockApiKeyCredentials,
  BedrockCredentials,
  BedrockProfileCredentials,
  VertexAdcCredentials,
  VertexCredentials,
  VertexServiceAccountCredentials,
} from './common/types/auth.js';
export type {
  ConnectorStatus,
  McpConnector,
  OAuthClientRegistration,
  OAuthMetadata,
  OAuthTokens,
  StoredAuthEntry,
} from './common/types/connector.js';
// Connector types
export {
  getOAuthProviderDisplayName,
  isOAuthProviderId,
  OAuthProviderId,
} from './common/types/connector.js';
export type { CreditUsage } from './common/types/gateway.js';
export type { LogEntry, LogLevel, LogSource } from './common/types/logging.js';
// OpenCode message types
export type {
  OpenCodeErrorMessage,
  OpenCodeMessage,
  OpenCodeMessageBase,
  OpenCodeStepFinishMessage,
  OpenCodeStepStartMessage,
  OpenCodeTextMessage,
  OpenCodeToolCallMessage,
  OpenCodeToolResultMessage,
  OpenCodeToolUseMessage,
} from './common/types/opencode.js';
// Permission types
export type {
  FileOperation,
  PermissionOption,
  PermissionRequest,
  PermissionResponse,
} from './common/types/permission.js';
export {
  FILE_OPERATIONS,
  FILE_PERMISSION_REQUEST_PREFIX,
  QUESTION_REQUEST_PREFIX,
} from './common/types/permission.js';
// Provider types
export type {
  ApiKeyProvider,
  AzureFoundryConfig,
  HuggingFaceLocalConfig,
  HuggingFaceLocalModelInfo,
  LiteLLMConfig,
  LiteLLMModel,
  LMStudioConfig,
  ModelConfig,
  ModelsEndpointConfig,
  NimConfig,
  NimModel,
  OllamaConfig,
  ProviderConfig,
  ProviderType,
  SelectedModel,
} from './common/types/provider.js';
export {
  ALLOWED_API_KEY_PROVIDERS,
  COPILOT_MODELS,
  DEFAULT_MODEL,
  DEFAULT_PROVIDERS,
  STANDARD_VALIDATION_PROVIDERS,
  ZAI_ENDPOINTS,
} from './common/types/provider.js';
// Provider settings types
export type {
  ApiKeyCredentials,
  AzureFoundryCredentials,
  BedrockProviderCredentials,
  ConnectedProvider,
  ConnectionStatus,
  CopilotOAuthCredentials,
  CustomCredentials,
  LiteLLMCredentials,
  LMStudioCredentials,
  MyboteamAiCredentials,
  NimCredentials,
  OAuthCredentials,
  OllamaCredentials,
  OpenRouterCredentials,
  ProviderCategory,
  ProviderCredentials,
  ProviderId,
  ProviderMeta,
  ProviderSettings,
  ToolSupportStatus,
  VertexProviderCredentials,
  ZaiCredentials,
  ZaiRegion,
} from './common/types/providerSettings.js';
export {
  DEFAULT_MODELS,
  getActiveProvider,
  getDefaultModelForProvider,
  hasAnyReadyProvider,
  isProviderReady,
  PROVIDER_ID_TO_OPENCODE,
  PROVIDER_META,
} from './common/types/providerSettings.js';
// Sandbox types
export type {
  SandboxConfig,
  SandboxMode,
  // SandboxNetworkPolicy contributed by SaaiAravindhRaja (PR #612)
  SandboxNetworkPolicy,
  // SandboxPaths contributed by preeeetham (PR #430)
  SandboxPaths,
  SandboxProvider,
  SpawnArgs,
} from './common/types/sandbox.js';
export { DEFAULT_SANDBOX_CONFIG } from './common/types/sandbox.js';
// Skills types
export type { Skill, SkillFrontmatter, SkillSource } from './common/types/skills.js';
// Task types
export type {
  FileAttachmentInfo,
  Task,
  TaskAttachment,
  TaskConfig,
  TaskMessage,
  TaskProgress,
  TaskResult,
  TaskSource,
  TaskStatus,
  TaskUpdateEvent,
} from './common/types/task.js';
export { STARTUP_STAGES } from './common/types/task.js';
// Other types
export type { TodoItem } from './common/types/todo.js';
// Workspace types
export type {
  KnowledgeNote,
  KnowledgeNoteCreateInput,
  KnowledgeNoteType,
  KnowledgeNoteUpdateInput,
  Workspace,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
} from './common/types/workspace.js';
// Utils
export {
  createFilePermissionRequestId,
  createMessageId,
  createQuestionRequestId,
  createTaskId,
  isFilePermissionRequest,
  isQuestionRequest,
} from './common/utils/id.js';
export { detectLogSource, LOG_SOURCE_PATTERNS } from './common/utils/log-source-detector.js';
export { mergeTaskMessage, upsertTaskMessages } from './common/utils/task-message-merge.js';
export { isWaitingForUser } from './common/utils/waiting-detection.js';
// MCP OAuth
export {
  buildAuthorizationUrl,
  discoverOAuthMetadata,
  discoverOAuthProtectedResourceMetadata,
  exchangeCodeForTokens,
  generatePkceChallenge,
  isTokenExpired,
  refreshAccessToken,
  registerOAuthClient,
} from './connectors/mcp-oauth.js';
// DockerSandboxProvider contributed by preeeetham (#430) + SaaiAravindhRaja (#612)
export { DockerSandboxProvider } from './sandbox/docker-provider.js';
export { isPortInUse, waitForPortRelease } from './utils/network.js';
// Shell and network utilities for PTY spawning
export { getPlatformShell, getShellArgs, quoteForShell, stripAnsi } from './utils/shell.js';

// -----------------------------------------------------------------------------
// Daemon Module (from ./daemon/)
// -----------------------------------------------------------------------------

// Browser live-view types (ENG-695)
export type {
  BrowserFramePayload,
  BrowserNavigatePayload,
  BrowserStatusPayload,
} from './common/types/browser-view.js';
export type {
  DaemonConnectionState,
  DaemonMethod,
  DaemonMethodMap,
  DaemonNotification,
  DaemonNotificationMap,
  DaemonTransport,
  // Milestone 4 — daemon-owned Google accounts + skills payloads.
  GwsAccountAddInput,
  GwsAccountStatusChangedPayload,
  GwsAccountTokenResult,
  HealthCheckResult,
  JsonRpcError,
  JsonRpcMessage,
  JsonRpcNotification,
  JsonRpcRequest,
  JsonRpcResponse,
  ScheduledTask,
  SettingsChangePayload,
  // Milestone 2 of the daemon-only-SQLite migration — storage-surface
  // payload types. Both daemon services and the M3 renderer subscriptions
  // pull these from the same common module.
  SettingsSnapshot,
  SkillsChangedPayload,
  TaskCancelScheduledParams,
  TaskScheduleParams,
  TypedJsonRpcNotification,
  TypedJsonRpcRequest,
  TypedJsonRpcResponse,
  WhatsAppDaemonConfig,
  WorkspaceChangePayload,
  WorkspaceDeleteResult,
  WorkspaceSetActiveResult,
} from './common/types/daemon.js';
// Daemon protocol types (re-exported from common/types/daemon.ts)
export { JSON_RPC_ERRORS } from './common/types/daemon.js';
// Milestone 4 — daemon services import these directly from the root for
// DB-layer typings (`GoogleAccount` is read/written via SQL in
// `GoogleAccountService`). They already live in the common tree.
export type {
  GoogleAccount,
  GoogleAccountStatus,
  GoogleAccountToken,
  GwsAccountsContext,
} from './common/types/google-account.js';
export type {
  DaemonClientOptions,
  DaemonRpcServerOptions,
  DaemonServerOptions,
  PidLockHandle,
  PidLockPayload,
  SocketTransportOptions,
} from './daemon/index.js';
// Socket-based RPC server for the standalone daemon process
// Socket path, PID lock, and crash handler utilities for the daemon process
export {
  acquirePidLock,
  createChildProcessTransport,
  createInProcessTransportPair,
  createParentProcessTransport,
  createSocketTransport,
  DaemonClient,
  DaemonRpcServer,
  DaemonServer,
  getDaemonDir,
  getPidFilePath,
  getSocketPath,
  installCrashHandlers,
  logger,
  PidLockError,
} from './daemon/index.js';
// `LanguagePreference` lives in the storage-types module next to
// `AppSettings`; re-exporting it here keeps the daemon's SettingsService able
// to name its parameter types without a deep import.
export type { LanguagePreference } from './types/storage.js';
