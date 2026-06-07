import type {
  AppSettingsAPI,
  ConnectorStorageAPI,
  DatabaseLifecycleAPI,
  ProviderSettingsAPI,
  SchedulerStorageAPI,
  SecureStorageAPI,
  TaskStorageAPI,
} from './repository-types.js';

export interface StorageOptions {
  databasePath?: string;
  runMigrations?: boolean;
  userDataPath?: string;
  secureStorageAppId?: string;
  secureStorageFileName?: string;
}

export interface StorageAPI
  extends TaskStorageAPI,
    AppSettingsAPI,
    ProviderSettingsAPI,
    SecureStorageAPI,
    ConnectorStorageAPI,
    SchedulerStorageAPI,
    DatabaseLifecycleAPI {}
