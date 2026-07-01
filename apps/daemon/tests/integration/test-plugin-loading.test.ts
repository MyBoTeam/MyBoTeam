import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { IpcBusServer } from '../../../daemon/src/ipc/ipc-bus-server.js';
import { IpcBusClient } from '../../../daemon/src/ipc/ipc-bus-client.js';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, rm } from 'node:fs/promises';

describe('Plugin Loading Integration', () => {
  let server: IpcBusServer;
  let client: IpcBusClient;
  let tempDir: string;
  let socketPath: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ipc-plugin-loading-test-'));
    socketPath = join(tempDir, 'test.sock');

    server = new IpcBusServer({ socketPath });
    client = new IpcBusClient({ socketPath });

    // Simulate plugin loading with error isolation
    const plugins = new Map<string, { id: string; enabled: boolean; error?: string }>();

    server.registerMethod('plugins.load', (params: unknown) => {
      const { id } = params as { id: string };

      try {
        // Simulate plugin loading
        if (id === 'bad-plugin') {
          throw new Error('Plugin initialization failed');
        }

        plugins.set(id, { id, enabled: true });
        return { success: true, pluginId: id };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        plugins.set(id, { id, enabled: false, error: message });
        return { success: false, error: message };
      }
    });

    server.registerMethod('plugins.list', () => {
      return Array.from(plugins.values());
    });

    server.registerMethod('render.execute', async (params: unknown) => {
      const { type } = params as { type: string };

      // Find plugin for type
      const plugin = Array.from(plugins.values()).find(
        (p) => p.enabled && (type === 'pdf' || type === 'text'),
      );

      if (!plugin) {
        throw new Error(`No plugin available for type: ${type}`);
      }

      return { success: true, type, pluginId: plugin.id };
    });

    await server.start();
    await client.connect();
  });

  afterAll(async () => {
    client.close();
    await server.stop();
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should load plugin successfully', async () => {
    const result = await client.call<{ success: boolean; pluginId: string }>('plugins.load', {
      id: 'pdf-plugin',
    });

    expect(result.success).toBe(true);
    expect(result.pluginId).toBe('pdf-plugin');
  });

  it('should handle plugin load failure gracefully', async () => {
    const result = await client.call<{ success: boolean; error: string }>('plugins.load', {
      id: 'bad-plugin',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Plugin initialization failed');
  });

  it('should continue operating after plugin failure', async () => {
    // Load a bad plugin
    await client.call('plugins.load', { id: 'bad-plugin' });

    // Load a good plugin
    const result = await client.call<{ success: boolean }>('plugins.load', {
      id: 'good-plugin',
    });

    expect(result.success).toBe(true);

    // Server should still be operational
    const ping = await client.call<{ status: string }>('daemon.ping');
    expect(ping.status).toBe('ok');
  });

  it('should route render requests to appropriate plugin', async () => {
    // Load PDF plugin
    await client.call('plugins.load', { id: 'pdf-plugin' });

    // Render PDF
    const result = await client.call<{ success: boolean; pluginId: string }>('render.execute', {
      type: 'pdf',
      data: { content: 'test' },
    });

    expect(result.success).toBe(true);
    expect(result.pluginId).toBe('pdf-plugin');
  });

  it('should reject render when no plugin available', async () => {
    await expect(
      client.call('render.execute', { type: 'unknown', data: {} }),
    ).rejects.toThrow('No plugin available');
  });
});
