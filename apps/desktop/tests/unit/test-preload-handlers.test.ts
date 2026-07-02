import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  ipcRenderer: {
    invoke: vi.fn().mockResolvedValue(undefined),
    on: vi.fn().mockReturnThis(),
    removeListener: vi.fn().mockReturnThis(),
  },
}));

import { ipcRenderer } from 'electron';
import {
  daemonHandlers,
  ipcBusAPI,
  pluginHandlers,
  renderHandlers,
} from '../../src/preload/ipc-handlers.js';

const mockInvoke = vi.mocked(ipcRenderer.invoke);
const mockOn = vi.mocked(ipcRenderer.on);
const mockRemoveListener = vi.mocked(ipcRenderer.removeListener);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('renderHandlers', () => {
  it('render invokes correct channel with request', async () => {
    mockInvoke.mockResolvedValue({ content: 'ok' });
    const request = { type: 'pdf', data: Buffer.from('test') };
    const result = await renderHandlers.render(request);
    expect(mockInvoke).toHaveBeenCalledWith('render:execute', request);
    expect(result).toEqual({ content: 'ok' });
  });

  it('getSupportedTypes invokes correct channel', async () => {
    mockInvoke.mockResolvedValue(['pdf', 'text']);
    const result = await renderHandlers.getSupportedTypes();
    expect(mockInvoke).toHaveBeenCalledWith('render:supported-types');
    expect(result).toEqual(['pdf', 'text']);
  });

  it('onRenderProgress registers listener and returns cleanup function', () => {
    const callback = vi.fn();
    const cleanup = renderHandlers.onRenderProgress(callback);
    expect(mockOn).toHaveBeenCalledWith('render:progress', expect.any(Function));
    expect(typeof cleanup).toBe('function');
  });

  it('onRenderProgress cleanup removes listener', () => {
    const callback = vi.fn();
    const cleanup = renderHandlers.onRenderProgress(callback);
    cleanup();
    expect(mockRemoveListener).toHaveBeenCalledWith('render:progress', expect.any(Function));
  });
});

describe('daemonHandlers', () => {
  it('ping invokes correct channel', async () => {
    mockInvoke.mockResolvedValue({ status: 'ok' });
    const result = await daemonHandlers.ping();
    expect(mockInvoke).toHaveBeenCalledWith('daemon:ping');
    expect(result).toEqual({ status: 'ok' });
  });

  it('getStatus invokes correct channel', async () => {
    mockInvoke.mockResolvedValue({ status: 'running' });
    const result = await daemonHandlers.getStatus();
    expect(mockInvoke).toHaveBeenCalledWith('daemon:status');
    expect(result).toEqual({ status: 'running' });
  });

  it('shutdown invokes correct channel with timeout', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await daemonHandlers.shutdown(5000);
    expect(mockInvoke).toHaveBeenCalledWith('daemon:shutdown', 5000);
  });

  it('shutdown invokes without timeout when not provided', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await daemonHandlers.shutdown();
    expect(mockInvoke).toHaveBeenCalledWith('daemon:shutdown', undefined);
  });

  it('onShutdown registers and removes listener', () => {
    const callback = vi.fn();
    const cleanup = daemonHandlers.onShutdown(callback);
    expect(mockOn).toHaveBeenCalledWith('daemon:shutdown', expect.any(Function));
    cleanup();
    expect(mockRemoveListener).toHaveBeenCalledWith('daemon:shutdown', expect.any(Function));
  });
});

describe('pluginHandlers', () => {
  it('list invokes correct channel', async () => {
    mockInvoke.mockResolvedValue([]);
    const result = await pluginHandlers.list();
    expect(mockInvoke).toHaveBeenCalledWith('plugins:list');
    expect(result).toEqual([]);
  });

  it('getHealth invokes correct channel with pluginId', async () => {
    mockInvoke.mockResolvedValue({ healthy: true });
    const result = await pluginHandlers.getHealth('plugin-1');
    expect(mockInvoke).toHaveBeenCalledWith('plugins:health', 'plugin-1');
    expect(result).toEqual({ healthy: true });
  });

  it('onPluginError registers and removes listener', () => {
    const callback = vi.fn();
    const cleanup = pluginHandlers.onPluginError(callback);
    expect(mockOn).toHaveBeenCalledWith('plugins:error', expect.any(Function));
    cleanup();
    expect(mockRemoveListener).toHaveBeenCalledWith('plugins:error', expect.any(Function));
  });
});

describe('ipcBusAPI', () => {
  it('exposes all render, daemon, and plugin handlers', () => {
    expect(ipcBusAPI.render).toBeDefined();
    expect(ipcBusAPI.getSupportedTypes).toBeDefined();
    expect(ipcBusAPI.onRenderProgress).toBeDefined();
    expect(ipcBusAPI.ping).toBeDefined();
    expect(ipcBusAPI.getStatus).toBeDefined();
    expect(ipcBusAPI.shutdown).toBeDefined();
    expect(ipcBusAPI.onShutdown).toBeDefined();
    expect(ipcBusAPI.list).toBeDefined();
    expect(ipcBusAPI.getHealth).toBeDefined();
    expect(ipcBusAPI.onPluginError).toBeDefined();
  });
});
