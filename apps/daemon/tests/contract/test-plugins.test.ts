import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { IpcBusClient } from '../../src/ipc/ipc-bus-client.js';
import { IpcBusServer } from '../../src/ipc/ipc-bus-server.js';

describe('Plugin Registration Contract', () => {
  let server: IpcBusServer;
  let client: IpcBusClient;
  let tempDir: string;
  let socketPath: string;
  let plugins: Array<{ id: string; name: string; supportedTypes: string[] }> = [];

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ipc-plugin-test-'));
    socketPath = join(tempDir, 'test.sock');

    server = new IpcBusServer({ socketPath });
    client = new IpcBusClient({ socketPath });

    // Register plugin methods
    server.registerMethod('plugins.list', () => plugins);

    server.registerMethod('plugins.register', (params: unknown) => {
      const { id, name, supportedTypes } = params as {
        id: string;
        name: string;
        supportedTypes: string[];
      };
      plugins.push({ id, name, supportedTypes });
      return { success: true, message: `Plugin ${id} registered` };
    });

    server.registerMethod('plugins.unregister', (params: unknown) => {
      const { id } = params as { id: string };
      const initialLength = plugins.length;
      plugins = plugins.filter((p) => p.id !== id);
      return { success: plugins.length < initialLength };
    });

    server.registerMethod('plugins.health', (params: unknown) => {
      const { pluginId } = params as { pluginId: string };
      const plugin = plugins.find((p) => p.id === pluginId);
      if (!plugin) {
        return { status: 'not-found' };
      }
      return { status: 'healthy', pluginId };
    });

    await server.start();
    await client.connect();
  });

  afterAll(async () => {
    client.close();
    await server.stop();
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should register a new plugin', async () => {
    const result = await client.call<{ success: boolean; message: string }>('plugins.register', {
      id: 'pdf-plugin',
      name: 'PDF Renderer',
      supportedTypes: ['pdf'],
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('pdf-plugin');
  });

  it('should list registered plugins', async () => {
    const result = await client.call<Array<{ id: string; name: string }>>('plugins.list');

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((p) => p.id === 'pdf-plugin')).toBe(true);
  });

  it('should unregister a plugin', async () => {
    // Register first
    await client.call('plugins.register', {
      id: 'temp-plugin',
      name: 'Temp Plugin',
      supportedTypes: ['temp'],
    });

    // Unregister
    const result = await client.call<{ success: boolean }>('plugins.unregister', {
      id: 'temp-plugin',
    });

    expect(result.success).toBe(true);

    // Verify removed
    const plugins = await client.call<Array<{ id: string }>>('plugins.list');
    expect(plugins.some((p) => p.id === 'temp-plugin')).toBe(false);
  });

  it('should return health status for plugin', async () => {
    const result = await client.call<{ status: string; pluginId: string }>('plugins.health', {
      pluginId: 'pdf-plugin',
    });

    expect(result.status).toBe('healthy');
    expect(result.pluginId).toBe('pdf-plugin');
  });

  it('should return not-found for unknown plugin health', async () => {
    const result = await client.call<{ status: string }>('plugins.health', {
      pluginId: 'unknown-plugin',
    });

    expect(result.status).toBe('not-found');
  });
});
