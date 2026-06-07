import { ipcRenderer } from 'electron';

export const providerRemoteHandlers = {
  testLMStudioConnection: (
    url: string,
  ): Promise<{
    success: boolean;
    models?: Array<{
      id: string;
      name: string;
      toolSupport: 'supported' | 'unsupported' | 'unknown';
    }>;
    error?: string;
  }> => ipcRenderer.invoke('lmstudio:test-connection', url),

  fetchLMStudioModels: (): Promise<{
    success: boolean;
    models?: Array<{
      id: string;
      name: string;
      toolSupport: 'supported' | 'unsupported' | 'unknown';
    }>;
    error?: string;
  }> => ipcRenderer.invoke('lmstudio:fetch-models'),

  getLMStudioConfig: (): Promise<{
    baseUrl: string;
    enabled: boolean;
    lastValidated?: number;
    models?: Array<{
      id: string;
      name: string;
      toolSupport: 'supported' | 'unsupported' | 'unknown';
    }>;
  } | null> => ipcRenderer.invoke('lmstudio:get-config'),

  setLMStudioConfig: (
    config: {
      baseUrl: string;
      enabled: boolean;
      lastValidated?: number;
      models?: Array<{
        id: string;
        name: string;
        toolSupport: 'supported' | 'unsupported' | 'unknown';
      }>;
    } | null,
  ): Promise<void> => ipcRenderer.invoke('lmstudio:set-config', config),

  testNimConnection: (
    url: string,
    apiKey: string,
  ): Promise<{
    success: boolean;
    models?: Array<{ id: string; name: string; provider: string; contextLength: number }>;
    error?: string;
  }> => ipcRenderer.invoke('nim:test-connection', url, apiKey),

  fetchNimModels: (): Promise<{
    success: boolean;
    models?: Array<{ id: string; name: string; provider: string; contextLength: number }>;
    error?: string;
  }> => ipcRenderer.invoke('nim:fetch-models'),

  testCustomConnection: (
    baseUrl: string,
    apiKey?: string,
  ): Promise<{
    success: boolean;
    error?: string;
  }> => ipcRenderer.invoke('custom:test-connection', baseUrl, apiKey),

  validateBedrockCredentials: (credentials: string) =>
    ipcRenderer.invoke('bedrock:validate', credentials),
  saveBedrockCredentials: (credentials: string) => ipcRenderer.invoke('bedrock:save', credentials),
  getBedrockCredentials: () => ipcRenderer.invoke('bedrock:get-credentials'),
  fetchBedrockModels: (
    credentials: string,
  ): Promise<{
    success: boolean;
    models: Array<{ id: string; name: string; provider: string }>;
    error?: string;
  }> => ipcRenderer.invoke('bedrock:fetch-models', credentials),

  validateVertexCredentials: (credentials: string) =>
    ipcRenderer.invoke('vertex:validate', credentials),
  saveVertexCredentials: (credentials: string) => ipcRenderer.invoke('vertex:save', credentials),
  getVertexCredentials: () => ipcRenderer.invoke('vertex:get-credentials'),
  fetchVertexModels: (
    credentials: string,
  ): Promise<{
    success: boolean;
    models: Array<{ id: string; name: string; provider: string }>;
    error?: string;
  }> => ipcRenderer.invoke('vertex:fetch-models', credentials),
  detectVertexProject: (): Promise<{ success: boolean; projectId: string | null }> =>
    ipcRenderer.invoke('vertex:detect-project'),
  listVertexProjects: (): Promise<{
    success: boolean;
    projects: Array<{ projectId: string; name: string }>;
    error?: string;
  }> => ipcRenderer.invoke('vertex:list-projects'),
};
