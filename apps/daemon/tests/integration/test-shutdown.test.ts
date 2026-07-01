import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { IpcBusServer } from '../../../daemon/src/ipc/ipc-bus-server.js';
import { IpcBusClient } from '../../../daemon/src/ipc/ipc-bus-client.js';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, rm } from 'node:fs/promises';

describe('Shutdown Behavior Integration', () => {
  let server: IpcBusServer;
  let client: IpcBusClient;
  let tempDir: string;
  let socketPath: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ipc-shutdown-test-'));
    socketPath = join(tempDir, 'test.sock');

    server = new IpcBusServer({ socketPath });
    client = new IpcBusClient({ socketPath });

    server.registerMethod('daemon.ping', () => ({ status: 'ok' }));

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

  it('should destroy all client sockets on shutdown', async () => {
    // Verify client is connected
    expect(client.isConnected).toBe(true);

    // Stop server (simulates daemon shutdown)
    await server.stop();

    // Client should detect disconnection
    // Note: The close event may be async, so we give it a moment
    await new Promise((resolve) => setTimeout(resolve, 100));

    // After server stop, client should no longer be connected
    expect(client.isConnected).toBe(false);
  });

  it('should handle multiple clients during shutdown', async () => {
    // Create a new server and multiple clients
    const multiTempDir = await mkdtemp(join(tmpdir(), 'ipc-multi-shutdown-'));
    const multiSocketPath = join(multiTempDir, 'test.sock');

    const multiServer = new IpcBusServer({ socketPath: multiSocketPath });
    const client1 = new IpcBusClient({ socketPath: multiSocketPath });
    const client2 = new IpcBusClient({ socketPath: multiSocketPath });

    multiServer.registerMethod('daemon.ping', () => ({ status: 'ok' }));

    await multiServer.start();
    await client1.connect();
    await client2.connect();

    expect(client1.isConnected).toBe(true);
    expect(client2.isConnected).toBe(true);

    // Shutdown server
    await multiServer.stop();

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Both clients should be disconnected
    expect(client1.isConnected).toBe(false);
    expect(client2.isConnected).toBe(false);

    // Cleanup
    client1.close();
    client2.close();
    await rm(multiTempDir, { recursive: true, force: true });
  });

  it('should reject new requests after shutdown initiated', async () => {
    const rejectTempDir = await mkdtemp(join(tmpdir(), 'ipc-reject-shutdown-'));
    const rejectSocketPath = join(rejectTempDir, 'test.sock');

    const rejectServer = new IpcBusServer({ socketPath: rejectSocketPath });
    let isShuttingDown = false;

    rejectServer.registerMethod('daemon.shutdown', async () => {
      isShuttingDown = true;
      // Send response first, then shutdown in background
      setTimeout(async () => {
        await rejectServer.stop();
      }, 10);
      return { success: true };
    });

    rejectServer.registerMethod('daemon.ping', () => {
      if (isShuttingDown) {
        throw new Error('Daemon is shutting down');
      }
      return { status: 'ok' };
    });

    await rejectServer.start();
    const rejectClient = new IpcBusClient({ socketPath: rejectSocketPath });
    await rejectClient.connect();

    // Initiate shutdown
    await rejectClient.call('daemon.shutdown');

    // Subsequent requests should fail
    await expect(rejectClient.call('daemon.ping')).rejects.toThrow();

    rejectClient.close();
    await rm(rejectTempDir, { recursive: true, force: true });
  });
});
