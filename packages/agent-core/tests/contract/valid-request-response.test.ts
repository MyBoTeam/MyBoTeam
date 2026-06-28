/**
 * Contract test for valid JSON-RPC request/response cycle.
 * Tests that a client can send a request and receive a response with matching correlation ID.
 *
 * FR-001: JSON-RPC 2.0 server over Unix domain socket
 * FR-002: Correlation ID matching
 * SC-001: Clients can successfully send requests and receive responses with matching correlation IDs
 */

import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DaemonRpcServer } from '../../src/daemon/rpc-server.js';
import { getSocketPath } from '../../src/daemon/socket-path.js';
import { createSocketTransport } from '../../src/daemon/socket-transport.js';
import type { DaemonTransport } from '../../src/daemon/transport.js';

describe('Contract: Valid Request/Response', () => {
  let server: DaemonRpcServer;
  let transport: DaemonTransport;
  let testDir: string;
  let socketPath: string;

  beforeAll(async () => {
    testDir = join(tmpdir(), `test-contract-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    socketPath = getSocketPath(testDir);

    server = new DaemonRpcServer({ socketPath });
    server.registerMethod('test.echo', (params: { message: string }) => {
      return { echo: params.message };
    });
    await server.start();

    transport = await createSocketTransport(socketPath);
  });

  afterAll(async () => {
    transport?.close();
    await server?.stop();
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should return response with matching correlation ID', async () => {
    const correlationId = `req-${Date.now()}`;
    const response = await sendRequest(transport, correlationId, 'test.echo', { message: 'hello' });

    expect(response).toBeDefined();
    expect(response.id).toBe(correlationId);
    expect(response.jsonrpc).toBe('2.0');
    expect(response.result).toEqual({ echo: 'hello' });
    expect(response.error).toBeUndefined();
  });

  it('should handle null correlation ID', async () => {
    const response = await sendRequest(transport, null, 'test.echo', { message: 'null-id' });

    expect(response).toBeDefined();
    expect(response.id).toBeNull();
    expect(response.jsonrpc).toBe('2.0');
    expect(response.result).toEqual({ echo: 'null-id' });
  });

  it('should handle numeric correlation ID', async () => {
    const correlationId = 12345;
    const response = await sendRequest(transport, correlationId, 'test.echo', {
      message: 'numeric',
    });

    expect(response).toBeDefined();
    expect(response.id).toBe(correlationId);
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

    const handler = (data: string) => {
      try {
        const response = JSON.parse(data);
        // Correlate by id - only resolve if response.id matches request id
        if (response.id === id) {
          clearTimeout(timeout);
          transport.onMessage(() => {}); // Unregister handler
          resolve(response);
        }
        // Ignore non-matching responses
      } catch (err) {
        clearTimeout(timeout);
        transport.onMessage(() => {}); // Unregister handler
        reject(err);
      }
    };

    transport.onMessage(handler);

    const request = { jsonrpc: '2.0', id, method, params };
    transport.send(JSON.stringify(request));
  });
}
