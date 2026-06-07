import type { HuggingFaceLocalConfig } from '../../common/types/provider.js';
import {
  getProviderRow,
  safeParseJsonWithFallback,
  updateJsonColumn,
} from './provider-settings-common.js';

export function getHuggingFaceLocalConfig(): HuggingFaceLocalConfig | null {
  return safeParseJsonWithFallback<HuggingFaceLocalConfig>(
    getProviderRow().huggingface_local_config,
  );
}

export function setHuggingFaceLocalConfig(config: HuggingFaceLocalConfig | null): void {
  updateJsonColumn('huggingface_local_config', config);
}
