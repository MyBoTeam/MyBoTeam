import { SecureStorage } from '../internal/classes/SecureStorage.js';
import type { StorageAPI, StorageOptions } from '../types/storage.js';
import {
  createConnectorTokens,
  createSecureStorageMethods,
  createStorageLifecycle,
  DEFAULT_RUN_MIGRATIONS,
  DEFAULT_SECURE_STORAGE_APP_ID,
  storageLog as log,
} from './storage-config.js';
import {
  createConnectorMethods,
  createScheduledTaskMethods,
  createTaskMethods,
} from './storage-methods.js';
import {
  createAppSettingsMethods,
  createProviderSettingsMethods,
} from './storage-settings-methods.js';

export function createStorage(options: StorageOptions = {}): StorageAPI {
  const {
    databasePath,
    runMigrations = DEFAULT_RUN_MIGRATIONS,
    userDataPath,
    secureStorageAppId = DEFAULT_SECURE_STORAGE_APP_ID,
    secureStorageFileName,
  } = options;

  const storagePath = userDataPath || process.cwd();
  const secureStorage = new SecureStorage({
    storagePath,
    appId: secureStorageAppId,
    ...(secureStorageFileName && { fileName: secureStorageFileName }),
  });

  const initialized = { value: false };

  return {
    ...createTaskMethods(),
    ...createAppSettingsMethods(),
    ...createProviderSettingsMethods(),
    ...createConnectorMethods(),
    ...createConnectorTokens(secureStorage, log),
    ...createScheduledTaskMethods(),
    ...createSecureStorageMethods(secureStorage),
    ...createStorageLifecycle(initialized, databasePath, storagePath, runMigrations),
  };
}

export type { StorageAPI, StorageOptions };
