/**
 * Contract test for error responses.
 * Tests that proper JSON-RPC 2.0 error codes are returned for various failure conditions.
 *
 * FR-004: Return error responses with structured codes per JSON-RPC 2.0 specification
 * SC-003: Error responses follow JSON-RPC 2.0 error code specification
 */

import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DaemonRpcServer } from '../../src/daemon/rpc-server.js';
import { getSocketPath } from '../../src/daemon/socket-path.js';
import { createSocketTransport } from '../../src/daemon/socket-transport.js';
import type { DaemonTransport } from '../../src/daemon/transport.js';

describe('Contract: Error Responses', () => {
  let server: DaemonRpcServer;
  let transport: DaemonTransport;
  let testDir: string;
  let socketPath: string;

  beforeAll(async () => {
    testDir = join(tmpdir(), `test-errors-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    socketPath = getSocketPath(testDir);

    server = new DaemonRpcServer({ socketPath });
    server.registerMethod('test.success', () => 'ok');
    server.registerMethod('test.error', () => {
      throw new Error('Test error');
    });
    await server.start();

    transport = await createSocketTransport(socketPath);
  });

  afterAll(async () => {
    transport?.close();
    await server?.stop();
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should return METHOD_NOT_FOUND for unknown method', async () => {
    const response = await sendRequest(transport, '1', 'unknown.method', {});
    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe(-32601);
    expect(response.error?.message).toContain('Method not found');
  });

  it('should return INTERNAL_ERROR when handler throws', async () => {
    const response = await sendRequest(transport, '2', 'test.error', {});
    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe(-32603);
    expect(response.error?.message).toBe('Test error');
  });

  it('should return error response with matching ID', async () => {
    const response = await sendRequest(transport, '3', 'unknown.method', {});
    expect(response.id).toBe('3');
    expect(response.error).toBeDefined();
  });

  it('should include error message in response', async () => {
    const response = await sendRequest(transport, '4', 'unknown.method', {});
    expect(response.error?.message).toBeDefined();
    expect(typeof response.error?.message).toBe('string');
  });

  it('should return success for valid request', async () => {
    const response = await sendRequest(transport, '5', 'test.success', {});
    expect(response.result).toBe('ok');
    expect(response.error).toBeUndefined();
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
