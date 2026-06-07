import type {
  AzureFoundryConfig,
  HuggingFaceLocalConfig,
  LiteLLMConfig,
  LMStudioConfig,
  OllamaConfig,
  SelectedModel,
} from '../../common/types/provider.js';
import { DEFAULT_SANDBOX_CONFIG } from '../../common/types/sandbox.js';
import type {
  LanguagePreference,
  ThemeColorPreference,
  ThemePreference,
} from '../../types/storage.js';
import { safeParseJsonWithFallback } from '../../utils/json.js';
import { flushDatabase, getDatabase } from '../database.js';
import { getRow } from './app-settings-common.js';
import { getLanguage as _getLanguage, VALID_THEME_COLORS } from './ui-settings.js';

export interface AppSettings {
  debugMode: boolean;
  onboardingComplete: boolean;
  selectedModel: SelectedModel | null;
  ollamaConfig: OllamaConfig | null;
  litellmConfig: LiteLLMConfig | null;
  azureFoundryConfig: AzureFoundryConfig | null;
  lmstudioConfig: LMStudioConfig | null;
  huggingfaceLocalConfig: HuggingFaceLocalConfig | null;
  openaiBaseUrl: string;
  theme: ThemePreference;
  themeColor: ThemeColorPreference;
  language: LanguagePreference;
}

const VALID_THEMES_LOCAL: ThemePreference[] = ['system', 'light', 'dark'];

export function getAppSettings(): AppSettings {
  const row = getRow();
  return {
    debugMode: row.debug_mode === 1,
    onboardingComplete: row.onboarding_complete === 1,
    selectedModel: safeParseJsonWithFallback<SelectedModel>(row.selected_model),
    ollamaConfig: safeParseJsonWithFallback<OllamaConfig>(row.ollama_config),
    litellmConfig: safeParseJsonWithFallback<LiteLLMConfig>(row.litellm_config),
    azureFoundryConfig: safeParseJsonWithFallback<AzureFoundryConfig>(row.azure_foundry_config),
    lmstudioConfig: safeParseJsonWithFallback<LMStudioConfig>(row.lmstudio_config),
    huggingfaceLocalConfig: safeParseJsonWithFallback<HuggingFaceLocalConfig>(
      row.huggingface_local_config,
    ),
    openaiBaseUrl: row.openai_base_url || '',
    theme: VALID_THEMES_LOCAL.includes(row.theme as ThemePreference)
      ? (row.theme as ThemePreference)
      : 'system',
    themeColor: VALID_THEME_COLORS.includes(row.theme_color as ThemeColorPreference)
      ? (row.theme_color as ThemeColorPreference)
      : 'neutral',
    language: _getLanguage(),
  };
}

export function clearAppSettings(): void {
  const db = getDatabase();
  db.run(
    `UPDATE app_settings SET
      debug_mode = 0,
      onboarding_complete = 0,
      selected_model = NULL,
      ollama_config = NULL,
      litellm_config = NULL,
      azure_foundry_config = NULL,
      lmstudio_config = NULL,
      huggingface_local_config = NULL,
      nim_config = NULL,
      openai_base_url = '',
      theme = 'system',
      theme_color = 'neutral',
      sandbox_config = '${JSON.stringify(DEFAULT_SANDBOX_CONFIG)}',
      cloud_browser_config = NULL,
      messaging_config = NULL,
      notifications_enabled = 1,
      close_behavior = 'keep-daemon',
      language = 'auto'
    WHERE id = 1`,
  );
  flushDatabase();
}
