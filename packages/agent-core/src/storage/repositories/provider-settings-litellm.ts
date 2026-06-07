import type { LiteLLMConfig } from '../../common/types/provider.js';
import {
  getProviderRow,
  safeParseJsonWithFallback,
  updateJsonColumn,
} from './provider-settings-common.js';

export function getLiteLLMConfig(): LiteLLMConfig | null {
  return safeParseJsonWithFallback<LiteLLMConfig>(getProviderRow().litellm_config);
}

export function setLiteLLMConfig(config: LiteLLMConfig | null): void {
  updateJsonColumn('litellm_config', config);
}
