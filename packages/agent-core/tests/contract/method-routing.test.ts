/**
 * Contract test for method routing.
 * Tests that requests are dispatched to the correct handler based on method name.
 *
 * FR-003: Route incoming requests to registered handler functions
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

describe('Contract: Method Routing', () => {
  let server: DaemonRpcServer;
  let transport: DaemonTransport;
  let testDir: string;
  let socketPath: string;

  beforeAll(async () => {
    testDir = join(tmpdir(), `test-routing-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    socketPath = getSocketPath(testDir);

    server = new DaemonRpcServer({ socketPath });
    server.registerMethod('users.list', () => [{ id: 1, name: 'Alice' }]);
    server.registerMethod('users.get', (params: { id: number }) => ({
      id: params.id,
      name: 'Alice',
    }));
    server.registerMethod('system.status', () => ({ status: 'running' }));
    await server.start();

    transport = await createSocketTransport(socketPath);
  });

  afterAll(async () => {
    transport?.close();
    await server?.stop();
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should route to correct handler based on method name', async () => {
    const response = await sendRequest(transport, '1', 'users.list', {});
    expect(response.result).toEqual([{ id: 1, name: 'Alice' }]);
  });

  it('should route to different handler for different method', async () => {
    const response = await sendRequest(transport, '2', 'system.status', {});
    expect(response.result).toEqual({ status: 'running' });
  });

  it('should pass params to handler', async () => {
    const response = await sendRequest(transport, '3', 'users.get', { id: 42 });
    expect(response.result).toEqual({ id: 42, name: 'Alice' });
  });

  it('should return METHOD_NOT_FOUND for unknown method', async () => {
    const response = await sendRequest(transport, '4', 'unknown.method', {});
    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe(-32601);
  });

  it('should handle daemon.ping built-in method', async () => {
    const response = await sendRequest(transport, '5', 'daemon.ping', {});
    expect(response.result).toBeDefined();
    expect((response.result as { status: string }).status).toBe('ok');
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
