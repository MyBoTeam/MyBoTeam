import { EventEmitter } from 'node:events';
import type {
  AzureFoundryConfig,
  ConnectedProvider,
  HuggingFaceLocalConfig,
  LanguagePreference,
  LiteLLMConfig,
  LMStudioConfig,
  NimConfig,
  OllamaConfig,
  ProviderId,
  ProviderSettings,
  SandboxConfig,
  SelectedModel,
  SettingsSnapshot,
  StorageAPI,
  ThemeColorPreference,
  ThemePreference,
} from '@myboteam/agent-core';

export type { SettingsChangePayload } from './settings-types.js';
export { SETTINGS_CHANGED } from './settings-types.js';

export class SettingsService extends EventEmitter {
  constructor(private readonly storage: StorageAPI) {
    super();
  }
  getAll(): SettingsSnapshot {
    return {
      app: this.storage.getAppSettings(),
      providers: this.storage.getProviderSettings(),
      huggingFaceLocalConfig: this.storage.getHuggingFaceLocalConfig(),
      notificationsEnabled: this.storage.getNotificationsEnabled(),
      closeBehavior: this.storage.getCloseBehavior(),
      sandboxConfig: this.storage.getSandboxConfig(),
      cloudBrowserConfig: this.storage.getCloudBrowserConfig(),
      messagingConfig: this.storage.getMessagingConfig(),
      nimConfig: this.storage.getNimConfig(),
    };
  }
  setTheme(theme: ThemePreference): void {
    this.storage.setTheme(theme);
    this.emit('settings.changed', { key: 'theme', value: theme });
  }
  setThemeColor(themeColor: ThemeColorPreference): void {
    this.storage.setThemeColor(themeColor);
    this.emit('settings.changed', { key: 'themeColor', value: themeColor });
  }
  setLanguage(language: LanguagePreference): void {
    this.storage.setLanguage(language);
    this.emit('settings.changed', { key: 'language', value: language });
  }
  setDebugMode(enabled: boolean): void {
    this.storage.setDebugMode(enabled);
    this.emit('settings.changed', { key: 'debugMode', value: enabled });
  }
  setNotificationsEnabled(enabled: boolean): void {
    this.storage.setNotificationsEnabled(enabled);
    this.emit('settings.changed', { key: 'notificationsEnabled', value: enabled });
  }
  setCloseBehavior(behavior: 'keep-daemon' | 'stop-daemon'): void {
    this.storage.setCloseBehavior(behavior);
    this.emit('settings.changed', { key: 'closeBehavior', value: behavior });
  }
  setSandboxConfig(config: SandboxConfig): void {
    this.storage.setSandboxConfig(config);
    this.emit('settings.changed', { key: 'sandboxConfig', value: config });
  }
  setCloudBrowserConfig(config: Parameters<StorageAPI['setCloudBrowserConfig']>[0]): void {
    this.storage.setCloudBrowserConfig(config);
    this.emit('settings.changed', { key: 'cloudBrowserConfig', value: config });
  }
  setMessagingConfig(config: Parameters<StorageAPI['setMessagingConfig']>[0]): void {
    this.storage.setMessagingConfig(config);
    this.emit('settings.changed', { key: 'messagingConfig', value: config });
  }
  setOnboardingComplete(complete: boolean): void {
    this.storage.setOnboardingComplete(complete);
    this.emit('settings.changed', { key: 'onboardingComplete', value: complete });
  }
  getNotificationsEnabled(): boolean {
    return this.storage.getNotificationsEnabled();
  }
  getCloseBehavior(): 'keep-daemon' | 'stop-daemon' {
    return this.storage.getCloseBehavior();
  }
  getSandboxConfig(): SandboxConfig {
    return this.storage.getSandboxConfig();
  }
  getCloudBrowserConfig(): ReturnType<StorageAPI['getCloudBrowserConfig']> {
    return this.storage.getCloudBrowserConfig();
  }
  getMessagingConfig(): ReturnType<StorageAPI['getMessagingConfig']> {
    return this.storage.getMessagingConfig();
  }
  getProviderSettings(): ProviderSettings {
    return this.storage.getProviderSettings();
  }
  setActiveProvider(providerId: ProviderId | null): void {
    this.storage.setActiveProvider(providerId);
    this.emit('settings.changed', { key: 'providerSettings' });
  }
  setConnectedProvider(providerId: ProviderId, provider: ConnectedProvider): void {
    this.storage.setConnectedProvider(providerId, provider);
    this.emit('settings.changed', { key: 'providerSettings' });
  }
  removeConnectedProvider(providerId: ProviderId): void {
    this.storage.removeConnectedProvider(providerId);
    this.emit('settings.changed', { key: 'providerSettings' });
  }
  updateProviderModel(providerId: ProviderId, modelId: string | null): void {
    this.storage.updateProviderModel(providerId, modelId);
    this.emit('settings.changed', { key: 'providerSettings' });
  }
  setProviderDebugMode(enabled: boolean): void {
    this.storage.setProviderDebugMode(enabled);
    this.emit('settings.changed', { key: 'providerSettings' });
  }
  getProviderDebugMode(): boolean {
    return this.storage.getProviderDebugMode();
  }
  getHuggingFaceLocalConfig(): HuggingFaceLocalConfig | null {
    return this.storage.getHuggingFaceLocalConfig();
  }
  setHuggingFaceLocalConfig(config: HuggingFaceLocalConfig | null): void {
    this.storage.setHuggingFaceLocalConfig(config);
    this.emit('settings.changed', { key: 'huggingFaceLocalConfig', value: config });
  }
  getSelectedModel(): SelectedModel | null {
    return this.storage.getSelectedModel();
  }
  setSelectedModel(model: SelectedModel): void {
    this.storage.setSelectedModel(model);
    this.emit('settings.changed', { key: 'selectedModel', value: model });
  }
  getOpenAiBaseUrl(): string {
    return this.storage.getOpenAiBaseUrl();
  }
  setOpenAiBaseUrl(baseUrl: string): void {
    this.storage.setOpenAiBaseUrl(baseUrl);
    this.emit('settings.changed', { key: 'openaiBaseUrl', value: baseUrl });
  }
  getOllamaConfig(): OllamaConfig | null {
    return this.storage.getOllamaConfig();
  }
  setOllamaConfig(config: OllamaConfig | null): void {
    this.storage.setOllamaConfig(config);
    this.emit('settings.changed', { key: 'ollamaConfig', value: config });
  }
  getLiteLLMConfig(): LiteLLMConfig | null {
    return this.storage.getLiteLLMConfig();
  }
  setLiteLLMConfig(config: LiteLLMConfig | null): void {
    this.storage.setLiteLLMConfig(config);
    this.emit('settings.changed', { key: 'litellmConfig', value: config });
  }
  getAzureFoundryConfig(): AzureFoundryConfig | null {
    return this.storage.getAzureFoundryConfig();
  }
  setAzureFoundryConfig(config: AzureFoundryConfig | null): void {
    this.storage.setAzureFoundryConfig(config);
    this.emit('settings.changed', { key: 'azureFoundryConfig', value: config });
  }
  getLMStudioConfig(): LMStudioConfig | null {
    return this.storage.getLMStudioConfig();
  }
  setLMStudioConfig(config: LMStudioConfig | null): void {
    this.storage.setLMStudioConfig(config);
    this.emit('settings.changed', { key: 'lmstudioConfig', value: config });
  }
  getNimConfig(): NimConfig | null {
    return this.storage.getNimConfig();
  }
  setNimConfig(config: NimConfig | null): void {
    this.storage.setNimConfig(config);
    this.emit('settings.changed', { key: 'nimConfig', value: config });
  }
}
