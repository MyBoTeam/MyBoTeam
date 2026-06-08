import type { CloudBrowserConfig } from '../../common/types/cloud-browser.js';
import type { ConnectorStatus, McpConnector, OAuthTokens } from '../../common/types/connector.js';
import type { ScheduledTask } from '../../common/types/daemon.js';
import type { MessagingConfig } from '../../common/types/messaging.js';
import type {
  AzureFoundryConfig,
  HuggingFaceLocalConfig,
  LiteLLMConfig,
  LMStudioConfig,
  NimConfig,
  OllamaConfig,
  SelectedModel,
} from '../../common/types/provider.js';
import type {
  ConnectedProvider,
  ProviderId,
  ProviderSettings,
} from '../../common/types/providerSettings.js';
import type { SandboxConfig } from '../../common/types/sandbox.js';
import type { Task, TaskMessage, TaskStatus } from '../../common/types/task.js';
import type { TodoItem } from '../../common/types/todo.js';
import type {
  AppSettings,
  LanguagePreference,
  StoredFavorite,
  ThemeColorPreference,
  ThemePreference,
} from './entity-types.js';

export interface TaskStorageAPI {
  getTasks(
    workspaceId?: string | null,
    includeUnassigned?: boolean,
  ): import('./entity-types.js').StoredTask[];
  getTask(taskId: string): import('./entity-types.js').StoredTask | undefined;
  saveTask(task: Task, workspaceId?: string | null): void;
  updateTaskStatus(taskId: string, status: TaskStatus, completedAt?: string): void;
  addTaskMessage(taskId: string, message: TaskMessage): void;
  updateTaskSessionId(taskId: string, sessionId: string): void;
  updateTaskSummary(taskId: string, summary: string): void;
  deleteTask(taskId: string): void;
  clearHistory(): void;
  getTodosForTask(taskId: string): TodoItem[];
  saveTodosForTask(taskId: string, todos: TodoItem[]): void;
  clearTodosForTask(taskId: string): void;
  addFavorite(taskId: string, prompt: string, summary?: string): void;
  removeFavorite(taskId: string): void;
  getFavorites(): StoredFavorite[];
  isFavorite(taskId: string): boolean;
}

export interface AppSettingsAPI {
  getDebugMode(): boolean;
  setDebugMode(enabled: boolean): void;
  getOnboardingComplete(): boolean;
  setOnboardingComplete(complete: boolean): void;
  getSelectedModel(): SelectedModel | null;
  setSelectedModel(model: SelectedModel): void;
  getOllamaConfig(): OllamaConfig | null;
  setOllamaConfig(config: OllamaConfig | null): void;
  getLiteLLMConfig(): LiteLLMConfig | null;
  setLiteLLMConfig(config: LiteLLMConfig | null): void;
  getAzureFoundryConfig(): AzureFoundryConfig | null;
  setAzureFoundryConfig(config: AzureFoundryConfig | null): void;
  getLMStudioConfig(): LMStudioConfig | null;
  setLMStudioConfig(config: LMStudioConfig | null): void;
  getHuggingFaceLocalConfig(): HuggingFaceLocalConfig | null;
  setHuggingFaceLocalConfig(config: HuggingFaceLocalConfig | null): void;
  getNimConfig(): NimConfig | null;
  setNimConfig(config: NimConfig | null): void;
  getOpenAiBaseUrl(): string;
  setOpenAiBaseUrl(baseUrl: string): void;
  getTheme(): ThemePreference;
  setTheme(theme: ThemePreference): void;
  getThemeColor(): ThemeColorPreference;
  setThemeColor(themeColor: ThemeColorPreference): void;
  getCloudBrowserConfig(): CloudBrowserConfig | null;
  setCloudBrowserConfig(config: CloudBrowserConfig | null): void;
  getMessagingConfig(): MessagingConfig | null;
  setMessagingConfig(config: MessagingConfig | null): void;
  getNotificationsEnabled(): boolean;
  setNotificationsEnabled(enabled: boolean): void;
  getCloseBehavior(): 'keep-daemon' | 'stop-daemon';
  setCloseBehavior(behavior: 'keep-daemon' | 'stop-daemon'): void;
  getLanguage(): LanguagePreference;
  setLanguage(language: LanguagePreference): void;
  getAppSettings(): AppSettings;
  clearAppSettings(): void;
  getSandboxConfig(): SandboxConfig;
  setSandboxConfig(config: SandboxConfig): void;
}

export interface ProviderSettingsAPI {
  getProviderSettings(): ProviderSettings;
  setActiveProvider(providerId: ProviderId | null): void;
  getActiveProviderId(): ProviderId | null;
  getConnectedProvider(providerId: ProviderId): ConnectedProvider | null;
  setConnectedProvider(providerId: ProviderId, provider: ConnectedProvider): void;
  removeConnectedProvider(providerId: ProviderId): void;
  updateProviderModel(providerId: ProviderId, modelId: string | null): void;
  setProviderDebugMode(enabled: boolean): void;
  getProviderDebugMode(): boolean;
  clearProviderSettings(): void;
  getActiveProviderModel(): {
    provider: ProviderId;
    model: string;
    baseUrl?: string;
  } | null;
  hasReadyProvider(): boolean;
  getConnectedProviderIds(): ProviderId[];
}

export interface SecureStorageAPI {
  set(key: string, value: string): void;
  get(key: string): string | null;
  storeApiKey(provider: string, apiKey: string): void;
  getApiKey(provider: string): string | null;
  deleteApiKey(provider: string): boolean;
  getAllApiKeys(): Promise<Record<string, string | null>>;
  storeBedrockCredentials(credentials: string): void;
  getBedrockCredentials(): Record<string, string> | null;
  hasAnyApiKey(): Promise<boolean>;
  listStoredCredentials(): Array<{ account: string; password: string }>;
  clearSecureStorage(): void;
}

export interface ConnectorStorageAPI {
  getAllConnectors(): McpConnector[];
  getEnabledConnectors(): McpConnector[];
  getConnectorById(id: string): McpConnector | null;
  upsertConnector(connector: McpConnector): void;
  setConnectorEnabled(id: string, enabled: boolean): void;
  setConnectorStatus(id: string, status: ConnectorStatus): void;
  deleteConnector(id: string): void;
  clearAllConnectors(): void;
  storeConnectorTokens(connectorId: string, tokens: OAuthTokens): void;
  getConnectorTokens(connectorId: string): OAuthTokens | null;
  deleteConnectorTokens(connectorId: string): void;
}

export interface DatabaseLifecycleAPI {
  initialize(): Promise<void>;
  close(): void;
  isDatabaseInitialized(): boolean;
  getDatabasePath(): string | null;
}

export interface SchedulerStorageAPI {
  getAllScheduledTasks(): ScheduledTask[];
  getEnabledScheduledTasks(): ScheduledTask[];
  getScheduledTasksByWorkspace(workspaceId: string): ScheduledTask[];
  getScheduledTaskById(id: string): ScheduledTask | null;
  createScheduledTask(cron: string, prompt: string, workspaceId?: string): ScheduledTask;
  deleteScheduledTask(id: string): void;
  setScheduledTaskEnabled(id: string, enabled: boolean): void;
  updateScheduledTaskLastRun(id: string, timestamp: string, nextRunAt: string): void;
}
