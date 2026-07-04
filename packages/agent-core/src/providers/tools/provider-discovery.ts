import type { ModelInfo } from '@myboteam/types';
import type { DiscoveredProvider, LocalProviderType } from './local-provider-types.js';

export interface DiscoveryConfig {
  ollamaPort?: number;
  lmstudioPort?: number;
  timeout?: number;
}

const DEFAULT_CONFIG: DiscoveryConfig = {
  ollamaPort: 11434,
  lmstudioPort: 1234,
  timeout: 2000,
};

interface ModelsResponse {
  data?: Array<{ id: string; object?: string }>;
}

function isValidModelsResponse(data: unknown): data is ModelsResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if ('data' in obj) {
    if (!Array.isArray(obj.data)) {
      return false;
    }

    for (const item of obj.data) {
      if (typeof item !== 'object' || item === null) {
        return false;
      }

      const model = item as Record<string, unknown>;
      if (typeof model.id !== 'string' || model.id.length === 0) {
        return false;
      }
    }
  }

  return true;
}

export class ProviderDiscovery {
  private readonly config: DiscoveryConfig;

  constructor(config?: DiscoveryConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async discover(): Promise<DiscoveredProvider[]> {
    const ollamaPort = this.config.ollamaPort ?? 11434;
    const lmstudioPort = this.config.lmstudioPort ?? 1234;

    const results = await Promise.allSettled([
      this.scanPort(ollamaPort, 'ollama'),
      this.scanPort(lmstudioPort, 'lmstudio'),
    ]);

    return results
      .filter(
        (result): result is PromiseFulfilledResult<DiscoveredProvider> =>
          result.status === 'fulfilled' && result.value !== null,
      )
      .map((result) => result.value);
  }

  async scanPort(port: number, type: LocalProviderType): Promise<DiscoveredProvider | null> {
    try {
      const url = new URL('/v1/models', `http://localhost:${port}`);
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(this.config.timeout ?? 2000),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (!isValidModelsResponse(data)) {
        return null;
      }

      const models: ModelInfo[] = (data.data ?? []).map((model) => ({
        id: model.id,
        name: model.id,
        provider: type,
      }));

      return {
        type,
        port,
        available: true,
        models,
      };
    } catch {
      return null;
    }
  }
}
