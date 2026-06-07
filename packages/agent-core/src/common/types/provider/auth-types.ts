export type ApiKeyProvider =
  | 'anthropic'
  | 'openai'
  | 'openrouter'
  | 'google'
  | 'xai'
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
  | 'nebius'
  | 'together'
  | 'fireworks'
  | 'groq'
  | 'venice'
  | 'nim'
  | 'elevenlabs'
  | 'aws-agentcore'
  | 'browserbase'
  | 'steel';

export const ALLOWED_API_KEY_PROVIDERS: ReadonlySet<string> = new Set<string>([
  'anthropic',
  'openai',
  'openrouter',
  'google',
  'xai',
  'deepseek',
  'moonshot',
  'zai',
  'azure-foundry',
  'custom',
  'bedrock',
  'litellm',
  'minimax',
  'lmstudio',
  'vertex',
  'nebius',
  'together',
  'fireworks',
  'groq',
  'venice',
  'nim',
  'elevenlabs',
  'aws-agentcore',
  'browserbase',
  'steel',
]);

export const STANDARD_VALIDATION_PROVIDERS: ReadonlySet<string> = new Set<string>([
  'anthropic',
  'openai',
  'google',
  'xai',
  'deepseek',
  'openrouter',
  'moonshot',
  'zai',
  'minimax',
  'nebius',
  'together',
  'fireworks',
  'groq',
  'venice',
]);
