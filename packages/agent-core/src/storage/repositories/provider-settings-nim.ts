import type { NimConfig } from '../../common/types/provider.js';
import {
  getProviderRow,
  safeParseJsonWithFallback,
  updateJsonColumn,
} from './provider-settings-common.js';

export function getNimConfig(): NimConfig | null {
  return safeParseJsonWithFallback<NimConfig>(getProviderRow().nim_config);
}

export function setNimConfig(config: NimConfig | null): void {
  updateJsonColumn('nim_config', config);
}
