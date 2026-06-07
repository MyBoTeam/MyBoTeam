import { getProviderSecrets } from './secrets-loader';
import type { ProviderTestConfig, ResolvedProviderTestConfig } from './types';

export const DEFAULT_TEST_MODELS: Record<string, string> = {
  openai: 'openai/gpt-5.1-codex-mini',
  google: 'google/gemini-3-flash-preview',
};

export const PROVIDER_TEST_CONFIGS: Record<string, ProviderTestConfig> = {
  openai: {
    providerId: 'openai',
    displayName: 'OpenAI',
    authMethod: 'api-key',
  },
  google: {
    providerId: 'google',
    displayName: 'Google',
    authMethod: 'api-key',
    modelId: 'gemini-flash-2-5',
  },
  'bedrock-api-key': {
    providerId: 'bedrock',
    displayName: 'Bedrock (API Key)',
    authMethod: 'bedrock-api-key',
  },
  ollama: {
    providerId: 'ollama',
    displayName: 'Ollama',
    authMethod: 'ollama',
    timeout: 300000,
  },
};

export function getProviderTestConfig(configKey: string): ResolvedProviderTestConfig {
  const config = PROVIDER_TEST_CONFIGS[configKey];
  if (!config) {
    throw new Error(`Provider test config not found for key: ${configKey}`);
  }

  const secrets = getProviderSecrets(configKey);

  return {
    ...config,
    secrets,
    modelId: DEFAULT_TEST_MODELS[config.providerId],
  };
}
