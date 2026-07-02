import type { IpcMainInvokeEvent } from 'electron';
import { ipcMain } from 'electron';
import type { IpcBusClient } from '../../daemon/src/ipc/ipc-bus-client.js';

let daemonClient: IpcBusClient | null = null;

export function setDaemonClient(client: IpcBusClient): void {
  daemonClient = client;
}

export function getDaemonClient(): IpcBusClient | null {
  return daemonClient;
}

export function handle<Args extends unknown[], ReturnType = unknown>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: Args) => ReturnType,
): void {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      return await handler(event, ...(args as Args));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal error';
      throw new Error(message);
    }
  });
}

export function initIpcBridge(): void {
  // Render handlers
  handle(
    'render:execute',
    async (_event, request: { type: string; data: unknown; options?: unknown }) => {
      if (!daemonClient?.isConnected) {
        throw new Error('Daemon not connected');
      }
      return daemonClient.call('render.execute', request);
    },
  );

  handle('render:supported-types', async () => {
    if (!daemonClient?.isConnected) {
      throw new Error('Daemon not connected');
    }
    return daemonClient.call('render.supportedTypes');
  });

  // Daemon handlers
  handle('daemon:ping', async () => {
    if (!daemonClient?.isConnected) {
      throw new Error('Daemon not connected');
    }
    return daemonClient.call('daemon.ping');
  });

  handle('daemon:status', async () => {
    if (!daemonClient?.isConnected) {
      throw new Error('Daemon not connected');
    }
    return daemonClient.call('daemon.getStatus');
  });

  handle('daemon:shutdown', async (_event, timeoutMs?: number) => {
    if (!daemonClient?.isConnected) {
      throw new Error('Daemon not connected');
    }
    return daemonClient.call('daemon.shutdown', { timeoutMs });
  });

  // Plugin handlers
  handle('plugins:list', async () => {
    if (!daemonClient?.isConnected) {
      throw new Error('Daemon not connected');
    }
    return daemonClient.call('plugins.list');
  });

  handle('plugins:health', async (_event, pluginId: string) => {
    if (!daemonClient?.isConnected) {
      throw new Error('Daemon not connected');
    }
    return daemonClient.call('plugins.health', { pluginId });
  });
}
