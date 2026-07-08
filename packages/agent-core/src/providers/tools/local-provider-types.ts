export type LocalProviderType = 'ollama' | 'lmstudio';

export const DEFAULT_OLLAMA_PORT = 11434;
export const DEFAULT_LMSTUDIO_PORT = 1234;

export interface LocalProviderConfig {
  name: string;
  type: LocalProviderType;
  endpoint: string;
  apiKey?: string;
  headers: Record<string, string>;
  timeout: number;
  enabled: boolean;
}

export interface DiscoveredProvider {
  type: LocalProviderType;
  port: number;
  available: boolean;
  models: Array<{
    id: string;
    name: string;
    provider: string;
    capabilities: ProviderCapability;
  }>;
}

export interface ProviderCapability {
  streaming: boolean;
  tools: boolean;
  vision: boolean;
  maxContextWindow?: number;
}
