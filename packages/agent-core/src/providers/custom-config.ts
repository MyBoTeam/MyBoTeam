import { randomUUID } from 'node:crypto';
import { createChildLogger } from '../storage/logger.js';
import type { VaultService } from '../vault/vault-service.js';
import type { VaultEntry } from '../vault/vault-types.js';
import type {
  ConnectionTestResult,
  CreateProviderRequest,
  CreateProviderResponse,
  CustomProvider,
  CustomProviderStatus,
  DeleteProviderRequest,
  DeleteProviderResponse,
  GetProviderRequest,
  GetProviderResponse,
  ListProvidersRequest,
  ListProvidersResponse,
  TestConnectionRequest,
  TestConnectionResponse,
  UpdateProviderRequest,
  UpdateProviderResponse,
} from './custom-types.js';
import {
  validateModelName,
  validateProviderConfig,
  validateProviderUrl,
} from './custom-validation.js';
import { parseRateLimitHeaders } from './tools/rate-limit-parser.js';

const VAULT_KEY_PREFIX = 'custom-provider:';
const VAULT_TYPE = 'api_key';
const DEFAULT_TEST_TIMEOUT_MS = 10_000;
const MAX_PROVIDERS_PER_USER = 50;
const MAX_CONSECUTIVE_RATE_LIMITS = 3;

const log = createChildLogger({ module: 'custom-provider' });

const VALID_TRANSITIONS: Record<CustomProviderStatus, CustomProviderStatus[]> = {
  Active: ['Active', 'Inactive', 'Error'],
  Inactive: ['Active', 'Inactive'],
  Error: ['Active', 'Inactive', 'Error'],
};

function isValidStateTransition(from: CustomProviderStatus, to: CustomProviderStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

interface RateLimitState {
  consecutiveRateLimits: number;
  lastRateLimitAt: string | null;
  temporarilyDisabled: boolean;
}

interface ProviderVaultMetadata {
  name: string;
  url: string;
  apiKey?: string;
  modelName: string;
  status: CustomProviderStatus;
  createdAt: string;
  updatedAt: string;
  lastTestedAt: string | null;
  testResult: ConnectionTestResult | null;
  rateLimitState: RateLimitState;
}

function buildVaultKey(providerId: string): string {
  return `${VAULT_KEY_PREFIX}${providerId}`;
}

/**
 * Masks an API key for safe display in logs and user interfaces.
 *
 * @param apiKey - The API key to mask
 * @returns Masked string in format `****` for short keys, or `xxxx****xxxx` for longer keys
 *
 * @example
 * ```typescript
 * maskApiKey('sk-1234567890abcdef'); // 'sk-1****cdef'
 * maskApiKey('short'); // '****'
 * maskApiKey(undefined); // ''
 * ```
 */
export function maskApiKey(apiKey: string | undefined): string {
  if (!apiKey) return '';
  if (apiKey.length <= 8) return '****';
  return `${apiKey.slice(0, 4)}****${apiKey.slice(-4)}`;
}

function createProviderFromVault(entry: VaultEntry, providerId: string): CustomProvider {
  const meta = entry.metadata as unknown as ProviderVaultMetadata;
  return {
    id: providerId,
    name: meta.name,
    url: meta.url,
    apiKey: null,
    modelName: meta.modelName,
    status: meta.status,
    createdAt: new Date(meta.createdAt),
    updatedAt: new Date(meta.updatedAt),
    lastTestedAt: meta.lastTestedAt ? new Date(meta.lastTestedAt) : null,
    testResult: meta.testResult,
  };
}

function classifyNetworkError(error: unknown): { code: string; message: string } {
  const errorObj = error as Error & { code?: string; cause?: Error };
  const errorCode = errorObj.code ?? '';
  const errorMessage = errorObj.message ?? String(error);

  if (errorObj.name === 'AbortError' || errorCode === 'ABORT_ERR') {
    return { code: 'NETWORK_TIMEOUT', message: '[NETWORK_TIMEOUT] Connection timed out' };
  }
  if (errorCode === 'ENOTFOUND' || errorMessage.includes('getaddrinfo')) {
    return {
      code: 'DNS_RESOLUTION_FAILED',
      message: '[DNS_RESOLUTION_FAILED] DNS resolution failed',
    };
  }
  if (errorCode === 'ECONNREFUSED' || errorMessage.includes('ECONNREFUSED')) {
    return {
      code: 'CONNECTION_REFUSED',
      message: '[CONNECTION_REFUSED] Connection refused by server',
    };
  }
  if (
    errorCode === 'ERR_SSL' ||
    errorCode === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
    errorCode === 'CERT_HAS_EXPIRED' ||
    errorMessage.includes('SSL') ||
    errorMessage.includes('TLS')
  ) {
    return { code: 'SSL_ERROR', message: '[SSL_ERROR] SSL/TLS handshake failed' };
  }
  return { code: 'NETWORK_TIMEOUT', message: `[NETWORK_TIMEOUT] ${errorMessage}` };
}

interface ResponseFormatResult {
  content: string;
  format: 'openai' | 'anthropic' | 'generic' | 'unknown';
  warning?: string;
}

function detectAndTransformResponse(data: unknown): ResponseFormatResult {
  if (typeof data !== 'object' || data === null) {
    return { content: String(data), format: 'unknown', warning: 'Unrecognized response format' };
  }

  const obj = data as Record<string, unknown>;

  if (Array.isArray(obj.choices) && obj.choices.length > 0) {
    const choice = obj.choices[0] as Record<string, unknown>;
    if (choice.message && typeof choice.message === 'object') {
      const message = choice.message as Record<string, unknown>;
      if (typeof message.content === 'string') {
        return { content: message.content, format: 'openai' };
      }
    }
  }

  if (Array.isArray(obj.generations) && obj.generations.length > 0) {
    const gen = obj.generations[0] as Record<string, unknown>;
    if (typeof gen.text === 'string') {
      return { content: gen.text, format: 'anthropic' };
    }
  }

  if (Array.isArray(obj.results) && obj.results.length > 0) {
    const result = obj.results[0] as Record<string, unknown>;
    if (typeof result.output === 'string') {
      return { content: result.output, format: 'generic' };
    }
  }

  return {
    content: JSON.stringify(data),
    format: 'unknown',
    warning: 'Unrecognized response format, passed through unchanged',
  };
}

/**
 * Service for managing custom LLM provider configurations.
 *
 * Provides CRUD operations for custom providers with:
 * - Encrypted API key storage via vault
 * - Connection testing with network error classification
 * - Rate limit detection and temporary provider disablement
 * - OpenAI-compatible API format validation
 * - Response format auto-detection and transformation
 *
 * @example
 * ```typescript
 * const service = new CustomProviderService(vaultService);
 *
 * // Create a provider
 * const result = await service.createProvider({
 *   name: 'My Provider',
 *   url: 'https://api.example.com/v1',
 *   apiKey: 'sk-...',
 *   modelName: 'gpt-4',
 * });
 *
 * // Test connection
 * if (result.success) {
 *   const test = await service.testConnection({ providerId: result.provider.id });
 * }
 * ```
 */
export class CustomProviderService {
  constructor(private readonly vault: VaultService) {}

  /**
   * Creates a new custom provider configuration.
   *
   * @param request - Provider configuration details
   * @returns Creation result with provider details or error message
   *
   * @throws Never throws - all errors are returned in the response
   *
   * @example
   * ```typescript
   * const result = await service.createProvider({
   *   name: 'My OpenAI-Compatible API',
   *   url: 'https://api.example.com/v1',
   *   apiKey: 'sk-...',
   *   modelName: 'gpt-4',
   * });
   *
   * if (result.success) {
   *   console.log('Provider ID:', result.provider.id);
   * }
   * ```
   */
  async createProvider(request: CreateProviderRequest): Promise<CreateProviderResponse> {
    try {
      validateProviderConfig(request);

      const existingProviders = await this.vault.list({ type: 'api_key' });
      const customProviders = existingProviders.filter((e) => e.key.startsWith(VAULT_KEY_PREFIX));

      if (customProviders.length >= MAX_PROVIDERS_PER_USER) {
        const error = `Provider limit reached: maximum ${MAX_PROVIDERS_PER_USER} providers allowed`;
        log.warn({ count: customProviders.length, limit: MAX_PROVIDERS_PER_USER }, error);
        return { success: false, error };
      }

      const uniquenessError = this.checkUniqueness(customProviders, '', request.name, request.url);
      if (uniquenessError) {
        return { success: false, error: uniquenessError };
      }

      const providerId = randomUUID();
      const now = new Date().toISOString();

      log.info(
        {
          providerId,
          name: request.name,
          url: request.url,
          apiKey: maskApiKey(request.apiKey),
          modelName: request.modelName,
        },
        'Creating custom provider',
      );

      const metadata: ProviderVaultMetadata = {
        name: request.name,
        url: request.url,
        modelName: request.modelName,
        status: 'Active',
        createdAt: now,
        updatedAt: now,
        lastTestedAt: null,
        testResult: null,
        rateLimitState: {
          consecutiveRateLimits: 0,
          lastRateLimitAt: null,
          temporarilyDisabled: false,
        },
      };

      const vaultKey = buildVaultKey(providerId);
      await this.vault.store_entry(
        vaultKey,
        request.apiKey || '',
        VAULT_TYPE,
        metadata as unknown as Record<string, unknown>,
      );

      const provider: CustomProvider = {
        id: providerId,
        name: request.name,
        url: request.url,
        apiKey: null,
        modelName: request.modelName,
        status: 'Active',
        createdAt: new Date(now),
        updatedAt: new Date(now),
        lastTestedAt: null,
        testResult: null,
      };

      log.info({ providerId, name: request.name }, 'Custom provider created successfully');
      return { success: true, provider };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error({ error: message }, 'Failed to create custom provider');
      return { success: false, error: message };
    }
  }

  /**
   * Retrieves a custom provider by ID.
   *
   * @param request - Provider ID to retrieve
   * @returns Provider details or error if not found
   *
   * @example
   * ```typescript
   * const result = await service.getProvider({ providerId: 'uuid-here' });
   * if (result.success) {
   *   console.log('Provider:', result.provider.name);
   * }
   * ```
   */
  async getProvider(request: GetProviderRequest): Promise<GetProviderResponse> {
    try {
      const vaultKey = buildVaultKey(request.providerId);
      const entry = await this.vault.retrieve(vaultKey);

      if (!entry) {
        return { success: false, error: `Provider ${request.providerId} not found` };
      }

      const provider = createProviderFromVault(entry, request.providerId);
      return { success: true, provider };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  /**
   * Updates the status of a custom provider.
   *
   * Valid state transitions:
   * - Active → Active, Inactive, Error
   * - Inactive → Active, Inactive
   * - Error → Active, Inactive, Error
   *
   * @param providerId - Provider ID to update
   * @param status - New status to set
   * @returns Updated provider or error if transition is invalid
   *
   * @example
   * ```typescript
   * const result = await service.updateProviderStatus('uuid', 'Inactive');
   * ```
   */
  async updateProviderStatus(
    providerId: string,
    status: CustomProviderStatus,
  ): Promise<UpdateProviderResponse> {
    try {
      const vaultKey = buildVaultKey(providerId);
      const entry = await this.vault.retrieve(vaultKey);

      if (!entry) {
        return { success: false, error: `Provider ${providerId} not found` };
      }

      const meta = entry.metadata as unknown as ProviderVaultMetadata;
      const currentStatus = meta.status;

      if (!isValidStateTransition(currentStatus, status)) {
        return {
          success: false,
          error: `[INVALID_STATE_TRANSITION] Cannot transition from ${currentStatus} to ${status}`,
        };
      }

      const updatedMetadata: ProviderVaultMetadata = {
        ...meta,
        status,
        updatedAt: new Date().toISOString(),
      };

      const updatedEntry = await this.vault.update(
        vaultKey,
        entry.encryptedValue,
        updatedMetadata as unknown as Record<string, unknown>,
      );

      const provider = createProviderFromVault(updatedEntry, providerId);
      return { success: true, provider };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  /**
   * Tests connectivity to a custom provider endpoint.
   *
   * Features:
   * - Validates endpoint responds to `/v1/models`
   * - Extracts available models list
   * - Classifies network errors with specific error codes
   * - Detects rate limiting (HTTP 429) and extracts Retry-After
   * - Temporarily disables provider after 3 consecutive rate limits
   *
   * @param request - Test configuration with provider ID and optional timeout
   * @returns Test result with success status, error details, and available models
   *
   * @example
   * ```typescript
   * const result = await service.testConnection({
   *   providerId: 'uuid-here',
   *   timeout: 15000,
   * });
   *
   * if (result.success) {
   *   console.log('Models:', result.result.models);
   * } else {
   *   console.error('Error:', result.result.error);
   * }
   * ```
   */
  async testConnection(request: TestConnectionRequest): Promise<TestConnectionResponse> {
    try {
      const vaultKey = buildVaultKey(request.providerId);
      const entry = await this.vault.retrieve(vaultKey);

      if (!entry) {
        return { success: false, error: `Provider ${request.providerId} not found` };
      }

      const meta = entry.metadata as unknown as ProviderVaultMetadata;
      const rateLimitState = meta.rateLimitState ?? {
        consecutiveRateLimits: 0,
        lastRateLimitAt: null,
        temporarilyDisabled: false,
      };

      if (rateLimitState.temporarilyDisabled) {
        return {
          success: false,
          error: '[RATE_LIMITED] Provider temporarily disabled due to consecutive rate limits',
        };
      }

      const timeout = request.timeout ?? DEFAULT_TEST_TIMEOUT_MS;
      const startTime = Date.now();

      let result: ConnectionTestResult;
      let rateLimitDetected = false;
      let retryAfter: string | null = null;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const modelsUrl = new URL('/v1/models', meta.url).toString();
        const response = await fetch(modelsUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'MyBotTeam-CustomProvider/1.0',
            ...(meta.apiKey ? { Authorization: `Bearer ${meta.apiKey}` } : {}),
          },
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const models = await this.extractAvailableModels(response);
          result = {
            id: randomUUID(),
            providerId: request.providerId,
            testedAt: new Date(),
            success: true,
            error: null,
            responseTime,
            models,
          };
        } else if (response.status === 429) {
          rateLimitDetected = true;
          const rateLimitInfo = parseRateLimitHeaders(response.headers);
          retryAfter = response.headers.get('Retry-After') ?? rateLimitInfo?.reset ?? null;

          const retryMessage = retryAfter ? `Retry after ${retryAfter} seconds` : 'Retry later';

          result = {
            id: randomUUID(),
            providerId: request.providerId,
            testedAt: new Date(),
            success: false,
            error: `[RATE_LIMITED] Rate limited by provider. ${retryMessage}`,
            responseTime,
            models: null,
          };
        } else {
          result = {
            id: randomUUID(),
            providerId: request.providerId,
            testedAt: new Date(),
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
            responseTime,
            models: null,
          };
        }
      } catch (fetchError) {
        const responseTime = Date.now() - startTime;
        const networkError = classifyNetworkError(fetchError);

        result = {
          id: randomUUID(),
          providerId: request.providerId,
          testedAt: new Date(),
          success: false,
          error: networkError.message,
          responseTime,
          models: null,
        };
      }

      const newStatus: CustomProviderStatus = result.success ? 'Active' : 'Error';
      const now = new Date().toISOString();

      const updatedRateLimitState = { ...rateLimitState };
      if (rateLimitDetected) {
        updatedRateLimitState.consecutiveRateLimits += 1;
        updatedRateLimitState.lastRateLimitAt = now;
        if (updatedRateLimitState.consecutiveRateLimits >= MAX_CONSECUTIVE_RATE_LIMITS) {
          updatedRateLimitState.temporarilyDisabled = true;
          log.warn(
            { providerId: request.providerId, count: updatedRateLimitState.consecutiveRateLimits },
            'Provider temporarily disabled due to consecutive rate limits',
          );
        }
      } else if (result.success) {
        updatedRateLimitState.consecutiveRateLimits = 0;
        updatedRateLimitState.lastRateLimitAt = null;
        updatedRateLimitState.temporarilyDisabled = false;
      }

      const updatedMetadata: ProviderVaultMetadata = {
        ...meta,
        status: newStatus,
        lastTestedAt: now,
        updatedAt: now,
        testResult: {
          ...result,
          testedAt: result.testedAt,
        },
        rateLimitState: updatedRateLimitState,
      };

      await this.vault.update(
        vaultKey,
        entry.encryptedValue,
        updatedMetadata as unknown as Record<string, unknown>,
      );

      return { success: true, result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  /**
   * Updates a custom provider configuration.
   *
   * Only provided fields are updated; omitted fields remain unchanged.
   * Validates URL and model name if provided.
   * Checks uniqueness constraints for name and URL.
   *
   * @param request - Provider ID and fields to update
   * @returns Updated provider or error
   *
   * @example
   * ```typescript
   * const result = await service.updateProvider({
   *   providerId: 'uuid',
   *   name: 'New Provider Name',
   * });
   * ```
   */
  async updateProvider(request: UpdateProviderRequest): Promise<UpdateProviderResponse> {
    try {
      const vaultKey = buildVaultKey(request.providerId);
      const entry = await this.vault.retrieve(vaultKey);

      if (!entry) {
        return { success: false, error: `Provider ${request.providerId} not found` };
      }

      const meta = entry.metadata as unknown as ProviderVaultMetadata;

      if (request.name !== undefined || request.url !== undefined) {
        const existingProviders = await this.vault.list({ type: 'api_key' });
        const customProviders = existingProviders.filter((e) => e.key.startsWith(VAULT_KEY_PREFIX));

        const checkName = request.name ?? meta.name;
        const checkUrl = request.url ?? meta.url;

        const uniquenessError = this.checkUniqueness(
          customProviders,
          vaultKey,
          checkName,
          checkUrl,
        );
        if (uniquenessError) {
          return { success: false, error: uniquenessError };
        }
      }

      if (request.url) {
        validateProviderUrl(request.url);
      }

      if (request.modelName) {
        validateModelName(request.modelName);
      }

      const updatedMetadata: ProviderVaultMetadata = {
        ...meta,
        ...(request.name !== undefined && { name: request.name }),
        ...(request.url !== undefined && { url: request.url }),
        ...(request.modelName !== undefined && { modelName: request.modelName }),
        updatedAt: new Date().toISOString(),
      };

      const newValue = request.apiKey ?? entry.encryptedValue;
      const updatedEntry = await this.vault.update(
        vaultKey,
        newValue,
        updatedMetadata as unknown as Record<string, unknown>,
      );

      const provider = createProviderFromVault(updatedEntry, request.providerId);
      return { success: true, provider };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  /**
   * Soft-deletes a custom provider by setting status to Inactive.
   *
   * The provider configuration is retained in vault but marked as inactive.
   * This allows potential future reactivation.
   *
   * @param request - Provider ID to delete
   * @returns Success status or error
   *
   * @example
   * ```typescript
   * const result = await service.deleteProvider({ providerId: 'uuid' });
   * ```
   */
  async deleteProvider(request: DeleteProviderRequest): Promise<DeleteProviderResponse> {
    try {
      const vaultKey = buildVaultKey(request.providerId);
      const entry = await this.vault.retrieve(vaultKey);

      if (!entry) {
        return { success: false, error: `Provider ${request.providerId} not found` };
      }

      const meta = entry.metadata as unknown as ProviderVaultMetadata;
      const updatedMetadata: ProviderVaultMetadata = {
        ...meta,
        status: 'Inactive',
        updatedAt: new Date().toISOString(),
      };

      await this.vault.update(
        vaultKey,
        entry.encryptedValue,
        updatedMetadata as unknown as Record<string, unknown>,
      );

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  /**
   * Lists custom providers with optional filtering and pagination.
   *
   * @param request - Optional filters (status) and pagination (limit, offset)
   * @returns List of providers and total count
   *
   * @example
   * ```typescript
   * const result = await service.listProviders({
   *   status: 'Active',
   *   limit: 10,
   *   offset: 0,
   * });
   *
   * console.log(`Found ${result.total} providers`);
   * ```
   */
  async listProviders(request: ListProvidersRequest): Promise<ListProvidersResponse> {
    try {
      const existingProviders = await this.vault.list({ type: 'api_key' });
      const customProviders = existingProviders.filter((e) => e.key.startsWith(VAULT_KEY_PREFIX));

      let providers = customProviders.map((entry) => {
        const providerId = entry.key.slice(VAULT_KEY_PREFIX.length);
        return createProviderFromVault(entry, providerId);
      });

      if (request.status) {
        providers = providers.filter((p) => p.status === request.status);
      }

      providers.sort((a, b) => a.name.localeCompare(b.name));

      const total = providers.length;
      const limit = request.limit ?? 50;
      const offset = request.offset ?? 0;
      providers = providers.slice(offset, offset + limit);

      return { success: true, providers, total };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  private async extractAvailableModels(response: Response): Promise<string[]> {
    try {
      const data = await response.json();
      const formatResult = detectAndTransformResponse(data);

      if (formatResult.format === 'openai') {
        const modelsData = data as Record<string, unknown>;
        if (Array.isArray(modelsData.data)) {
          return modelsData.data
            .filter((m: unknown) => typeof m === 'object' && m !== null && 'id' in m)
            .map((m: unknown) => (m as { id: string }).id);
        }
      }

      if (formatResult.format === 'unknown' && formatResult.warning) {
        log.warn({ warning: formatResult.warning }, 'Unrecognized models response format');
      }

      return [];
    } catch {
      return [];
    }
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
   * const result = await service.validateApiFormat('https://api.example.com/v1', 'sk-...');
   * if (!result.valid) {
   *   console.error(result.error);
   * }
   * ```
   */
  async validateApiFormat(
    url: string,
    apiKey?: string,
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const modelsUrl = new URL('/v1/models', url).toString();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TEST_TIMEOUT_MS);

      const response = await fetch(modelsUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'MyBotTeam-CustomProvider/1.0',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok && response.status !== 401 && response.status !== 403) {
        return {
          valid: false,
          error: `[API_FORMAT_INVALID] Endpoint does not support OpenAI API format (HTTP ${response.status})`,
        };
      }

      return { valid: true };
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
   * const result = await service.validateModelInList(
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
  async validateModelInList(
    url: string,
    modelName: string,
    apiKey?: string,
  ): Promise<{ valid: boolean; availableModels?: string[]; error?: string }> {
    try {
      const modelsUrl = new URL('/v1/models', url).toString();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TEST_TIMEOUT_MS);

      const response = await fetch(modelsUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'MyBotTeam-CustomProvider/1.0',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
      });

      clearTimeout(timeoutId);

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
  private checkUniqueness(
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
}
