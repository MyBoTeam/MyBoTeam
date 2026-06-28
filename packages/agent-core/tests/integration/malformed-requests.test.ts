/**
 * Integration test for malformed requests.
 * Tests that the server handles invalid JSON and malformed JSON-RPC messages gracefully.
 *
 * FR-006: Validate incoming messages against JSON-RPC 2.0 schema
 * SC-006: All acceptance scenarios from user stories are satisfied
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DaemonRpcServer } from '../../src/daemon/rpc-server.js';
import { createSocketTransport } from '../../src/daemon/socket-transport.js';
import { getSocketPath } from '../../src/daemon/socket-path.js';
import type { DaemonTransport } from '../../src/daemon/transport.js';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Integration: Malformed Requests', () => {
  let server: DaemonRpcServer;
  let transport: DaemonTransport;
  let testDir: string;
  let socketPath: string;

  beforeAll(async () => {
    testDir = join(tmpdir(), `test-malformed-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    socketPath = getSocketPath(testDir);

    server = new DaemonRpcServer({ socketPath });
    server.registerMethod('test.valid', () => 'ok');
    await server.start();

    transport = await createSocketTransport(socketPath);
  });

  afterAll(async () => {
    transport?.close();
    await server?.stop();
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should handle invalid JSON gracefully', async () => {
    // Send invalid JSON - should not crash the server
    transport.send('{ invalid json }');

    // Wait a bit for processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Server should still be working
    const response = await sendRequest(transport, '1', 'test.valid', {});
    expect(response.result).toBe('ok');
  });

  it('should handle empty line gracefully', async () => {
    transport.send('');
    await new Promise((resolve) => setTimeout(resolve, 100));

    const response = await sendRequest(transport, '2', 'test.valid', {});
    expect(response.result).toBe('ok');
  });

  it('should handle JSON-RPC without method', async () => {
    const message = JSON.stringify({ jsonrpc: '2.0', id: '3', params: {} });
    transport.send(message);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should not crash, server continues
    const response = await sendRequest(transport, '4', 'test.valid', {});
    expect(response.result).toBe('ok');
  });

  it('should handle JSON-RPC without id', async () => {
    const message = JSON.stringify({ jsonrpc: '2.0', method: 'test.valid', params: {} });
    transport.send(message);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const response = await sendRequest(transport, '5', 'test.valid', {});
    expect(response.result).toBe('ok');
  });

  it('should continue working after malformed request', async () => {
    // Send malformed request
    transport.send('not json at all');
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Server should still handle valid requests
    const response = await sendRequest(transport, '6', 'test.valid', {});
    expect(response.result).toBe('ok');
  });
});

function sendRequest(
  transport: DaemonTransport,
  id: string | number | null,
  method: string,
  params: unknown,
): Promise<{ jsonrpc: '2.0'; id: string | number | null; result?: unknown; error?: { code: number; message: string } }> {
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
