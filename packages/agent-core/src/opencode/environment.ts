import type { BedrockCredentials, VertexCredentials } from '../common/types/auth.js';

export type ApiKeys = Record<string, string | null>;

export interface EnvironmentConfig {
  apiKeys: ApiKeys;

  bedrockCredentials?: BedrockCredentials;

  vertexCredentials?: VertexCredentials;

  vertexServiceAccountKeyPath?: string;

  bundledNodeBinPath?: string;

  taskId?: string;

  openAiBaseUrl?: string;

  ollamaHost?: string;
}

const API_KEY_ENV_MAPPING: Record<string, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_API_KEY',
  xai: 'XAI_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  moonshot: 'MOONSHOT_API_KEY',
  zai: 'ZAI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  litellm: 'LITELLM_API_KEY',
  minimax: 'MINIMAX_API_KEY',
};

function setApiKeyEnvironment(env: NodeJS.ProcessEnv, apiKeys: ApiKeys): void {
  for (const [provider, envVar] of Object.entries(API_KEY_ENV_MAPPING)) {
    const key = apiKeys[provider];
    if (key) {
      env[envVar] = key;
    }
  }
}

function setBedrockEnvironment(env: NodeJS.ProcessEnv, credentials: BedrockCredentials): void {
  if (credentials.authType === 'apiKey') {
    env.AWS_BEARER_TOKEN_BEDROCK = credentials.apiKey;
  } else if (credentials.authType === 'accessKeys') {
    env.AWS_ACCESS_KEY_ID = credentials.accessKeyId;
    env.AWS_SECRET_ACCESS_KEY = credentials.secretAccessKey;
    if (credentials.sessionToken) {
      env.AWS_SESSION_TOKEN = credentials.sessionToken;
    }
  } else if (credentials.authType === 'profile') {
    env.AWS_PROFILE = credentials.profileName;
  }

  if (credentials.region) {
    env.AWS_REGION = credentials.region;
  }
}

function setVertexEnvironment(
  env: NodeJS.ProcessEnv,
  credentials: VertexCredentials,
  serviceAccountKeyPath?: string,
): void {
  env.GOOGLE_CLOUD_PROJECT = credentials.projectId;
  env.GOOGLE_CLOUD_LOCATION = credentials.location;

  if (credentials.authType === 'serviceAccount' && serviceAccountKeyPath) {
    env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccountKeyPath;
  }
}

function setBundledNodeEnvironment(env: NodeJS.ProcessEnv, bundledNodeBinPath: string): void {
  env.NODE_BIN_PATH = bundledNodeBinPath;
}

export function buildOpenCodeEnvironment(
  baseEnv: NodeJS.ProcessEnv,
  config: EnvironmentConfig,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...baseEnv };

  if (config.taskId) {
    env.MYBOTEAM_TASK_ID = config.taskId;
  }

  setApiKeyEnvironment(env, config.apiKeys);

  if (config.openAiBaseUrl) {
    env.OPENAI_BASE_URL = config.openAiBaseUrl;
  }

  if (config.bedrockCredentials) {
    setBedrockEnvironment(env, config.bedrockCredentials);
  }

  if (config.vertexCredentials) {
    setVertexEnvironment(env, config.vertexCredentials, config.vertexServiceAccountKeyPath);
  }

  if (config.bundledNodeBinPath) {
    setBundledNodeEnvironment(env, config.bundledNodeBinPath);
  }

  if (config.ollamaHost) {
    env.OLLAMA_HOST = config.ollamaHost;
  }

  return env;
}
