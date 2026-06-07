import type { ProviderId } from '@myboteam/agent-core/common';

export type AuthMethod =
  | 'api-key'
  | 'bedrock-api-key'
  | 'bedrock-access-key'
  | 'bedrock-profile'
  | 'azure-api-key'
  | 'azure-entra-id'
  | 'server-url'
  | 'server-url-with-key'
  | 'ollama'
  | 'zai';

export interface ProviderTestConfig {
  providerId: ProviderId;

  displayName: string;

  modelId?: string;

  authMethod: AuthMethod;

  timeout?: number;
}

export interface ApiKeySecrets {
  apiKey: string;
}

export interface BedrockApiKeySecrets {
  apiKey: string;
  region?: string;
}

export interface BedrockAccessKeySecrets {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region?: string;
}

export interface BedrockProfileSecrets {
  profileName: string;
  region?: string;
}

export interface AzureApiKeySecrets {
  apiKey: string;
  endpoint: string;
  deploymentName: string;
}

export interface AzureEntraIdSecrets {
  endpoint: string;
  deploymentName: string;
}

export interface ServerUrlSecrets {
  serverUrl: string;
}

export interface OllamaSecrets {
  serverUrl?: string;
  modelId?: string;
}

export interface ServerUrlWithKeySecrets {
  serverUrl: string;
  apiKey?: string;
}

export interface ZaiSecrets {
  apiKey: string;
  region?: 'china' | 'international';
}

/**
 * Union of all provider secret shapes.
 *
 * NOTE: This union is NOT discriminated. Members share structural overlap
 * (e.g., ApiKeySecrets and BedrockApiKeySecrets both have `apiKey`).
 * Use `ProviderTestConfig.authMethod` as the external discriminant when
 * narrowing to a specific variant.
 */
export type ProviderSecrets =
  | ApiKeySecrets
  | BedrockApiKeySecrets
  | BedrockAccessKeySecrets
  | BedrockProfileSecrets
  | AzureApiKeySecrets
  | AzureEntraIdSecrets
  | ServerUrlSecrets
  | OllamaSecrets
  | ServerUrlWithKeySecrets
  | ZaiSecrets;

export interface SecretsConfig {
  providers: Record<string, ProviderSecrets>;
}

export interface ResolvedProviderTestConfig extends ProviderTestConfig {
  secrets?: ProviderSecrets;
}
