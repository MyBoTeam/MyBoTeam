import type { OAuthTokens } from '../common/types/connector.js';
import type { SecureStorage } from '../internal/classes/SecureStorage.js';
import {
  closeDatabase,
  getDatabasePath,
  initializeDatabase,
  isDatabaseInitialized,
} from '../storage/database.js';
import type { StorageAPI } from '../types/storage.js';
import { createConsoleLogger } from '../utils/logging.js';

export const DEFAULT_SECURE_STORAGE_APP_ID = 'ai.myboteam.desktop';

export const DEFAULT_RUN_MIGRATIONS = true;

export const storageLog = createConsoleLogger({ prefix: 'Storage' });

export function createStorageLifecycle(
  initialized: { value: boolean },
  databasePath: string | undefined,
  storagePath: string,
  runMigrations: boolean,
): Pick<StorageAPI, 'initialize' | 'close' | 'isDatabaseInitialized' | 'getDatabasePath'> {
  return {
    async initialize() {
      if (initialized.value && isDatabaseInitialized()) {
        return;
      }
      const dbPath = databasePath || `${storagePath}/agent-core.db`;
      await initializeDatabase({ databasePath: dbPath, runMigrations });
      initialized.value = true;
    },
    close() {
      closeDatabase();
      initialized.value = false;
    },
    isDatabaseInitialized: () => isDatabaseInitialized(),
    getDatabasePath: () => getDatabasePath(),
  };
}

export function createConnectorTokens(
  secureStorage: SecureStorage,
  log: ReturnType<typeof createConsoleLogger>,
): Pick<StorageAPI, 'storeConnectorTokens' | 'getConnectorTokens' | 'deleteConnectorTokens'> {
  return {
    storeConnectorTokens: (connectorId, tokens) =>
      secureStorage.set(`connector-tokens:${connectorId}`, JSON.stringify(tokens)),
    getConnectorTokens: (connectorId) => {
      const stored = secureStorage.get(`connector-tokens:${connectorId}`);
      if (!stored) return null;
      try {
        return JSON.parse(stored) as OAuthTokens;
      } catch {
        log.error(`Failed to parse connector tokens for ${connectorId}`);
        return null;
      }
    },
    deleteConnectorTokens: (connectorId) => secureStorage.delete(`connector-tokens:${connectorId}`),
  };
}

export function createSecureStorageMethods(
  secureStorage: SecureStorage,
): Pick<
  StorageAPI,
  | 'set'
  | 'get'
  | 'storeApiKey'
  | 'getApiKey'
  | 'deleteApiKey'
  | 'getAllApiKeys'
  | 'storeBedrockCredentials'
  | 'getBedrockCredentials'
  | 'hasAnyApiKey'
  | 'listStoredCredentials'
  | 'clearSecureStorage'
> {
  return {
    set: (key, value) => secureStorage.set(key, value),
    get: (key) => secureStorage.get(key),
    storeApiKey: (provider, apiKey) => secureStorage.storeApiKey(provider, apiKey),
    getApiKey: (provider) => secureStorage.getApiKey(provider),
    deleteApiKey: (provider) => secureStorage.deleteApiKey(provider),
    getAllApiKeys: () => secureStorage.getAllApiKeys(),
    storeBedrockCredentials: (credentials) => secureStorage.storeBedrockCredentials(credentials),
    getBedrockCredentials: () => secureStorage.getBedrockCredentials(),
    hasAnyApiKey: () => secureStorage.hasAnyApiKey(),
    listStoredCredentials: () => secureStorage.listStoredCredentials(),
    clearSecureStorage: () => secureStorage.clearSecureStorage(),
  };
}
