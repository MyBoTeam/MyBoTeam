import { ipcRenderer } from 'electron';

export const providerLocalHandlers = {
  getSelectedModel: (): Promise<{
    provider: string;
    model: string;
    baseUrl?: string;
    deploymentName?: string;
  } | null> => ipcRenderer.invoke('model:get'),
  setSelectedModel: (model: {
    provider: string;
    model: string;
    baseUrl?: string;
    deploymentName?: string;
  }): Promise<void> => ipcRenderer.invoke('model:set', model),

  testOllamaConnection: (
    url: string,
  ): Promise<{
    success: boolean;
    models?: Array<{
      id: string;
      displayName: string;
      size: number;
      toolSupport?: 'supported' | 'unsupported' | 'unknown';
    }>;
    error?: string;
  }> => ipcRenderer.invoke('ollama:test-connection', url),

  getOllamaConfig: (): Promise<{
    baseUrl: string;
    enabled: boolean;
    lastValidated?: number;
    models?: Array<{
      id: string;
      displayName: string;
      size: number;
      toolSupport?: 'supported' | 'unsupported' | 'unknown';
    }>;
  } | null> => ipcRenderer.invoke('ollama:get-config'),

  setOllamaConfig: (
    config: {
      baseUrl: string;
      enabled: boolean;
      lastValidated?: number;
      models?: Array<{
        id: string;
        displayName: string;
        size: number;
        toolSupport?: 'supported' | 'unsupported' | 'unknown';
      }>;
    } | null,
  ): Promise<void> => ipcRenderer.invoke('ollama:set-config', config),

  getAzureFoundryConfig: (): Promise<{
    baseUrl: string;
    deploymentName: string;
    authType: 'api-key' | 'entra-id';
    enabled: boolean;
    lastValidated?: number;
  } | null> => ipcRenderer.invoke('azure-foundry:get-config'),

  setAzureFoundryConfig: (
    config: {
      baseUrl: string;
      deploymentName: string;
      authType: 'api-key' | 'entra-id';
      enabled: boolean;
      lastValidated?: number;
    } | null,
  ): Promise<void> => ipcRenderer.invoke('azure-foundry:set-config', config),

  testAzureFoundryConnection: (config: {
    endpoint: string;
    deploymentName: string;
    authType: 'api-key' | 'entra-id';
    apiKey?: string;
  }): Promise<{
    success: boolean;
    error?: string;
  }> => ipcRenderer.invoke('azure-foundry:test-connection', config),

  saveAzureFoundryConfig: (config: {
    endpoint: string;
    deploymentName: string;
    authType: 'api-key' | 'entra-id';
    apiKey?: string;
  }): Promise<void> => ipcRenderer.invoke('azure-foundry:save-config', config),

  fetchProviderModels: (
    providerId: string,
    options?: { baseUrl?: string; zaiRegion?: string },
  ): Promise<{
    success: boolean;
    models?: Array<{ id: string; name: string }>;
    error?: string;
  }> => ipcRenderer.invoke('provider:fetch-models', providerId, options),

  fetchOpenRouterModels: (): Promise<{
    success: boolean;
    models?: Array<{ id: string; name: string; provider: string; contextLength: number }>;
    error?: string;
  }> => ipcRenderer.invoke('openrouter:fetch-models'),

  testLiteLLMConnection: (
    url: string,
    apiKey?: string,
  ): Promise<{
    success: boolean;
    models?: Array<{ id: string; name: string; provider: string; contextLength: number }>;
    error?: string;
  }> => ipcRenderer.invoke('litellm:test-connection', url, apiKey),

  fetchLiteLLMModels: (): Promise<{
    success: boolean;
    models?: Array<{ id: string; name: string; provider: string; contextLength: number }>;
    error?: string;
  }> => ipcRenderer.invoke('litellm:fetch-models'),

  getLiteLLMConfig: (): Promise<{
    baseUrl: string;
    enabled: boolean;
    lastValidated?: number;
    models?: Array<{ id: string; name: string; provider: string; contextLength: number }>;
  } | null> => ipcRenderer.invoke('litellm:get-config'),

  setLiteLLMConfig: (
    config: {
      baseUrl: string;
      enabled: boolean;
      lastValidated?: number;
      models?: Array<{ id: string; name: string; provider: string; contextLength: number }>;
    } | null,
  ): Promise<void> => ipcRenderer.invoke('litellm:set-config', config),
};
