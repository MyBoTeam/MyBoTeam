import {
  DEFAULT_MODEL,
  DEFAULT_PROVIDERS,
  type ModelConfig,
  type ProviderType,
} from '../common/types/provider.js';

export { DEFAULT_MODEL, DEFAULT_PROVIDERS };

export function getModelsForProvider(provider: ProviderType): ModelConfig[] {
  const providerConfig = DEFAULT_PROVIDERS.find((p) => p.id === provider);
  return providerConfig?.models ?? [];
}

export function getDefaultModelForProvider(provider: ProviderType): ModelConfig | undefined {
  const models = getModelsForProvider(provider);
  return models[0];
}

export function getProviderById(providerId: ProviderType) {
  return DEFAULT_PROVIDERS.find((p) => p.id === providerId);
}
