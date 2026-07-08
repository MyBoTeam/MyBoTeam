import type { VaultService } from '../vault/vault-service.js';
import type { VaultEntry } from '../vault/vault-types.js';
import type {
  CreateProviderRequest,
  CreateProviderResponse,
  CustomProvider,
  CustomProviderStatus,
  GetProviderRequest,
  GetProviderResponse,
} from './custom-types.js';
import { validateProviderConfig } from './custom-validation.js';

const VAULT_KEY_PREFIX = 'custom-provider:';
const VAULT_TYPE = 'api_key';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface ProviderVaultMetadata {
  name: string;
  url: string;
  modelName: string;
  status: CustomProviderStatus;
  createdAt: string;
  updatedAt: string;
  lastTestedAt: string | null;
}

function buildVaultKey(providerId: string): string {
  return `${VAULT_KEY_PREFIX}${providerId}`;
}

function createProviderFromVault(
  entry: VaultEntry,
  decryptedApiKey: string | null,
): CustomProvider {
  const meta = entry.metadata as unknown as ProviderVaultMetadata;
  return {
    id: entry.id,
    name: meta.name,
    url: meta.url,
    apiKey: decryptedApiKey,
    modelName: meta.modelName,
    status: meta.status,
    createdAt: new Date(meta.createdAt),
    updatedAt: new Date(meta.updatedAt),
    lastTestedAt: meta.lastTestedAt ? new Date(meta.lastTestedAt) : null,
    testResult: null,
  };
}

export class CustomProviderService {
  constructor(private readonly vault: VaultService) {}

  async createProvider(request: CreateProviderRequest): Promise<CreateProviderResponse> {
    try {
      validateProviderConfig(request);

      const providerId = generateUUID();
      const now = new Date().toISOString();

      const metadata: ProviderVaultMetadata = {
        name: request.name,
        url: request.url,
        modelName: request.modelName,
        status: 'Active',
        createdAt: now,
        updatedAt: now,
        lastTestedAt: null,
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
        apiKey: request.apiKey || null,
        modelName: request.modelName,
        status: 'Active',
        createdAt: new Date(now),
        updatedAt: new Date(now),
        lastTestedAt: null,
        testResult: null,
      };

      return { success: true, provider };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
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

      let decryptedApiKey: string | null = null;
      if (entry.encryptedValue) {
        decryptedApiKey = await this.vault.decrypt(entry);
      }

      const provider = createProviderFromVault(entry, decryptedApiKey);
      return { success: true, provider };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }
}
