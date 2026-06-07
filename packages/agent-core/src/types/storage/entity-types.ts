import type {
  AzureFoundryConfig,
  HuggingFaceLocalConfig,
  LiteLLMConfig,
  LMStudioConfig,
  OllamaConfig,
  SelectedModel,
} from '../../common/types/provider.js';
import type { TaskMessage, TaskStatus } from '../../common/types/task.js';

export interface StoredTask {
  id: string;
  prompt: string;
  summary?: string;
  status: TaskStatus;
  messages: TaskMessage[];
  sessionId?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  workspaceId?: string;
}

export interface StoredFavorite {
  taskId: string;
  prompt: string;
  summary?: string;
  favoritedAt: string;
}

export type ThemePreference = 'system' | 'light' | 'dark';
export type ThemeColorPreference = 'mint' | 'blue' | 'lemon' | 'peach' | 'lavender' | 'neutral';
export type LanguagePreference = 'auto' | 'en' | 'zh-CN' | 'ru' | 'fr';

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
