import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { IpcBusClient } from '../../src/ipc/ipc-bus-client.js';
import { IpcBusServer } from '../../src/ipc/ipc-bus-server.js';

describe('Daemon Lifecycle Contract', () => {
  let server: IpcBusServer;
  let client: IpcBusClient;
  let tempDir: string;
  let socketPath: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ipc-lifecycle-test-'));
    socketPath = join(tempDir, 'test.sock');

    server = new IpcBusServer({ socketPath });
    client = new IpcBusClient({ socketPath });

    // Register lifecycle methods
    server.registerMethod('daemon.ping', () => ({
      status: 'ok',
      uptime: Date.now() - startTime,
    }));

    server.registerMethod('daemon.getStatus', () => ({
      isShuttingDown: false,
      uptime: Date.now() - startTime,
      connectedClients: server.hasConnectedClients() ? 1 : 0,
    }));

    server.registerMethod('daemon.shutdown', async () => {
      // Send response first, then shutdown in background
      setTimeout(async () => {
        await server.stop();
      }, 10);
      return { success: true, message: 'Shutdown initiated' };
    });

    const startTime = Date.now();
    await server.start();
    await client.connect();
  });

  afterAll(async () => {
    client.close();
    try {
      await server.stop();
    } catch {}
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should respond to ping with uptime', async () => {
    const result = await client.call<{ status: string; uptime: number }>('daemon.ping');

    expect(result).toBeDefined();
    expect(result.status).toBe('ok');
    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should return daemon status', async () => {
    const result = await client.call<{
      isShuttingDown: boolean;
      uptime: number;
      connectedClients: number;
    }>('daemon.getStatus');

    expect(result).toBeDefined();
    expect(result.isShuttingDown).toBe(false);
    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should handle shutdown request', async () => {
    const result = await client.call<{ success: boolean; message: string }>('daemon.shutdown');

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});
