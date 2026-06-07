import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ProviderSecrets, SecretsConfig } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let _cachedSecrets: SecretsConfig | null = null;

function loadSecrets(): SecretsConfig {
  if (_cachedSecrets) return _cachedSecrets;

  const envSecrets = loadFromEnvVars();
  if (Object.keys(envSecrets.providers).length > 0) {
    _cachedSecrets = envSecrets;
    return _cachedSecrets;
  }

  const secretsPath = path.join(__dirname, 'secrets.json');
  if (fs.existsSync(secretsPath)) {
    try {
      const content = fs.readFileSync(secretsPath, 'utf-8');
      _cachedSecrets = JSON.parse(content) as SecretsConfig;
      return _cachedSecrets;
    } catch (_e) {}
  }

  _cachedSecrets = { providers: {} };
  return _cachedSecrets;
}

function loadFromEnvVars(): SecretsConfig {
  const providers: Record<string, ProviderSecrets> = {};

  const apiKeyProviders = ['openai', 'google'];

  for (const provider of apiKeyProviders) {
    const envKey = `E2E_${provider.toUpperCase()}_API_KEY`;
    const apiKey = process.env[envKey];
    if (apiKey) {
      providers[provider] = { apiKey };
    }
  }

  if (process.env.E2E_BEDROCK_API_KEY) {
    providers['bedrock-api-key'] = {
      apiKey: process.env.E2E_BEDROCK_API_KEY,
      region: process.env.E2E_BEDROCK_REGION || 'us-east-1',
    };
  }

  if (process.env.E2E_OLLAMA_SERVER_URL || process.env.E2E_OLLAMA_MODEL_ID) {
    providers.ollama = {
      serverUrl: process.env.E2E_OLLAMA_SERVER_URL || 'http://localhost:11434',
      modelId: process.env.E2E_OLLAMA_MODEL_ID,
    };
  }

  return { providers };
}

export function getProviderSecrets(configKey: string): ProviderSecrets | undefined {
  const secrets = loadSecrets();
  return secrets.providers[configKey];
}
