import type { ProviderSettings } from '../common/types/providerSettings.js';
import type { ProviderConfig } from './config-generator.js';
import type { MyboteamRuntime, StorageDeps } from './myboteam-runtime.js';

export interface ProviderBuildContext {
  providerSettings: ProviderSettings;
  getApiKey: (provider: string) => string | undefined | null;
  azureFoundryToken?: string;

  activeModel: { provider: string; model: string; baseUrl?: string } | null | undefined;

  myboteamRuntime?: MyboteamRuntime;

  myboteamStorageDeps?: StorageDeps;
}

export interface ProviderBuildResult {
  configs: ProviderConfig[];

  enableToAdd: string[];

  modelOverride?: { model: string; smallModel: string };
}
