import { ipcRenderer } from 'electron';

export const renderHandlers = {
  render: (request: { type: string; data: unknown; options?: unknown }): Promise<unknown> =>
    ipcRenderer.invoke('render:execute', request),

  getSupportedTypes: (): Promise<string[]> => ipcRenderer.invoke('render:supported-types'),

  onRenderProgress: (callback: (progress: { requestId: string; status: string }) => void) => {
    const listener = (_: unknown, progress: { requestId: string; status: string }) =>
      callback(progress);
    ipcRenderer.on('render:progress', listener);
    return () => ipcRenderer.removeListener('render:progress', listener);
  },
};

export const daemonHandlers = {
  ping: (): Promise<unknown> => ipcRenderer.invoke('daemon:ping'),

  getStatus: (): Promise<unknown> => ipcRenderer.invoke('daemon:status'),

  shutdown: (timeoutMs?: number): Promise<unknown> =>
    ipcRenderer.invoke('daemon:shutdown', timeoutMs),

  onShutdown: (callback: (data: { reason: string }) => void) => {
    const listener = (_: unknown, data: { reason: string }) => callback(data);
    ipcRenderer.on('daemon:shutdown', listener);
    return () => ipcRenderer.removeListener('daemon:shutdown', listener);
  },
};

export const pluginHandlers = {
  list: (): Promise<unknown[]> => ipcRenderer.invoke('plugins:list'),

  getHealth: (pluginId: string): Promise<unknown> => ipcRenderer.invoke('plugins:health', pluginId),

  onPluginError: (callback: (data: { pluginId: string; error: string }) => void) => {
    const listener = (_: unknown, data: { pluginId: string; error: string }) => callback(data);
    ipcRenderer.on('plugins:error', listener);
    return () => ipcRenderer.removeListener('plugins:error', listener);
  },
};

export const ipcBusAPI = {
  ...renderHandlers,
  ...daemonHandlers,
  ...pluginHandlers,
};
