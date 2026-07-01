/**
 * Performance test for concurrent rendering requests.
 * Validates SC-003: 100 concurrent requests with <500ms response time for 99% of requests.
 */

import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DaemonRpcServer, getSocketPath, createSocketTransport, type DaemonTransport } from '@myboteam/agent-core/daemon';

const CONCURRENT_REQUESTS = 100;
const MAX_RESPONSE_TIME_MS = 500;

describe('Performance: Concurrent Rendering Requests (SC-003)', () => {
  let server: DaemonRpcServer;
  let testDir: string;
  let socketPath: string;

  beforeAll(async () => {
    testDir = join(tmpdir(), `test-perf-render-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    socketPath = getSocketPath(testDir);

    server = new DaemonRpcServer({ socketPath });
    server.registerMethod('render.process', (params: { id: number; content: string }) => ({
      id: params.id,
      result: `rendered:${params.content}`,
      timestamp: Date.now(),
    }));
    await server.start();
  });

  afterAll(async () => {
    await server?.stop();
    rmSync(testDir, { recursive: true, force: true });
  });

  it(`should handle ${CONCURRENT_REQUESTS} concurrent requests within ${MAX_RESPONSE_TIME_MS}ms for 99%`, async () => {
    const transports: DaemonTransport[] = [];
    const responseTimes: number[] = [];

    try {
      for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
        const transport = await createSocketTransport(socketPath);
        transports.push(transport);
      }

      const promises = transports.map((transport, index) =>
        sendRenderRequest(transport, index, responseTimes),
      );

      await Promise.all(promises);

      const sortedTimes = responseTimes.sort((a, b) => a - b);
      const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
      const averageTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

      process.stdout.write(`Concurrent requests: ${CONCURRENT_REQUESTS}\n`);
      process.stdout.write(`Average response time: ${averageTime.toFixed(2)}ms\n`);
      process.stdout.write(`p99 response time: ${p99.toFixed(2)}ms\n`);

      expect(responseTimes.length).toBe(CONCURRENT_REQUESTS);
      expect(p99).toBeLessThan(MAX_RESPONSE_TIME_MS);
    } finally {
      for (const transport of transports) {
        transport.close();
      }
    }
  });
});

function sendRenderRequest(
  transport: DaemonTransport,
  id: number,
  responseTimes: number[],
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Request timeout')), 5000);
    const reqStart = Date.now();

    transport.onMessage((data) => {
      try {
        JSON.parse(data);
        responseTimes.push(Date.now() - reqStart);
        clearTimeout(timeout);
        resolve();
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });

    const request = {
      jsonrpc: '2.0',
      id,
      method: 'render.process',
      params: { id, content: `document-${id}` },
    };
    transport.send(JSON.stringify(request));
  });
}
