import type { ProviderSettings } from '../common/types/providerSettings.js';
import type { ProviderConfig } from './config-generator.js';

export interface ProviderBuildContext {
  providerSettings: ProviderSettings;
  getApiKey: (provider: string) => string | undefined | null;
  azureFoundryToken?: string;

  activeModel: { provider: string; model: string; baseUrl?: string } | null | undefined;
}

export interface ProviderBuildResult {
  configs: ProviderConfig[];

  enableToAdd: string[];

  modelOverride?: { model: string; smallModel: string };
}
