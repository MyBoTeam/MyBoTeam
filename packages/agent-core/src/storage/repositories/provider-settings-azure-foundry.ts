import type { AzureFoundryConfig } from '../../common/types/provider.js';
import {
  getProviderRow,
  safeParseJsonWithFallback,
  updateJsonColumn,
} from './provider-settings-common.js';

export function getAzureFoundryConfig(): AzureFoundryConfig | null {
  return safeParseJsonWithFallback<AzureFoundryConfig>(getProviderRow().azure_foundry_config);
}

export function setAzureFoundryConfig(config: AzureFoundryConfig | null): void {
  updateJsonColumn('azure_foundry_config', config);
}
