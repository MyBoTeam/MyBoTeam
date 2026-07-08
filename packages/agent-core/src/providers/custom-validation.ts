import { validateHttpUrl } from '../utils/url.js';
import { sanitizeString } from '../utils/sanitize.js';

const MAX_API_KEY_LENGTH = 1024;
const MAX_MODEL_NAME_LENGTH = 256;

export function validateProviderUrl(url: string): URL {
  return validateHttpUrl(url, 'Provider URL');
}

export function validateApiKey(apiKey: string | undefined): string | null {
  if (apiKey === undefined || apiKey === null) {
    return null;
  }

  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new Error('[INVALID_API_KEY] API key must not be empty');
  }

  if (trimmed.length > MAX_API_KEY_LENGTH) {
    throw new Error(
      `[INVALID_API_KEY] API key exceeds maximum length of ${MAX_API_KEY_LENGTH}`,
    );
  }

  return trimmed;
}

export function validateModelName(modelName: string): string {
  return sanitizeString(modelName, 'Model name', MAX_MODEL_NAME_LENGTH);
}

export interface ProviderConfigInput {
  name: string;
  url: string;
  apiKey?: string;
  modelName: string;
}

export function validateProviderConfig(config: ProviderConfigInput): void {
  sanitizeString(config.name, 'Provider name', 100);
  validateProviderUrl(config.url);
  validateApiKey(config.apiKey);
  validateModelName(config.modelName);
}
