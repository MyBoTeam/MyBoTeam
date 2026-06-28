/**
 * Performance test for concurrent connections.
 * Validates SC-005: 100 concurrent connections with <100ms average response time.
 *
 * SC-005: Server can handle at least 100 concurrent connections without performance degradation
 */

import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DaemonRpcServer } from '../../src/daemon/rpc-server.js';
import { getSocketPath } from '../../src/daemon/socket-path.js';
import { createSocketTransport } from '../../src/daemon/socket-transport.js';
import type { DaemonTransport } from '../../src/daemon/transport.js';

const CONCURRENT_CLIENTS = 100;
const MAX_RESPONSE_TIME_MS = 100;

describe('Performance: Concurrent Connections', () => {
  let server: DaemonRpcServer;
  let testDir: string;
  let socketPath: string;

  beforeAll(async () => {
    testDir = join(tmpdir(), `test-perf-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    socketPath = getSocketPath(testDir);

    server = new DaemonRpcServer({ socketPath });
    server.registerMethod('test.echo', (params: { id: number }) => ({
      id: params.id,
      timestamp: Date.now(),
    }));
    await server.start();
  });

  afterAll(async () => {
    await server?.stop();
    rmSync(testDir, { recursive: true, force: true });
  });

  it(`should handle ${CONCURRENT_CLIENTS} concurrent connections within ${MAX_RESPONSE_TIME_MS}ms`, async () => {
    const transports: DaemonTransport[] = [];
    const startTime = Date.now();
    const responseTimes: number[] = [];

    try {
      // Create all connections
      for (let i = 0; i < CONCURRENT_CLIENTS; i++) {
        const transport = await createSocketTransport(socketPath);
        transports.push(transport);
      }

      // Send requests from all clients concurrently
      const promises = transports.map((transport, index) =>
        sendRequest(transport, index, 'test.echo', { id: index }, responseTimes),
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All responses should be successful
      for (const response of responses) {
        expect(response.result).toBeDefined();
        expect(response.error).toBeUndefined();
      }

      // Calculate response time percentiles
      const sortedTimes = responseTimes.sort((a, b) => a - b);
      const averageTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
      const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
      const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

      process.stdout.write(`Concurrent connections: ${CONCURRENT_CLIENTS}\n`);
      process.stdout.write(`Total time: ${totalTime}ms\n`);
      process.stdout.write(`Average response time: ${averageTime.toFixed(2)}ms\n`);
      process.stdout.write(
        `p50: ${p50.toFixed(2)}ms, p95: ${p95.toFixed(2)}ms, p99: ${p99.toFixed(2)}ms\n`,
      );

      // All percentiles should be under threshold
      expect(p50).toBeLessThan(MAX_RESPONSE_TIME_MS);
      expect(p95).toBeLessThan(MAX_RESPONSE_TIME_MS);
      expect(p99).toBeLessThan(MAX_RESPONSE_TIME_MS);
    } finally {
      // Clean up all transports
      for (const transport of transports) {
        transport.close();
      }
    }
  });
});

function sendRequest(
  transport: DaemonTransport,
  id: string | number | null,
  method: string,
  params: unknown,
  responseTimes: number[],
): Promise<{
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
}> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Request timeout')), 5000);
    const reqStart = Date.now();

    transport.onMessage((data) => {
      try {
        const response = JSON.parse(data);
        responseTimes.push(Date.now() - reqStart);
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
