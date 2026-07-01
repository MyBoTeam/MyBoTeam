import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { IpcBusServer } from '../../../daemon/src/ipc/ipc-bus-server.js';
import { IpcBusClient } from '../../../daemon/src/ipc/ipc-bus-client.js';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, rm } from 'node:fs/promises';

describe('Full Rendering Chain Integration', () => {
  let server: IpcBusServer;
  let client: IpcBusClient;
  let tempDir: string;
  let socketPath: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ipc-chain-test-'));
    socketPath = join(tempDir, 'test.sock');

    server = new IpcBusServer({ socketPath });
    client = new IpcBusClient({ socketPath });

    // Simulate full rendering pipeline
    server.registerMethod('render.execute', async (params: unknown) => {
      const { type, data, options } = params as {
        type: string;
        data: unknown;
        options?: { quality?: number; format?: string };
      };

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 10));

      return {
        success: true,
        type,
        data,
        options,
        timestamp: Date.now(),
      };
    });

    server.registerMethod('render.preview', async (params: unknown) => {
      const { type, data } = params as { type: string; data: unknown };
      return { preview: true, type, data };
    });

    await server.start();
    await client.connect();
  });

  afterAll(async () => {
    client.close();
    await server.stop();
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should complete full render chain from request to response', async () => {
    const result = await client.call<{
      success: boolean;
      type: string;
      data: unknown;
    }>('render.execute', {
      type: 'pdf',
      data: { content: 'Hello World' },
      options: { quality: 100 },
    });

    expect(result.success).toBe(true);
    expect(result.type).toBe('pdf');
    expect(result.data).toEqual({ content: 'Hello World' });
  });

  it('should handle preview before full render', async () => {
    const preview = await client.call<{ preview: boolean; type: string }>('render.preview', {
      type: 'image',
      data: { url: 'https://example.com' },
    });

    expect(preview.preview).toBe(true);
    expect(preview.type).toBe('image');

    // Then do full render
    const result = await client.call<{ success: boolean }>('render.execute', {
      type: 'image',
      data: { url: 'https://example.com' },
    });

    expect(result.success).toBe(true);
  });

  it('should maintain connection across multiple operations', async () => {
    for (let i = 0; i < 10; i++) {
      const result = await client.call<{ success: boolean }>('render.execute', {
        type: 'text',
        data: { iteration: i },
      });
      expect(result.success).toBe(true);
    }

    expect(client.isConnected).toBe(true);
  });

  it('should handle large payload', async () => {
    const largeData = 'x'.repeat(100 * 1024); // 100KB

    const result = await client.call<{ success: boolean; data: string }>('render.execute', {
      type: 'text',
      data: largeData,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBe(largeData);
  });
});
