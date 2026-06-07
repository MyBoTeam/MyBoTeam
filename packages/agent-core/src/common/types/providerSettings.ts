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
  ProviderCredentials,
  ProviderSettings,
  ToolSupportStatus,
  VertexProviderCredentials,
  ZaiCredentials,
  ZaiRegion,
} from './providerSettings/credential-types.js';

export {
  getActiveProvider,
  hasAnyReadyProvider,
  isProviderReady,
} from './providerSettings/credential-types.js';

export type {
  ProviderCategory,
  ProviderId,
  ProviderMeta,
} from './providerSettings/settings-types.js';

export {
  DEFAULT_MODELS,
  getDefaultModelForProvider,
  PROVIDER_ID_TO_OPENCODE,
  PROVIDER_META,
} from './providerSettings/settings-types.js';

export type { OpenAiOauthPlan } from './providerSettings/ui-types.js';
export {
  OPENAI_OAUTH_FREE_MODEL_IDS,
  OPENAI_OAUTH_MODEL_IDS,
} from './providerSettings/ui-types.js';
