import type { LMStudioConfig } from '../../common/types/provider.js';
import {
  getProviderRow,
  safeParseJsonWithFallback,
  updateJsonColumn,
} from './provider-settings-common.js';

export function getLMStudioConfig(): LMStudioConfig | null {
  return safeParseJsonWithFallback<LMStudioConfig>(getProviderRow().lmstudio_config);
}

export function setLMStudioConfig(config: LMStudioConfig | null): void {
  updateJsonColumn('lmstudio_config', config);
}
