import type { SelectedModel } from '../../common/types/provider.js';
import { flushDatabase, getDatabase } from '../database.js';
import { getProviderRow, safeParseJsonWithFallback } from './provider-settings-common.js';

export {
  getAzureFoundryConfig,
  setAzureFoundryConfig,
} from './provider-settings-azure-foundry.js';
export {
  getHuggingFaceLocalConfig,
  setHuggingFaceLocalConfig,
} from './provider-settings-huggingface-local.js';
export { getLiteLLMConfig, setLiteLLMConfig } from './provider-settings-litellm.js';
export { getLMStudioConfig, setLMStudioConfig } from './provider-settings-lmstudio.js';
export { getNimConfig, setNimConfig } from './provider-settings-nim.js';
export { getOllamaConfig, setOllamaConfig } from './provider-settings-ollama.js';

export function getSelectedModel(): SelectedModel | null {
  return safeParseJsonWithFallback<SelectedModel>(getProviderRow().selected_model);
}

export function setSelectedModel(model: SelectedModel): void {
  const db = getDatabase();
  db.run('UPDATE app_settings SET selected_model = ? WHERE id = 1', [JSON.stringify(model)]);
  flushDatabase();
}

export function getOpenAiBaseUrl(): string {
  const row = getProviderRow();
  return row.openai_base_url || '';
}

export function setOpenAiBaseUrl(baseUrl: string): void {
  const db = getDatabase();
  db.run('UPDATE app_settings SET openai_base_url = ? WHERE id = 1', [baseUrl || '']);
  flushDatabase();
}
