/**
 * Integration test for client-server communication.
 * Tests multiple clients connecting and communicating with the server.
 *
 * FR-005: Handle concurrent requests from multiple clients
 * SC-002: Method routing correctly dispatches to appropriate handler functions
 */

import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DaemonRpcServer } from '../../src/daemon/rpc-server.js';
import { getSocketPath } from '../../src/daemon/socket-path.js';
import { createSocketTransport } from '../../src/daemon/socket-transport.js';
import type { DaemonTransport } from '../../src/daemon/transport.js';

describe('Integration: Client-Server Communication', () => {
  let server: DaemonRpcServer;
  let testDir: string;
  let socketPath: string;

  beforeAll(async () => {
    testDir = join(tmpdir(), `test-integration-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    socketPath = getSocketPath(testDir);

    server = new DaemonRpcServer({ socketPath });
    server.registerMethod('math.add', (params: { a: number; b: number }) => {
      return { sum: params.a + params.b };
    });
    server.registerMethod('math.multiply', (params: { a: number; b: number }) => {
      return { product: params.a * params.b };
    });
    await server.start();
  });

  afterAll(async () => {
    await server?.stop();
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should handle multiple sequential requests from single client', async () => {
    const transport = await createSocketTransport(socketPath);

    try {
      const response1 = await sendRequest(transport, '1', 'math.add', { a: 1, b: 2 });
      expect(response1.result).toEqual({ sum: 3 });

      const response2 = await sendRequest(transport, '2', 'math.multiply', { a: 3, b: 4 });
      expect(response2.result).toEqual({ product: 12 });
    } finally {
      transport.close();
    }
  });

  it('should handle concurrent requests from multiple clients', async () => {
    const client1 = await createSocketTransport(socketPath);
    const client2 = await createSocketTransport(socketPath);

    try {
      const [response1, response2] = await Promise.all([
        sendRequest(client1, 'c1', 'math.add', { a: 10, b: 20 }),
        sendRequest(client2, 'c2', 'math.multiply', { a: 5, b: 6 }),
      ]);

      expect(response1.result).toEqual({ sum: 30 });
      expect(response2.result).toEqual({ product: 30 });
    } finally {
      client1.close();
      client2.close();
    }
  });

  it('should track connected clients', async () => {
    const client = await createSocketTransport(socketPath);
    expect(server.hasConnectedClients()).toBe(true);

    client.close();

    // Poll until disconnection is detected, with timeout
    const start = Date.now();
    while (server.hasConnectedClients() && Date.now() - start < 2000) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(server.hasConnectedClients()).toBe(false);
  });
});

function sendRequest(
  transport: DaemonTransport,
  id: string | number | null,
  method: string,
  params: unknown,
): Promise<{
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
}> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Request timeout')), 5000);

    transport.onMessage((data) => {
      try {
        const response = JSON.parse(data);
        clearTimeout(timeout);
        resolve(response);
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });

    const request = { jsonrpc: '2.0', id, method, params };
    transport.send(JSON.stringify(request));
  });
}
