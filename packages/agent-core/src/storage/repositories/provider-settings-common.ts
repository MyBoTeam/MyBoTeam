import { safeParseJsonWithFallback } from '../../utils/json.js';
import { flushDatabase, getDatabase } from '../database.js';
import { rowFromResult } from '../query-helpers.js';

interface AppSettingsProviderRow {
  selected_model: string | null;
  ollama_config: string | null;
  litellm_config: string | null;
  azure_foundry_config: string | null;
  lmstudio_config: string | null;
  huggingface_local_config: string | null;
  openai_base_url: string | null;
  nim_config: string | null;
}

function getProviderRow(): AppSettingsProviderRow {
  const db = getDatabase();
  const row = rowFromResult<AppSettingsProviderRow>(
    db.exec(
      'SELECT selected_model, ollama_config, litellm_config, azure_foundry_config, lmstudio_config, huggingface_local_config, openai_base_url, nim_config FROM app_settings WHERE id = 1',
    ),
  );
  if (!row) {
    throw new Error('app_settings row not found — database may not be initialized');
  }
  return row;
}

function updateJsonColumn<T>(column: string, value: T | null): void {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(column)) {
    throw new Error(`Invalid column name: ${column}`);
  }
  const db = getDatabase();
  db.run(`UPDATE app_settings SET ${column} = ? WHERE id = 1`, [
    value === null ? null : JSON.stringify(value),
  ]);
  flushDatabase();
}

export { getProviderRow, safeParseJsonWithFallback, updateJsonColumn };
