import type { ProviderId } from './settings-types.js';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ApiKeyCredentials {
  type: 'api_key';
  keyPrefix: string;
}

export interface BedrockProviderCredentials {
  type: 'bedrock';
  authMethod: 'accessKey' | 'profile' | 'apiKey';
  region: string;
  accessKeyIdPrefix?: string;
  profileName?: string;
  apiKeyPrefix?: string;
}

export interface OllamaCredentials {
  type: 'ollama';
  serverUrl: string;
}

export interface OpenRouterCredentials {
  type: 'openrouter';
  keyPrefix: string;
}

export interface LiteLLMCredentials {
  type: 'litellm';
  serverUrl: string;
  hasApiKey: boolean;
  keyPrefix?: string;
}

export type ZaiRegion = 'china' | 'international';

export interface ZaiCredentials {
  type: 'zai';
  keyPrefix: string;
  region: ZaiRegion;
}

export interface LMStudioCredentials {
  type: 'lmstudio';
  serverUrl: string;
}

export interface HuggingFaceLocalCredentials {
  type: 'huggingface-local';
  modelId: string;
}

export interface CustomCredentials {
  type: 'custom';
  baseUrl: string;
  modelName: string;
  hasApiKey: boolean;
  keyPrefix?: string;
}

export interface NimCredentials {
  type: 'nim';
  serverUrl: string;
  keyPrefix: string;
}

export interface AzureFoundryCredentials {
  type: 'azure-foundry';
  authMethod: 'api-key' | 'entra-id';
  endpoint: string;
  deploymentName: string;
  keyPrefix?: string;
}

export interface VertexProviderCredentials {
  type: 'vertex';
  authMethod: 'serviceAccount' | 'adc';
  projectId: string;
  location: string;
  serviceAccountEmail?: string;
}

export interface OAuthCredentials {
  type: 'oauth';
  oauthProvider: 'chatgpt';
}

export interface CopilotOAuthCredentials {
  type: 'copilot-oauth';
}

export type ProviderCredentials =
  | ApiKeyCredentials
  | BedrockProviderCredentials
  | VertexProviderCredentials
  | OllamaCredentials
  | OpenRouterCredentials
  | LiteLLMCredentials
  | ZaiCredentials
  | AzureFoundryCredentials
  | LMStudioCredentials
  | OAuthCredentials
  | HuggingFaceLocalCredentials
  | CopilotOAuthCredentials
  | CustomCredentials
  | NimCredentials;

export type ToolSupportStatus = 'supported' | 'unsupported' | 'unknown';

export interface ConnectedProvider {
  providerId: ProviderId;
  connectionStatus: ConnectionStatus;
  selectedModelId: string | null;
  credentials: ProviderCredentials;
  lastConnectedAt: string;
  availableModels?: Array<{ id: string; name: string; toolSupport?: ToolSupportStatus }>;
  customBaseUrl?: string;
}

export interface ProviderSettings {
  activeProviderId: ProviderId | null;
  connectedProviders: Partial<Record<ProviderId, ConnectedProvider>>;
  debugMode: boolean;
}

export function isProviderReady(provider: ConnectedProvider | undefined): boolean {
  if (!provider) return false;
  return provider.connectionStatus === 'connected' && provider.selectedModelId !== null;
}

export function hasAnyReadyProvider(settings: ProviderSettings | null | undefined): boolean {
  if (!settings?.connectedProviders) return false;
  return Object.values(settings.connectedProviders).some(isProviderReady);
}

export function getActiveProvider(
  settings: ProviderSettings | null | undefined,
): ConnectedProvider | null {
  if (!settings?.activeProviderId) return null;
  return settings.connectedProviders?.[settings.activeProviderId] ?? null;
}
