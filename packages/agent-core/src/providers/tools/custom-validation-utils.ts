/**
 * Validation utilities for custom provider connections.
 *
 * @module custom-validation-utils
 */

import type { VaultService } from '../../vault/vault-service.js';
import type { ProviderVaultMetadata } from './custom-metadata.js';
import { classifyNetworkError } from './custom-utils.js';

const DEFAULT_TEST_TIMEOUT_MS = 10_000;

/**
 * Result of API format validation.
 */
export interface ApiFormatValidationResult {
  /** Whether the endpoint supports OpenAI API format */
  valid: boolean;
  /** Error message if validation failed */
  error?: string;
}

/**
 * Result of model validation.
 */
export interface ModelValidationResult {
  /** Whether the model is available at the endpoint */
  valid: boolean;
  /** List of available models if model not found */
  availableModels?: string[];
  /** Error message if validation failed */
  error?: string;
}

/**
 * Validates that an endpoint supports OpenAI-compatible API format.
 *
 * Checks that the endpoint responds to `/v1/models` endpoint.
 * Returns validation result with specific error codes for network failures.
 *
 * @param url - Base URL of the provider (e.g., 'https://api.example.com/v1')
 * @param apiKey - Optional API key for authentication
 * @returns Validation result indicating if endpoint supports OpenAI format
 *
 * @example
 * ```typescript
 * const result = await validateApiFormat('https://api.example.com/v1', 'sk-...');
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export async function validateApiFormat(
  url: string,
  apiKey?: string,
): Promise<ApiFormatValidationResult> {
  try {
    const modelsUrl = new URL('/v1/models', url).toString();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TEST_TIMEOUT_MS);

    try {
      const response = await fetch(modelsUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'MyBotTeam-CustomProvider/1.0',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return {
            valid: false,
            error: `[AUTH_FAILED] Endpoint requires valid API key (HTTP ${response.status})`,
          };
        }
        return {
          valid: false,
          error: `[API_FORMAT_INVALID] Endpoint does not support OpenAI API format (HTTP ${response.status})`,
        };
      }

      return { valid: true };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const networkError = classifyNetworkError(error);
    return { valid: false, error: networkError.message };
  }
}

/**
 * Validates that a specified model is available at the provider endpoint.
 *
 * Queries `/v1/models` endpoint and checks if the specified model exists
 * in the list of available models.
 *
 * @param url - Base URL of the provider
 * @param modelName - Model name to validate
 * @param apiKey - Optional API key for authentication
 * @returns Validation result with available models if model not found
 *
 * @example
 * ```typescript
 * const result = await validateModelInList(
 *   'https://api.example.com/v1',
 *   'gpt-4',
 *   'sk-...',
 * );
 *
 * if (!result.valid) {
 *   console.error(result.error);
 *   console.log('Available:', result.availableModels);
 * }
 * ```
 */
export async function validateModelInList(
  url: string,
  modelName: string,
  apiKey?: string,
): Promise<ModelValidationResult> {
  try {
    const modelsUrl = new URL('/v1/models', url).toString();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TEST_TIMEOUT_MS);

    try {
      const response = await fetch(modelsUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'MyBotTeam-CustomProvider/1.0',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
      });

      if (!response.ok) {
        return { valid: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const data = (await response.json()) as Record<string, unknown>;
      let availableModels: string[] = [];

      if (Array.isArray(data.data)) {
        availableModels = data.data
          .filter((m: unknown) => typeof m === 'object' && m !== null && 'id' in m)
          .map((m: unknown) => (m as { id: string }).id);
      }

      if (!availableModels.includes(modelName)) {
        const modelList = availableModels.length > 0 ? availableModels.join(', ') : 'none found';
        return {
          valid: false,
          availableModels,
          error: `[MODEL_NOT_IN_LIST] Model "${modelName}" not found. Available models: ${modelList}`,
        };
      }

      return { valid: true, availableModels };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const networkError = classifyNetworkError(error);
    return { valid: false, error: networkError.message };
  }
}

/**
 * Checks that provider name and URL are unique across all providers.
 *
 * @param customProviders - All existing providers
 * @param excludeKey - Vault key to exclude from check (for updates)
 * @param name - Provider name to check
 * @param url - Provider URL to check
 * @returns Error message if not unique, null if valid
 */
export function checkUniqueness(
  customProviders: Awaited<ReturnType<VaultService['list']>>,
  excludeKey: string,
  name: string,
  url: string,
): string | null {
  for (const e of customProviders) {
    if (e.key === excludeKey) continue;
    const eMeta = e.metadata as unknown as ProviderVaultMetadata;
    if (eMeta.name === name) {
      return '[PROVIDER_NAME_EXISTS] Provider name already exists';
    }
    if (eMeta.url === url) {
      return '[PROVIDER_URL_EXISTS] Provider URL already exists';
    }
  }
  return null;
}
