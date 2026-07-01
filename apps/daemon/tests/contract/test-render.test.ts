import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { IpcBusServer } from '../../src/ipc/ipc-bus-server.js';
import { IpcBusClient } from '../../src/ipc/ipc-bus-client.js';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, rm } from 'node:fs/promises';

describe('IPC Bus Render Contract', () => {
  let server: IpcBusServer;
  let client: IpcBusClient;
  let tempDir: string;
  let socketPath: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ipc-render-test-'));
    socketPath = join(tempDir, 'test.sock');

    server = new IpcBusServer({ socketPath });
    client = new IpcBusClient({ socketPath });

    // Register render method
    server.registerMethod('render.execute', async (params: unknown) => {
      const { type, data } = params as { type: string; data: unknown };
      if (!type || !data) {
        throw new Error('Missing required params: type, data');
      }
      return { content: `Rendered ${type}`, format: type };
    });

    server.registerMethod('render.supportedTypes', () => ['pdf', 'image', 'text']);

    await server.start();
    await client.connect();
  });

  afterAll(async () => {
    client.close();
    await server.stop();
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should render document via IPC and return result', async () => {
    const result = await client.call<{ content: string; format: string }>('render.execute', {
      type: 'pdf',
      data: { title: 'Test Document' },
    });

    expect(result).toBeDefined();
    expect(result.content).toBe('Rendered pdf');
    expect(result.format).toBe('pdf');
  });

  it('should return supported rendering types', async () => {
    const types = await client.call<string[]>('render.supportedTypes');

    expect(types).toBeDefined();
    expect(Array.isArray(types)).toBe(true);
    expect(types).toContain('pdf');
    expect(types).toContain('image');
    expect(types).toContain('text');
  });

  it('should return error for missing params', async () => {
    await expect(
      client.call('render.execute', { type: 'pdf' })
    ).rejects.toThrow('Missing required params');
  });

  it('should return error for unknown method', async () => {
    await expect(
      client.call('render.unknown')
    ).rejects.toThrow('Method not found');
  });

  it('should handle concurrent render requests', async () => {
    const requests = Array.from({ length: 5 }, (_, i) =>
      client.call<{ content: string }>('render.execute', {
        type: 'text',
        data: { id: i },
      })
    );

    const results = await Promise.all(requests);

    expect(results).toHaveLength(5);
    for (const result of results) {
      expect(result.content).toBe('Rendered text');
    }
  });
});
