/**
 * Performance test for response time.
 * Validates SC-004: 99% of valid rendering requests complete within 500ms.
 */

import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createSocketTransport,
  DaemonRpcServer,
  type DaemonTransport,
  getSocketPath,
} from '@myboteam/agent-core/daemon';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const TOTAL_REQUESTS = 50;
const MAX_RESPONSE_TIME_MS = 500;

describe('Performance: Response Time (SC-004)', () => {
  let server: DaemonRpcServer;
  let testDir: string;
  let socketPath: string;

  beforeAll(async () => {
    testDir = join(tmpdir(), `test-perf-response-${Date.now()}`);
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

  it(`should complete 99% of requests within ${MAX_RESPONSE_TIME_MS}ms`, async () => {
    const transport = await createSocketTransport(socketPath);
    const responseTimes: number[] = [];

    try {
      for (let i = 0; i < TOTAL_REQUESTS; i++) {
        const time = await measureRequest(transport, i);
        responseTimes.push(time);
      }

      const sortedTimes = responseTimes.sort((a, b) => a - b);
      const p99Index = Math.floor(sortedTimes.length * 0.99);
      const p99 = sortedTimes[p99Index];
      const averageTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

      process.stdout.write(`Total requests: ${TOTAL_REQUESTS}\n`);
      process.stdout.write(`Average response time: ${averageTime.toFixed(2)}ms\n`);
      process.stdout.write(`p99 response time: ${p99.toFixed(2)}ms\n`);

      expect(p99).toBeLessThan(MAX_RESPONSE_TIME_MS);
    } finally {
      transport.close();
    }
  });
});

function measureRequest(transport: DaemonTransport, id: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Request timeout')), 5000);
    const reqStart = Date.now();

    transport.onMessage((data) => {
      try {
        JSON.parse(data);
        clearTimeout(timeout);
        resolve(Date.now() - reqStart);
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
