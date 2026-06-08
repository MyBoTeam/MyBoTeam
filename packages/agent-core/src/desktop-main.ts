export { shutdownDevBrowserServer } from './browser/server.js';

export { DEV_BROWSER_CDP_PORT, DEV_BROWSER_PORT } from './common/constants.js';
export type { BedrockCredentials, VertexCredentials } from './common/types/auth.js';
export type {
  McpConnector,
  OAuthClientRegistration,
  OAuthMetadata,
  StoredAuthEntry,
} from './common/types/connector.js';
export type {
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
export type {
  GoogleAccount,
  GoogleAccountStatus,
  GoogleAccountToken,
} from './common/types/google-account.js';
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
export { createMessageId, createTaskId } from './common/utils/id.js';
export {
  permissionResponseSchema,
  resumeSessionSchema,
  taskConfigSchema,
  validate,
} from './common/validation.js';

export * from './desktop-main-ipc.js';
export { createLogWriter } from './factories/log-writer.js';

export { createSpeechService } from './factories/speech.js';
export { testAzureFoundryConnection, validateAzureFoundry } from './providers/azure-foundry.js';
export { fetchBedrockModels, validateBedrockCredentials } from './providers/bedrock.js';
export type {
  CopilotDeviceCodeResponse,
  CopilotOAuthStatus,
  CopilotTokenResponse,
} from './providers/copilot.js';

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

export { validateApiKey } from './providers/validation.js';
export { fetchVertexModels, validateVertexCredentials } from './providers/vertex.js';
export type { GetApiKeyFn } from './services/summarizer.js';

export { generateTaskSummary } from './services/summarizer.js';

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

export { sanitizeString } from './utils/sanitize.js';
export { findCommandInPath, getExtendedNodePath } from './utils/system-path.js';
export { validateHttpUrl } from './utils/url.js';
