/**
 * Quickstart validation test.
 * Tests the quickstart scenarios from quickstart.md.
 *
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

describe('Quickstart Validation', () => {
  let server: DaemonRpcServer;
  let transport: DaemonTransport;
  let testDir: string;
  let socketPath: string;

  beforeAll(async () => {
    testDir = join(tmpdir(), `test-quickstart-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    socketPath = getSocketPath(testDir);

    server = new DaemonRpcServer({ socketPath });
    server.registerMethod('echo', (params: { message: string }) => ({ echo: params.message }));
    await server.start();

    transport = await createSocketTransport(socketPath);
  });

  afterAll(async () => {
    transport?.close();
    await server?.stop();
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should send request and receive response', async () => {
    const response = await sendRequest(transport, '1', 'echo', { message: 'hello' });
    expect(response.result).toEqual({ echo: 'hello' });
  });

  it('should handle daemon.ping', async () => {
    const response = await sendRequest(transport, '2', 'daemon.ping', {});
    expect(response.result).toBeDefined();
    expect((response.result as { status: string }).status).toBe('ok');
  });

  it('should report connected clients', async () => {
    expect(server.hasConnectedClients()).toBe(true);
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
