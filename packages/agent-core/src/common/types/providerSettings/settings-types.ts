export type ProviderId =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'xai'
  | 'deepseek'
  | 'moonshot'
  | 'zai'
  | 'bedrock'
  | 'azure-foundry'
  | 'ollama'
  | 'openrouter'
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
  | 'custom'
  | 'copilot'
  | 'myboteam-ai';

export type ProviderCategory =
  | 'classic'
  | 'aws'
  | 'gcp'
  | 'azure'
  | 'local'
  | 'proxy'
  | 'hybrid'
  | 'myboteam';

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  category: ProviderCategory;
  label: string;
  logoKey: string;
  helpUrl?: string;
}

export const DEFAULT_MODELS: Partial<Record<ProviderId, string>> = {
  anthropic: 'anthropic/claude-opus-4-5',
  openai: 'openai/gpt-5.2',
  google: 'google/gemini-3-pro-preview',
  xai: 'xai/grok-4',
  deepseek: 'deepseek/deepseek-chat',
  moonshot: 'moonshot/kimi-k2.5',
  zai: 'zai/glm-4.7-flashx',
  minimax: 'minimax/MiniMax-M2',
  bedrock: 'amazon-bedrock/anthropic.claude-opus-4-5-20251101-v1:0',
  nebius: 'nebius/meta-llama/Meta-Llama-3.1-70B-Instruct',
  together: 'together/meta-llama/Llama-3-70b-chat-hf',
  fireworks: 'fireworks/accounts/fireworks/models/llama-v3-70b-instruct',
  groq: 'groq/llama3-70b-8192',
  venice: 'venice/llama-3.3-70b',
  nim: 'nim/meta/llama-3.1-70b-instruct',
  copilot: 'copilot/gpt-4o',
  'myboteam-ai': 'myboteam-ai/myboteam-free',
};

export function getDefaultModelForProvider(providerId: ProviderId): string | null {
  return DEFAULT_MODELS[providerId] ?? null;
}

export const PROVIDER_ID_TO_OPENCODE: Record<ProviderId, string> = {
  anthropic: 'anthropic',
  openai: 'openai',
  google: 'google',
  xai: 'xai',
  deepseek: 'deepseek',
  moonshot: 'moonshot',
  zai: 'zai-coding-plan',
  bedrock: 'amazon-bedrock',
  'azure-foundry': 'azure-foundry',
  ollama: 'ollama',
  openrouter: 'openrouter',
  litellm: 'litellm',
  minimax: 'minimax',
  lmstudio: 'lmstudio',
  vertex: 'vertex',
  'huggingface-local': 'openai',
  nebius: 'nebius',
  together: 'together',
  fireworks: 'fireworks',
  groq: 'groq',
  venice: 'venice',
  nim: 'nim',
  custom: 'custom',
  copilot: 'github-copilot',
  'myboteam-ai': 'myboteam-ai',
};

export { PROVIDER_META } from './provider-meta.js';
