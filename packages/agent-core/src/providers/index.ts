export {
  type AzureFoundryConnectionOptions,
  type AzureFoundryConnectionResult,
  type AzureFoundryValidationOptions,
  testAzureFoundryConnection,
  validateAzureFoundry,
} from './azure-foundry.js';
export {
  type BedrockModel,
  type FetchBedrockModelsResult,
  fetchBedrockModels,
  validateBedrockCredentials,
} from './bedrock.js';
export {
  type CopilotAuthEntry,
  type CopilotDeviceCodeResponse,
  type CopilotOAuthStatus,
  type CopilotTokenResponse,
  clearCopilotOAuth,
  GITHUB_COPILOT_AUTH_URL,
  GITHUB_COPILOT_DEVICE_CODE_URL,
  GITHUB_COPILOT_OAUTH_CLIENT_ID,
  GITHUB_COPILOT_SCOPE,
  GITHUB_COPILOT_TOKEN_URL,
  getCopilotOAuthStatus,
  pollCopilotDeviceToken,
  requestCopilotDeviceCode,
  setCopilotOAuthTokens,
} from './copilot.js';
export { type CustomConnectionResult, testCustomConnection } from './custom.js';
export {
  type FetchProviderModelsOptions,
  type FetchProviderModelsResult,
  fetchProviderModels,
} from './fetch-models.js';
export {
  fetchHuggingFaceLocalModels,
  HF_LOCAL_DEFAULT_URL,
  HF_RECOMMENDED_MODELS,
  type HuggingFaceHubModel,
  searchHuggingFaceHubModels,
  testHuggingFaceLocalConnection,
} from './huggingface-local.js';
export {
  type FetchLiteLLMModelsOptions,
  fetchLiteLLMModels,
  type LiteLLMConnectionResult,
  testLiteLLMConnection,
} from './litellm.js';
export {
  fetchLMStudioModels,
  LMSTUDIO_REQUEST_TIMEOUT_MS,
  type LMStudioConnectionOptions,
  type LMStudioConnectionResult,
  type LMStudioFetchModelsOptions,
  type LMStudioModel,
  testLMStudioConnection,
  validateLMStudioConfig,
} from './lmstudio.js';
export {
  DEFAULT_MODEL,
  DEFAULT_PROVIDERS,
  findModelById,
  getApiKeyEnvVar,
  getDefaultModelForProvider,
  getModelsForProvider,
  getProviderById,
  isValidModel,
  providerRequiresApiKey,
} from './models.js';
export {
  type FetchNimModelsOptions,
  fetchNimModels,
  NIM_DEFAULT_BASE_URL,
  type NimConnectionResult,
  testNimConnection,
} from './nim.js';
export { type OllamaConnectionResult, type OllamaModel, testOllamaConnection } from './ollama.js';
export {
  type FetchModelsResult,
  fetchOpenRouterModels,
  type OpenRouterModel,
} from './openrouter.js';
export {
  type ToolSupportTestOptions,
  testLMStudioModelToolSupport,
  testModelToolSupport,
  testOllamaModelToolSupport,
} from './tool-support-testing.js';
export { type ValidationOptions, type ValidationResult, validateApiKey } from './validation.js';
