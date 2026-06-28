/**
 * Integration test for multiple method handlers.
 * Tests that multiple handlers can be registered and called correctly.
 *
 * FR-013: Support registerMethod() API for handler registration
 * SC-009: Server supports registerMethod(), notify(), hasConnectedClients(), and lifecycle callbacks
 */

import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DaemonRpcServer } from '../../src/daemon/rpc-server.js';
import { getSocketPath } from '../../src/daemon/socket-path.js';
import { createSocketTransport } from '../../src/daemon/socket-transport.js';
import type { DaemonTransport } from '../../src/daemon/transport.js';

describe('Integration: Multiple Method Handlers', () => {
  let server: DaemonRpcServer;
  let transport: DaemonTransport;
  let testDir: string;
  let socketPath: string;

  beforeAll(async () => {
    testDir = join(tmpdir(), `test-handlers-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    socketPath = getSocketPath(testDir);

    server = new DaemonRpcServer({ socketPath });

    // Register multiple handlers
    server.registerMethod('math.add', (params: { a: number; b: number }) => params.a + params.b);
    server.registerMethod(
      'math.subtract',
      (params: { a: number; b: number }) => params.a - params.b,
    );
    server.registerMethod('string.upper', (params: { text: string }) => params.text.toUpperCase());
    server.registerMethod('string.lower', (params: { text: string }) => params.text.toLowerCase());

    await server.start();
    transport = await createSocketTransport(socketPath);
  });

  afterAll(async () => {
    transport?.close();
    await server?.stop();
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should call math.add handler', async () => {
    const response = await sendRequest(transport, '1', 'math.add', { a: 5, b: 3 });
    expect(response.result).toBe(8);
  });

  it('should call math.subtract handler', async () => {
    const response = await sendRequest(transport, '2', 'math.subtract', { a: 10, b: 4 });
    expect(response.result).toBe(6);
  });

  it('should call string.upper handler', async () => {
    const response = await sendRequest(transport, '3', 'string.upper', { text: 'hello' });
    expect(response.result).toBe('HELLO');
  });

  it('should call string.lower handler', async () => {
    const response = await sendRequest(transport, '4', 'string.lower', { text: 'WORLD' });
    expect(response.result).toBe('world');
  });

  it('should handle multiple requests in sequence', async () => {
    const r1 = await sendRequest(transport, '5', 'math.add', { a: 1, b: 2 });
    const r2 = await sendRequest(transport, '6', 'math.add', { a: 3, b: 4 });
    const r3 = await sendRequest(transport, '7', 'math.add', { a: 5, b: 6 });

    expect(r1.result).toBe(3);
    expect(r2.result).toBe(7);
    expect(r3.result).toBe(11);
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
