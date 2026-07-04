export type LocalProviderType = 'ollama' | 'lmstudio';

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
    capabilities: { tools: boolean; vision: boolean; streaming: boolean };
    contextWindow?: number;
  }>;
}

export interface ProviderCapability {
  streaming: boolean;
  tools: boolean;
  vision: boolean;
  maxContextWindow?: number;
}
