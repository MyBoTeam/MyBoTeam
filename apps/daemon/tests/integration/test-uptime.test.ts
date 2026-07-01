/**
 * Integration test for uptime monitoring setup.
 * Validates SC-007: Daemon maintains uptime monitoring (post-launch metric — monitoring setup only).
 */

import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DaemonRpcServer, getSocketPath, createSocketTransport } from '@myboteam/agent-core/daemon';

describe('Integration: Uptime Monitoring (SC-007)', () => {
  let server: DaemonRpcServer;
  let testDir: string;
  let socketPath: string;

  beforeAll(async () => {
    testDir = join(tmpdir(), `test-uptime-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    socketPath = getSocketPath(testDir);

    server = new DaemonRpcServer({ socketPath });
    server.registerMethod('daemon.status', () => ({
      status: 'running',
      uptime: process.uptime(),
      timestamp: Date.now(),
    }));
    await server.start();
  });

  afterAll(async () => {
    await server?.stop();
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should report daemon status with uptime', async () => {
    const transport = await createSocketTransport(socketPath);

    try {
      const response = await new Promise<{ result: Record<string, unknown> }>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 2000);
        transport.onMessage((data) => {
          clearTimeout(timeout);
          resolve(JSON.parse(data));
        });
        transport.send(
          JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'daemon.status', params: {} }),
        );
      });

      expect(response.result).toBeDefined();
      expect(response.result.status).toBe('running');
      expect(typeof response.result.uptime).toBe('number');
      expect(response.result.uptime).toBeGreaterThanOrEqual(0);
      expect(typeof response.result.timestamp).toBe('number');
    } finally {
      transport.close();
    }
  });

  it('should maintain connectivity over time', async () => {
    const transport = await createSocketTransport(socketPath);

    try {
      for (let i = 0; i < 5; i++) {
        const response = await new Promise<{ result: Record<string, unknown> }>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timeout')), 2000);
          transport.onMessage((data) => {
            clearTimeout(timeout);
            resolve(JSON.parse(data));
          });
          transport.send(
            JSON.stringify({ jsonrpc: '2.0', id: i, method: 'daemon.status', params: {} }),
          );
        });

        expect(response.result.status).toBe('running');
        await new Promise((r) => setTimeout(r, 100));
      }
    } finally {
      transport.close();
    }
  });
});
