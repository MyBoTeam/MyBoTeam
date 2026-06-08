import { PROVIDER_ID_TO_OPENCODE } from '../common/index.js';
import type { ProviderSettings } from '../common/types/providerSettings.js';
import {
  getActiveProviderModel,
  getConnectedProviderIds,
  getOllamaConfig,
  getProviderSettings,
} from '../storage/repositories/index.js';
import { OPENAI_COMPATIBLE_PROVIDER_IDS } from './config-auth-sync.js';
import type { ProviderConfig } from './config-generator.js';

export { syncApiKeysToOpenCodeAuth } from './config-auth-sync.js';

import { buildGoogleConfig, buildXaiConfig, buildZaiConfig } from './config-providers-ai-cloud.js';
import { buildBedrockConfig } from './config-providers-bedrock.js';
import {
  buildCopilotConfig,
  buildCustomConfig,
  buildNimConfig,
  buildOpenAICompatibleConfigs,
} from './config-providers-compat.js';
import { buildLMStudioConfig, buildOllamaConfig } from './config-providers-local.js';
import {
  buildLiteLLMConfig,
  buildMinimaxConfig,
  buildMoonshotConfig,
  buildOpenRouterConfig,
} from './config-providers-standard.js';
import { buildAzureFoundryConfig, buildVertexConfig } from './config-providers-vertex-azure.js';

export interface ConfigPaths {
  mcpToolsPath: string;
  userDataPath: string;
  configDir: string;
}

export interface ProviderConfigResult {
  providerConfigs: ProviderConfig[];
  enabledProviders: string[];
  modelOverride?: { model: string; smallModel: string };
}

export interface BuildProviderConfigsOptions {
  getApiKey: (provider: string) => string | undefined | null;

  azureFoundryToken?: string;

  providerSettings?: ProviderSettings;
}

export async function buildProviderConfigs(
  options: BuildProviderConfigsOptions,
): Promise<ProviderConfigResult> {
  const { getApiKey, azureFoundryToken } = options;
  const providerSettings = options.providerSettings ?? getProviderSettings();
  const connectedIds = getConnectedProviderIds();
  const activeModel = getActiveProviderModel();
  const ctx = {
    providerSettings,
    getApiKey,
    azureFoundryToken,
    activeModel,
  };

  const baseProviders = [
    'anthropic',
    'openai',
    'openrouter',
    'google',
    'xai',
    'deepseek',
    'moonshot',
    'zai-coding-plan',
    'amazon-bedrock',
    'vertex',
    'minimax',
    ...OPENAI_COMPATIBLE_PROVIDER_IDS,
  ];
  let enabledProviders = baseProviders;
  if (connectedIds.length > 0) {
    const mappedProviders = connectedIds.map((id) => PROVIDER_ID_TO_OPENCODE[id]);
    enabledProviders = [...new Set([...baseProviders, ...mappedProviders])];
  } else {
    const ollamaConfig = getOllamaConfig();
    if (ollamaConfig?.enabled) {
      enabledProviders = [...baseProviders, 'ollama'];
    }
  }

  const results = await Promise.all([
    buildOllamaConfig(ctx),
    buildLMStudioConfig(ctx),
    buildOpenRouterConfig(ctx),
    buildMoonshotConfig(ctx),
    buildLiteLLMConfig(ctx),
    buildMinimaxConfig(ctx),
    buildXaiConfig(ctx),
    buildGoogleConfig(ctx),
    buildZaiConfig(ctx),
    buildBedrockConfig(ctx),
    buildVertexConfig(ctx),
    buildAzureFoundryConfig(ctx),
    buildNimConfig(ctx),
    buildCustomConfig(ctx),
    buildOpenAICompatibleConfigs(ctx),
    buildCopilotConfig(ctx),
  ]);

  const providerConfigs: ProviderConfig[] = [];
  let modelOverride: { model: string; smallModel: string } | undefined;

  for (const result of results) {
    providerConfigs.push(...result.configs);
    for (const id of result.enableToAdd) {
      if (!enabledProviders.includes(id)) {
        enabledProviders.push(id);
      }
    }
    if (result.modelOverride) {
      modelOverride = result.modelOverride;
    }
  }

  return { providerConfigs, enabledProviders, modelOverride };
}
