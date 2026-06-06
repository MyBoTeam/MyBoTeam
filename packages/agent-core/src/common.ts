// =============================================================================
// @myboteam/agent-core/common - Browser-safe exports
// =============================================================================
// This file exports only browser-safe code (types, constants, pure functions).
// Use this entry point for renderer/browser contexts.
// =============================================================================

// === TYPES ===

export {
  getModelDisplayName,
  MODEL_DISPLAY_NAMES,
  PROVIDER_PREFIXES,
} from './common/constants/model-display.js';
// === CONSTANTS ===
export {
  CONNECTOR_AUTH_REQUIRED_MARKER,
  DEV_BROWSER_CDP_PORT,
  DEV_BROWSER_PORT,
  LOG_BUFFER_FLUSH_INTERVAL_MS,
  LOG_BUFFER_MAX_ENTRIES,
  LOG_MAX_FILE_SIZE_BYTES,
  LOG_RETENTION_DAYS,
  PERMISSION_REQUEST_TIMEOUT_MS,
} from './common/constants.js';

// Google Workspace file picker
export { GOOGLE_FILE_PICKER_MARKER } from './common/google-picker-constants.js';
// === SCHEMAS ===
export {
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
// Cloud browser types
export type {
  CloudBrowserConfig,
  CloudBrowserProvider,
  CloudBrowserProviderConfig,
} from './common/types/cloud-browser.js';
export type {
  ConnectorAuthStatus,
  ConnectorAuthStoreConfig,
  ConnectorCallbackBinding,
  ConnectorCustomOAuthDefinition,
  ConnectorDefinition,
  ConnectorDesktopOAuthDefinition,
  ConnectorDesktopOAuthKind,
  ConnectorMcpDcrOAuthDefinition,
  ConnectorMcpFixedClientOAuthDefinition,
  ConnectorStatus,
  McpConnector,
  OAuthClientRegistration,
  OAuthMetadata,
  OAuthTokens,
  // M2 review polish: keep the built-in connector auth-store blob
  // reachable from the same pure-types subpath as its siblings.
  StoredAuthEntry,
} from './common/types/connector.js';
// Connector types
export {
  getOAuthProviderDisplayName,
  isOAuthProviderId,
  OAuthProviderId,
} from './common/types/connector.js';
// Connector registry
export {
  getConnectorDefinition,
  getConnectorDefinitions,
  getMcpConnectorDefinitions,
  OAUTH_CALLBACK_PORTS,
} from './common/types/connector-registry.js';
// Scheduler types
export type { ScheduledTask } from './common/types/daemon.js';
// Gateway types
export type { CreditUsage } from './common/types/gateway.js';
// Google Workspace multi-account types
export type {
  GoogleAccount,
  GoogleAccountStatus,
  GoogleAccountToken,
  GwsAccountsContext,
} from './common/types/google-account.js';
export type { LogEntry, LogLevel, LogSource } from './common/types/logging.js';
// Messaging integration types (ENG-684)
export type {
  ChannelAdapter,
  IncomingMessage,
  MessagingConfig,
  MessagingConnectionStatus,
  MessagingIntegrationConfig,
  MessagingPlatform,
  MessagingProviderId,
  MessagingQRCode,
} from './common/types/messaging.js';
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
  CustomCredentials,
  HuggingFaceLocalCredentials,
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
// Skills types
export type { Skill, SkillFrontmatter, SkillSource } from './common/types/skills.js';
// Task types
export type {
  FileAttachmentInfo,
  Task,
  TaskAttachment,
  TaskConfig,
  TaskMessage,
  TaskPauseAction,
  TaskProgress,
  TaskResult,
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
// === BROWSER-SAFE UTILS ===
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
// === SANITIZATION ===
export { PROMPT_DEFAULT_MAX_LENGTH } from './utils/sanitize.js';
