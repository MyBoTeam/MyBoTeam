import { getDatabase } from '../database.js';
import { rowFromResult } from '../query-helpers.js';

export interface AppSettingsRow {
  id: number;
  debug_mode: number;
  onboarding_complete: number;
  selected_model: string | null;
  ollama_config: string | null;
  litellm_config: string | null;
  azure_foundry_config: string | null;
  lmstudio_config: string | null;
  huggingface_local_config: string | null;
  openai_base_url: string | null;
  theme: string;
  theme_color: string;
  sandbox_config: string;
  cloud_browser_config: string | null;
  messaging_config: string | null;
  notifications_enabled: number;
  nim_config: string | null;
}

export function getRow(): AppSettingsRow {
  const db = getDatabase();
  return rowFromResult<AppSettingsRow>(
    db.exec('SELECT * FROM app_settings WHERE id = 1'),
  ) as AppSettingsRow;
}
