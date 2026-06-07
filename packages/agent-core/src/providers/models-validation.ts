import {
  DEFAULT_PROVIDERS,
  type ModelConfig,
  type ProviderType,
} from '../common/types/provider.js';
import { getModelsForProvider, getProviderById } from './models-by-provider.js';

export function isValidModel(provider: ProviderType, modelId: string): boolean {
  const models = getModelsForProvider(provider);
  return models.some((m) => m.id === modelId || m.fullId === modelId);
}

export function findModelById(modelId: string): ModelConfig | undefined {
  for (const provider of DEFAULT_PROVIDERS) {
    const model = provider.models.find((m) => m.id === modelId || m.fullId === modelId);
    if (model) {
      return model;
    }
  }
  return undefined;
}

export function providerRequiresApiKey(provider: ProviderType): boolean {
  const providerConfig = getProviderById(provider);
  return providerConfig?.requiresApiKey ?? false;
}

export function getApiKeyEnvVar(provider: ProviderType): string | undefined {
  const providerConfig = getProviderById(provider);
  return providerConfig?.apiKeyEnvVar;
}
