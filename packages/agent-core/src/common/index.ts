// packages/shared/src/index.ts

// === TYPES ===

export {
  getModelDisplayName,
  MODEL_DISPLAY_NAMES,
  PROVIDER_PREFIXES,
} from './constants/model-display.js';
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
  WHATSAPP_API_PORT,
} from './constants.js';
// === SCHEMAS ===
export {
  permissionResponseSchema,
  resumeSessionSchema,
  taskConfigSchema,
  validate,
} from './schemas/validation.js';
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
} from './types/auth.js';
export type { ConnectorStatus, McpConnector, OAuthTokens } from './types/connector.js';
// Connector types
export {
  getOAuthProviderDisplayName,
  isOAuthProviderId,
  OAuthProviderId,
} from './types/connector.js';
// Gateway types
export type { CreditUsage } from './types/gateway.js';
export type { LogEntry, LogLevel, LogSource } from './types/logging.js';
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
} from './types/opencode.js';
// Permission types
export type {
  FileOperation,
  PermissionOption,
  PermissionRequest,
  PermissionResponse,
} from './types/permission.js';
export {
  FILE_OPERATIONS,
  FILE_PERMISSION_REQUEST_PREFIX,
  QUESTION_REQUEST_PREFIX,
} from './types/permission.js';
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
} from './types/provider.js';
export {
  ALLOWED_API_KEY_PROVIDERS,
  COPILOT_MODELS,
  DEFAULT_MODEL,
  DEFAULT_PROVIDERS,
  MINIMAX_DEFAULT_BASE_URL,
  NIM_DEFAULT_BASE_URL,
  STANDARD_VALIDATION_PROVIDERS,
  ZAI_ENDPOINTS,
} from './types/provider.js';
// Provider settings types
export type {
  ApiKeyCredentials,
  AzureFoundryCredentials,
  BedrockProviderCredentials,
  ConnectedProvider,
  ConnectionStatus,
  CopilotOAuthCredentials,
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
} from './types/providerSettings.js';
export {
  DEFAULT_MODELS,
  getActiveProvider,
  getDefaultModelForProvider,
  hasAnyReadyProvider,
  isProviderReady,
  PROVIDER_ID_TO_OPENCODE,
  PROVIDER_META,
} from './types/providerSettings.js';
// Skills types
export type { Skill, SkillFrontmatter, SkillSource } from './types/skills.js';
// Task types
export type {
  Task,
  TaskAttachment,
  TaskConfig,
  TaskMessage,
  TaskProgress,
  TaskResult,
  TaskStatus,
  TaskUpdateEvent,
} from './types/task.js';
export { STARTUP_STAGES } from './types/task.js';
// Other types
export type { TodoItem } from './types/todo.js';
// Workspace types
export type { Workspace, WorkspaceCreateInput, WorkspaceUpdateInput } from './types/workspace.js';
// === UTILS ===
export {
  createFilePermissionRequestId,
  createMessageId,
  createQuestionRequestId,
  createTaskId,
  isFilePermissionRequest,
  isQuestionRequest,
} from './utils/id.js';
export { detectLogSource, LOG_SOURCE_PATTERNS } from './utils/log-source-detector.js';
export { isWaitingForUser } from './utils/waiting-detection.js';
