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
  GetProviderRequest,
  GetProviderResponse,
  TestConnectionRequest,
  TestConnectionResponse,
  UpdateProviderResponse,
} from './custom-types.js';
import { validateProviderConfig } from './custom-validation.js';

const VAULT_KEY_PREFIX = 'custom-provider:';
const VAULT_TYPE = 'api_key';
const DEFAULT_TEST_TIMEOUT_MS = 10_000;
const MAX_PROVIDERS_PER_USER = 50;

const log = createChildLogger({ module: 'custom-provider' });

interface ProviderVaultMetadata {
  name: string;
  url: string;
  modelName: string;
  status: CustomProviderStatus;
  createdAt: string;
  updatedAt: string;
  lastTestedAt: string | null;
  testResult: ConnectionTestResult | null;
}

function buildVaultKey(providerId: string): string {
  return `${VAULT_KEY_PREFIX}${providerId}`;
}

function maskApiKey(apiKey: string | undefined): string {
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

export class CustomProviderService {
  constructor(private readonly vault: VaultService) {}

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

  async testConnection(request: TestConnectionRequest): Promise<TestConnectionResponse> {
    try {
      const vaultKey = buildVaultKey(request.providerId);
      const entry = await this.vault.retrieve(vaultKey);

      if (!entry) {
        return { success: false, error: `Provider ${request.providerId} not found` };
      }

      const meta = entry.metadata as unknown as ProviderVaultMetadata;
      const timeout = request.timeout ?? DEFAULT_TEST_TIMEOUT_MS;
      const startTime = Date.now();

      let result: ConnectionTestResult;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(meta.url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'MyBotTeam-CustomProvider/1.0',
          },
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          result = {
            id: randomUUID(),
            providerId: request.providerId,
            testedAt: new Date(),
            success: true,
            error: null,
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
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);

        result = {
          id: randomUUID(),
          providerId: request.providerId,
          testedAt: new Date(),
          success: false,
          error: errorMessage,
          responseTime,
          models: null,
        };
      }

      const newStatus: CustomProviderStatus = result.success ? 'Active' : 'Error';
      const now = new Date().toISOString();

      const updatedMetadata: ProviderVaultMetadata = {
        ...meta,
        status: newStatus,
        lastTestedAt: now,
        updatedAt: now,
        testResult: {
          ...result,
          testedAt: result.testedAt,
        },
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
}
