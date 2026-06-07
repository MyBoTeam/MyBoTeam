import type { OllamaConfig } from '../../common/types/provider.js';
import {
  getProviderRow,
  safeParseJsonWithFallback,
  updateJsonColumn,
} from './provider-settings-common.js';

export function getOllamaConfig(): OllamaConfig | null {
  return safeParseJsonWithFallback<OllamaConfig>(getProviderRow().ollama_config);
}

export function setOllamaConfig(config: OllamaConfig | null): void {
  updateJsonColumn('ollama_config', config);
}
