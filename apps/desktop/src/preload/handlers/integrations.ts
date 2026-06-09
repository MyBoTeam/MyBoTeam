import type {
  ConnectorAuthStatus,
  MessagingConnectionStatus,
  OAuthProviderId,
} from '@myboteam/agent-core/common';
import { ipcRenderer } from 'electron';

export const integrationHandlers = {
  onBrowserFrame: (
    callback: (event: {
      taskId: string;
      pageName: string;
      frame: string;
      timestamp: number;
    }) => void,
  ) => {
    const listener = (_: unknown, event: unknown) =>
      callback(event as { taskId: string; pageName: string; frame: string; timestamp: number });
    ipcRenderer.on('browser:frame', listener);
    return () => ipcRenderer.removeListener('browser:frame', listener);
  },

  onBrowserNavigate: (
    callback: (event: { taskId: string; pageName: string; url: string }) => void,
  ) => {
    const listener = (_: unknown, event: unknown) =>
      callback(event as { taskId: string; pageName: string; url: string });
    ipcRenderer.on('browser:navigate', listener);
    return () => ipcRenderer.removeListener('browser:navigate', listener);
  },

  onBrowserStatus: (
    callback: (event: {
      taskId: string;
      pageName: string;
      status: string;
      message?: string;
    }) => void,
  ) => {
    const listener = (_: unknown, event: unknown) =>
      callback(event as { taskId: string; pageName: string; status: string; message?: string });
    ipcRenderer.on('browser:status', listener);
    return () => ipcRenderer.removeListener('browser:status', listener);
  },

  startBrowserPreview: (taskId: string, pageName?: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('browser-preview:start', taskId, pageName),
  stopBrowserPreview: (taskId: string): Promise<{ stopped: boolean }> =>
    ipcRenderer.invoke('browser-preview:stop', taskId),
  getBrowserPreviewStatus: (): Promise<{ active: boolean }> =>
    ipcRenderer.invoke('browser-preview:status'),

  getConnectors: (): Promise<import('@myboteam/agent-core/desktop-main').McpConnector[]> =>
    ipcRenderer.invoke('connectors:list'),
  addConnector: (
    name: string,
    url: string,
  ): Promise<import('@myboteam/agent-core/desktop-main').McpConnector> =>
    ipcRenderer.invoke('connectors:add', name, url),
  deleteConnector: (id: string): Promise<void> => ipcRenderer.invoke('connectors:delete', id),
  setConnectorEnabled: (id: string, enabled: boolean): Promise<void> =>
    ipcRenderer.invoke('connectors:set-enabled', id, enabled),
  startConnectorOAuth: (connectorId: string): Promise<{ state: string; authUrl: string }> =>
    ipcRenderer.invoke('connectors:start-oauth', connectorId),
  completeConnectorOAuth: (
    state: string,
    code: string,
  ): Promise<import('@myboteam/agent-core/desktop-main').McpConnector> =>
    ipcRenderer.invoke('connectors:complete-oauth', state, code),
  disconnectConnector: (connectorId: string): Promise<void> =>
    ipcRenderer.invoke('connectors:disconnect', connectorId),
  onMcpAuthCallback: (callback: (url: string) => void) => {
    const listener = (_: unknown, url: string) => callback(url);
    ipcRenderer.on('auth:mcp-callback', listener);
    return () => {
      ipcRenderer.removeListener('auth:mcp-callback', listener);
    };
  },

  getBuiltInConnectorAuthStatus: (): Promise<ConnectorAuthStatus[]> =>
    ipcRenderer.invoke('connectors:get-built-in-auth-status'),
  loginBuiltInConnector: (providerId: OAuthProviderId): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke('connectors:built-in-login', providerId),
  logoutBuiltInConnector: (providerId: OAuthProviderId): Promise<void> =>
    ipcRenderer.invoke('connectors:built-in-logout', providerId),
  lightdashGetServerUrl: (): Promise<string | null> =>
    ipcRenderer.invoke('lightdash:get-server-url'),
  lightdashSetServerUrl: (url: string): Promise<void> =>
    ipcRenderer.invoke('lightdash:set-server-url', url),
  datadogGetServerUrl: (): Promise<string | null> => ipcRenderer.invoke('datadog:get-server-url'),
  datadogSetServerUrl: (url: string): Promise<void> =>
    ipcRenderer.invoke('datadog:set-server-url', url),

  startHuggingFaceServer: (
    modelId: string,
  ): Promise<{ success: boolean; port?: number; error?: string }> =>
    ipcRenderer.invoke('huggingface-local:start-server', modelId),
  stopHuggingFaceServer: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('huggingface-local:stop-server'),
  getHuggingFaceServerStatus: (): Promise<{
    running: boolean;
    port: number | null;
    loadedModel: string | null;
    isLoading: boolean;
  }> => ipcRenderer.invoke('huggingface-local:server-status'),
  getHuggingFaceLocalConfig: (): Promise<{
    selectedModelId: string | null;
    serverPort: number | null;
    enabled: boolean;
  } | null> => ipcRenderer.invoke('huggingface-local:get-config'),
  setHuggingFaceLocalConfig: (
    config: {
      selectedModelId: string | null;
      serverPort: number | null;
      enabled: boolean;
    } | null,
  ): Promise<void> => ipcRenderer.invoke('huggingface-local:set-config', config),
  testHuggingFaceConnection: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('huggingface-local:test-connection'),
  downloadHuggingFaceModel: (modelId: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('huggingface-local:download-model', modelId),
  listHuggingFaceModels: (): Promise<{
    cached: Array<{ id: string; displayName: string; sizeBytes?: number; downloaded: boolean }>;
    suggested: Array<{ id: string; displayName: string; sizeBytes?: number; downloaded: boolean }>;
  }> => ipcRenderer.invoke('huggingface-local:list-models'),
  deleteHuggingFaceModel: (modelId: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('huggingface-local:delete-model', modelId),
  onHuggingFaceDownloadProgress: (
    callback: (progress: {
      modelId: string;
      status: 'downloading' | 'complete' | 'error';
      progress: number;
      error?: string;
    }) => void,
  ) => {
    const listener = (
      _: unknown,
      progress: {
        modelId: string;
        status: 'downloading' | 'complete' | 'error';
        progress: number;
        error?: string;
      },
    ) => callback(progress);
    ipcRenderer.on('huggingface-local:download-progress', listener);
    return () => {
      ipcRenderer.removeListener('huggingface-local:download-progress', listener);
    };
  },

  getWhatsAppConfig: (): Promise<{
    providerId: string;
    enabled: boolean;
    status: MessagingConnectionStatus;
    phoneNumber?: string;
    lastConnectedAt?: number;
    qrCode?: string;
    qrIssuedAt?: number;
  } | null> => ipcRenderer.invoke('integrations:whatsapp:get-config'),

  connectWhatsApp: (): Promise<void> => ipcRenderer.invoke('integrations:whatsapp:connect'),
  disconnectWhatsApp: (): Promise<void> => ipcRenderer.invoke('integrations:whatsapp:disconnect'),
  setWhatsAppEnabled: (enabled: boolean): Promise<void> =>
    ipcRenderer.invoke('integrations:whatsapp:set-enabled', enabled),

  onWhatsAppQR: (callback: (qr: string) => void): (() => void) => {
    const listener = (_: unknown, qr: string) => callback(qr);
    ipcRenderer.on('integrations:whatsapp:qr', listener);
    return () => ipcRenderer.removeListener('integrations:whatsapp:qr', listener);
  },

  onWhatsAppStatus: (callback: (status: MessagingConnectionStatus) => void): (() => void) => {
    const listener = (_: unknown, status: MessagingConnectionStatus) => callback(status);
    ipcRenderer.on('integrations:whatsapp:status', listener);
    return () => ipcRenderer.removeListener('integrations:whatsapp:status', listener);
  },

  resyncWhatsApp: (): Promise<void> => ipcRenderer.invoke('integrations:whatsapp:resync'),

  onWhatsAppSyncProgress: (
    callback: (data: {
      syncState?: 'idle' | 'syncing' | 'complete';
      chatsProcessed?: number;
      messagesProcessed?: number;
      totalChats?: number;
      totalMessages?: number;
    }) => void,
  ): (() => void) => {
    const listener = (
      _: unknown,
      data: {
        syncState?: 'idle' | 'syncing' | 'complete';
        chatsProcessed?: number;
        messagesProcessed?: number;
        totalChats?: number;
        totalMessages?: number;
      },
    ) => callback(data);
    ipcRenderer.on('integrations:whatsapp:syncProgress', listener);
    return () => ipcRenderer.removeListener('integrations:whatsapp:syncProgress', listener);
  },
};
