export type { BrowserServerConfig } from './browser/server.js';

export { ensureDevBrowserServer, shutdownDevBrowserServer } from './browser/server.js';
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
export {
  getModelDisplayName,
  MODEL_DISPLAY_NAMES,
  PROVIDER_PREFIXES,
} from './common/model-display.js';
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
  BrowserFramePayload,
  BrowserNavigatePayload,
  BrowserStatusPayload,
} from './common/types/browser-view.js';
export type {
  ConnectorStatus,
  McpConnector,
  OAuthClientRegistration,
  OAuthMetadata,
  OAuthTokens,
  StoredAuthEntry,
} from './common/types/connector.js';
export {
  getOAuthProviderDisplayName,
  isOAuthProviderId,
  OAuthProviderId,
} from './common/types/connector.js';
export type {
  DaemonConnectionState,
  DaemonMethod,
  DaemonMethodMap,
  DaemonNotification,
  DaemonNotificationMap,
  DaemonTransport,
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
export { JSON_RPC_ERRORS } from './common/types/daemon.js';

export type {
  GoogleAccount,
  GoogleAccountStatus,
  GoogleAccountToken,
  GwsAccountsContext,
} from './common/types/google-account.js';
export type { LogEntry, LogLevel, LogSource } from './common/types/logging.js';
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
  NimCredentials,
  OAuthCredentials,
  OllamaCredentials,
  OpenAiOauthPlan,
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
  OPENAI_OAUTH_FREE_MODEL_IDS,
  OPENAI_OAUTH_MODEL_IDS,
  PROVIDER_ID_TO_OPENCODE,
  PROVIDER_META,
} from './common/types/providerSettings.js';
export type {
  SandboxConfig,
  SandboxMode,
  SandboxNetworkPolicy,
  SandboxPaths,
  SandboxProvider,
  SpawnArgs,
} from './common/types/sandbox.js';
export { DEFAULT_SANDBOX_CONFIG } from './common/types/sandbox.js';
export type { Skill, SkillFrontmatter, SkillSource } from './common/types/skills.js';
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
export { STARTUP_STAGES, TASK_SOURCES } from './common/types/task.js';
export type { TodoItem } from './common/types/todo.js';
export type {
  KnowledgeNote,
  KnowledgeNoteCreateInput,
  KnowledgeNoteType,
  KnowledgeNoteUpdateInput,
  Workspace,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
} from './common/types/workspace.js';
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
export {
  authOpenAiAwaitCompletionSchema,
  permissionResponseSchema,
  resumeSessionSchema,
  taskConfigSchema,
  validate,
} from './common/validation.js';
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
export type {
  DaemonClientOptions,
  DaemonRpcServerOptions,
  DaemonServerOptions,
  PidLockHandle,
  PidLockPayload,
  SocketTransportOptions,
} from './daemon/index.js';
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
export {
  createLogWriter,
  createPermissionHandler,
  createSkillsManager,
  createSpeechService,
  createStorage,
  createTaskManager,
} from './factories/index.js';
export { createSandboxProvider } from './factories/sandbox.js';
export type {
  GwsAccountEntry,
  GwsAccountSummary,
  PrepareGwsManifestResult,
} from './google-accounts/index.js';
export {
  GOOGLE_TOKEN_ENDPOINT,
  gwsTokenKey,
  prepareGwsManifest,
  TOKEN_REFRESH_MARGIN_MS,
} from './google-accounts/index.js';
export type {
  AdapterOptions,
  TaskRuntimeAdapter,
  TaskRuntimeAdapterEvents,
} from './internal/classes/adapter-types.js';
export { OpenCodeCliNotFoundError } from './internal/classes/adapter-types.js';
export {
  createTaskRuntimeAdapter,
  selectTaskRuntime,
} from './internal/classes/task-runtime-adapter-factory.js';
export type { DetectOpenAiOauthPlanOptions, OpenCodeMcpOauthStatus } from './opencode/auth.js';
export {
  clearSlackMcpAuth,
  detectOpenAiOauthPlan,
  getOpenAiOauthAccessToken,
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

export { isCliAvailable, resolveCliPath } from './opencode/cli-resolver.js';
export { buildProviderConfigs, syncApiKeysToOpenCodeAuth } from './opencode/config-builder.js';
export { generateConfig, MYBOTEAM_AGENT_NAME } from './opencode/config-generator.js';
export type { EnvironmentConfig } from './opencode/environment.js';
export { buildOpenCodeEnvironment } from './opencode/environment.js';
export type { BrowserConfig } from './opencode/generator-mcp.js';
export { sanitizeAssistantTextForDisplay } from './opencode/message-processor.js';
export type { SdkSelectedModelRef } from './opencode/model-runtime-mapping.js';

export {
  normalizeSelectedModelForSdk,
  resolveLlamaCppRuntimeModelName,
} from './opencode/model-runtime-mapping.js';

export { getAzureEntraToken } from './opencode/proxies/index.js';
export type {
  ResolvedTaskConfig,
  ResolveTaskConfigOptions,
} from './opencode/resolve-task-config.js';

export { resolveTaskConfig } from './opencode/resolve-task-config.js';
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

export { validateApiKey } from './providers/validation.js';
export { fetchVertexModels, VertexClient, validateVertexCredentials } from './providers/vertex.js';

export { DockerSandboxProvider } from './sandbox/docker-provider.js';
export type { GetApiKeyFn } from './services/summarizer.js';

export { generateTaskSummary } from './services/summarizer.js';

export { FutureSchemaError } from './storage/migrations/errors.js';

export {
  createKnowledgeNote,
  deleteKnowledgeNote,
  getKnowledgeNote,
  getKnowledgeNotesForPrompt,
  listKnowledgeNotes,
  updateKnowledgeNote,
} from './storage/repositories/knowledgeNotes.js';
export { getEnabledSkills } from './storage/repositories/skills.js';

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

export type {
  AppSettings,
  AppSettingsAPI,
  DatabaseLifecycleAPI,
  FilePermissionRequestData as PermissionFileRequestData,
  LogEntry as LogWriterEntry,
  LogWriterAPI,
  LogWriterOptions,
  OnBeforeStartContext,
  OnBeforeStartResult,
  PermissionHandlerAPI,
  PermissionHandlerOptions,
  PermissionValidationResult,
  ProviderSettingsAPI,
  QuestionRequestData as PermissionQuestionRequestData,
  QuestionResponseData as PermissionQuestionResponseData,
  SecureStorageAPI,
  SkillsManagerAPI,
  SkillsManagerOptions,
  SpeechServiceAPI,
  SpeechServiceOptions,
  StorageAPI,
  StorageOptions,
  StoredFavorite,
  StoredTask,
  TaskAdapterOptions,
  TaskCallbacks as TaskManagerCallbacks,
  TaskCallbacks,
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

export type { LanguagePreference } from './types/storage.js';

export type {
  BundledNodePaths,
  CliResolverConfig,
  PlatformConfig,
  ResolvedCliPaths,
} from './types.js';
export type { BundledNodePathsExtended } from './utils/bundled-node.js';

export {
  getBundledNodePaths,
  getNodePath,
  getNpmPath,
  getNpxPath,
  isBundledNodeAvailable,
  logBundledNodeInfo,
} from './utils/bundled-node.js';
export type { SafeParseResult } from './utils/json.js';

export { safeParseJson } from './utils/json.js';
export { isPortInUse, waitForPortRelease } from './utils/network.js';

export { redact } from './utils/redact.js';

export { PROMPT_DEFAULT_MAX_LENGTH, sanitizeString } from './utils/sanitize.js';

export { getPlatformShell, getShellArgs, quoteForShell, stripAnsi } from './utils/shell.js';

export { findCommandInPath, getExtendedNodePath } from './utils/system-path.js';
export { mapResultToStatus } from './utils/task-status.js';

export { validateTaskConfig } from './utils/task-validation.js';

export { validateHttpUrl } from './utils/url.js';
