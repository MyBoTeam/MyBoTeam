import {
  clearAppSettings,
  getAppSettings,
  getAzureFoundryConfig,
  getCloseBehavior,
  getCloudBrowserConfig,
  getDebugMode,
  getHuggingFaceLocalConfig,
  getLanguage,
  getLiteLLMConfig,
  getLMStudioConfig,
  getMessagingConfig,
  getNimConfig,
  getNotificationsEnabled,
  getOllamaConfig,
  getOnboardingComplete,
  getOpenAiBaseUrl,
  getSandboxConfig,
  getSelectedModel,
  getTheme,
  getThemeColor,
  setAzureFoundryConfig,
  setCloseBehavior,
  setCloudBrowserConfig,
  setDebugMode,
  setHuggingFaceLocalConfig,
  setLanguage,
  setLiteLLMConfig,
  setLMStudioConfig,
  setMessagingConfig,
  setNimConfig,
  setNotificationsEnabled,
  setOllamaConfig,
  setOnboardingComplete,
  setOpenAiBaseUrl,
  setSandboxConfig,
  setSelectedModel,
  setTheme,
  setThemeColor,
} from '../storage/repositories/appSettings.js';
import {
  clearProviderSettings,
  getActiveProviderId,
  getActiveProviderModel,
  getConnectedProvider,
  getConnectedProviderIds,
  getMyboteamAiCredits,
  getProviderDebugMode,
  getProviderSettings,
  hasReadyProvider,
  removeConnectedProvider,
  saveMyboteamAiCredits,
  setActiveProvider,
  setConnectedProvider,
  setProviderDebugMode,
  updateProviderModel,
} from '../storage/repositories/providerSettings.js';
import type { StorageAPI } from '../types/storage.js';

export function createAppSettingsMethods(): Pick<
  StorageAPI,
  | 'getDebugMode'
  | 'setDebugMode'
  | 'getOnboardingComplete'
  | 'setOnboardingComplete'
  | 'getSelectedModel'
  | 'setSelectedModel'
  | 'getOllamaConfig'
  | 'setOllamaConfig'
  | 'getLiteLLMConfig'
  | 'setLiteLLMConfig'
  | 'getAzureFoundryConfig'
  | 'setAzureFoundryConfig'
  | 'getLMStudioConfig'
  | 'setLMStudioConfig'
  | 'getHuggingFaceLocalConfig'
  | 'setHuggingFaceLocalConfig'
  | 'getNimConfig'
  | 'setNimConfig'
  | 'getOpenAiBaseUrl'
  | 'setOpenAiBaseUrl'
  | 'getTheme'
  | 'setTheme'
  | 'getThemeColor'
  | 'setThemeColor'
  | 'getCloudBrowserConfig'
  | 'setCloudBrowserConfig'
  | 'getMessagingConfig'
  | 'setMessagingConfig'
  | 'getAppSettings'
  | 'clearAppSettings'
  | 'getSandboxConfig'
  | 'setSandboxConfig'
  | 'getNotificationsEnabled'
  | 'setNotificationsEnabled'
  | 'getCloseBehavior'
  | 'setCloseBehavior'
  | 'getLanguage'
  | 'setLanguage'
> {
  return {
    getDebugMode: () => getDebugMode(),
    setDebugMode: (enabled) => setDebugMode(enabled),
    getOnboardingComplete: () => getOnboardingComplete(),
    setOnboardingComplete: (complete) => setOnboardingComplete(complete),
    getSelectedModel: () => getSelectedModel(),
    setSelectedModel: (model) => setSelectedModel(model),
    getOllamaConfig: () => getOllamaConfig(),
    setOllamaConfig: (config) => setOllamaConfig(config),
    getLiteLLMConfig: () => getLiteLLMConfig(),
    setLiteLLMConfig: (config) => setLiteLLMConfig(config),
    getAzureFoundryConfig: () => getAzureFoundryConfig(),
    setAzureFoundryConfig: (config) => setAzureFoundryConfig(config),
    getLMStudioConfig: () => getLMStudioConfig(),
    setLMStudioConfig: (config) => setLMStudioConfig(config),
    getHuggingFaceLocalConfig: () => getHuggingFaceLocalConfig(),
    setHuggingFaceLocalConfig: (config) => setHuggingFaceLocalConfig(config),
    getNimConfig: () => getNimConfig(),
    setNimConfig: (config) => setNimConfig(config),
    getOpenAiBaseUrl: () => getOpenAiBaseUrl(),
    setOpenAiBaseUrl: (baseUrl) => setOpenAiBaseUrl(baseUrl),
    getTheme: () => getTheme(),
    setTheme: (theme) => setTheme(theme),
    getThemeColor: () => getThemeColor(),
    setThemeColor: (themeColor) => setThemeColor(themeColor),
    getCloudBrowserConfig: () => getCloudBrowserConfig(),
    setCloudBrowserConfig: (config) => setCloudBrowserConfig(config),
    getMessagingConfig: () => getMessagingConfig(),
    setMessagingConfig: (config) => setMessagingConfig(config),
    getAppSettings: () => getAppSettings(),
    clearAppSettings: () => clearAppSettings(),
    getSandboxConfig: () => getSandboxConfig(),
    setSandboxConfig: (config) => setSandboxConfig(config),
    getNotificationsEnabled: () => getNotificationsEnabled(),
    setNotificationsEnabled: (enabled) => setNotificationsEnabled(enabled),
    getCloseBehavior: () => getCloseBehavior(),
    setCloseBehavior: (behavior) => setCloseBehavior(behavior),
    getLanguage: () => getLanguage(),
    setLanguage: (language) => setLanguage(language),
  };
}

export function createProviderSettingsMethods(): Pick<
  StorageAPI,
  | 'getProviderSettings'
  | 'setActiveProvider'
  | 'getActiveProviderId'
  | 'getConnectedProvider'
  | 'setConnectedProvider'
  | 'removeConnectedProvider'
  | 'updateProviderModel'
  | 'setProviderDebugMode'
  | 'getProviderDebugMode'
  | 'clearProviderSettings'
  | 'getActiveProviderModel'
  | 'hasReadyProvider'
  | 'getConnectedProviderIds'
  | 'getMyboteamAiCredits'
  | 'saveMyboteamAiCredits'
> {
  return {
    getProviderSettings: () => getProviderSettings(),
    setActiveProvider: (providerId) => setActiveProvider(providerId),
    getActiveProviderId: () => getActiveProviderId(),
    getConnectedProvider: (providerId) => getConnectedProvider(providerId),
    setConnectedProvider: (providerId, provider) => setConnectedProvider(providerId, provider),
    removeConnectedProvider: (providerId) => removeConnectedProvider(providerId),
    updateProviderModel: (providerId, modelId) => updateProviderModel(providerId, modelId),
    setProviderDebugMode: (enabled) => setProviderDebugMode(enabled),
    getProviderDebugMode: () => getProviderDebugMode(),
    clearProviderSettings: () => clearProviderSettings(),
    getActiveProviderModel: () => getActiveProviderModel(),
    hasReadyProvider: () => hasReadyProvider(),
    getConnectedProviderIds: () => getConnectedProviderIds(),
    getMyboteamAiCredits: () => getMyboteamAiCredits(),
    saveMyboteamAiCredits: (usage) => saveMyboteamAiCredits(usage),
  };
}
