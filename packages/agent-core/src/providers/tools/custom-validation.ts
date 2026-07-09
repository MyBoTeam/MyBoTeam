import { sanitizeString } from '../../utils/sanitize.js';
import { validateHttpUrl } from '../../utils/url.js';

const MAX_API_KEY_LENGTH = 1024;
const MAX_MODEL_NAME_LENGTH = 256;
const MAX_PROVIDER_NAME_LENGTH = 100;

export function validateProviderUrl(url: string): URL {
  try {
    return validateHttpUrl(url, 'Provider URL');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[INVALID_URL] ${message}`);
  }
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
    throw new Error(`[INVALID_API_KEY] API key exceeds maximum length of ${MAX_API_KEY_LENGTH}`);
  }

  return trimmed;
}

export function validateModelName(modelName: string): string {
  try {
    return sanitizeString(modelName, 'Model name', MAX_MODEL_NAME_LENGTH);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[VALIDATION_FAILED] ${message}`);
  }
}

export interface ProviderConfigInput {
  name: string;
  url: string;
  apiKey?: string;
  modelName: string;
}

export function validateProviderConfig(config: ProviderConfigInput): void {
  try {
    sanitizeString(config.name, 'Provider name', MAX_PROVIDER_NAME_LENGTH);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[VALIDATION_FAILED] Provider name: ${message}`);
  }
  validateProviderUrl(config.url);
  validateApiKey(config.apiKey);
  validateModelName(config.modelName);
}
