import type { ZaiRegion } from '../providerSettings.js';
import type { ModelConfig, SelectedModel } from './model-types.js';

export const MINIMAX_DEFAULT_BASE_URL = 'https://api.minimax.io/v1';

export const ZAI_ENDPOINTS: Record<ZaiRegion, string> = {
  china: 'https://open.bigmodel.cn/api/paas/v4',
  international: 'https://api.z.ai/api/coding/paas/v4',
};

export type ProviderType =
  | 'anthropic'
  | 'openai'
  | 'openrouter'
  | 'google'
  | 'xai'
  | 'ollama'
  | 'deepseek'
  | 'moonshot'
  | 'zai'
  | 'azure-foundry'
  | 'custom'
  | 'bedrock'
  | 'litellm'
  | 'minimax'
  | 'lmstudio'
  | 'vertex'
  | 'huggingface-local'
  | 'nebius'
  | 'together'
  | 'fireworks'
  | 'groq'
  | 'venice'
  | 'nim'
  | 'copilot';

export interface ModelsEndpointConfig {
  url: string;
  authStyle: 'bearer' | 'x-api-key' | 'query-param';
  extraHeaders?: Record<string, string>;
  responseFormat: 'openai' | 'anthropic' | 'google';
  modelIdPrefix?: string;
  modelFilter?: RegExp;
}

export interface ProviderConfig {
  id: ProviderType;
  name: string;
  models: ModelConfig[];
  requiresApiKey: boolean;
  apiKeyEnvVar?: string;
  baseUrl?: string;
  defaultModelId?: string;
  modelsEndpoint?: ModelsEndpointConfig;
  editableBaseUrl?: boolean;
}

export const NIM_DEFAULT_BASE_URL = 'https://integrate.api.nvidia.com/v1';

export const COPILOT_MODELS: Array<{ id: string; displayName: string }> = [
  { id: 'copilot/gpt-4o', displayName: 'GPT-4o' },
  { id: 'copilot/gpt-4o-mini', displayName: 'GPT-4o mini' },
  { id: 'copilot/o1', displayName: 'o1' },
  { id: 'copilot/o1-mini', displayName: 'o1 mini' },
  { id: 'copilot/o3-mini', displayName: 'o3 mini' },
  { id: 'copilot/claude-3.5-sonnet', displayName: 'Claude 3.5 Sonnet' },
  { id: 'copilot/claude-3.7-sonnet', displayName: 'Claude 3.7 Sonnet' },
  { id: 'copilot/gemini-2.0-flash-001', displayName: 'Gemini 2.0 Flash' },
];

export const DEFAULT_MODEL: SelectedModel = {
  provider: 'anthropic',
  model: 'anthropic/claude-opus-4-5',
};

export { DEFAULT_PROVIDERS } from './default-providers.js';
