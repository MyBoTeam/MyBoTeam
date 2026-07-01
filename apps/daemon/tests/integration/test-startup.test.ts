/**
 * Integration test for daemon startup time.
 * Validates SC-001: Daemon starts and begins listening within 1 second (p99).
 */

import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSocketTransport, DaemonRpcServer, getSocketPath } from '@myboteam/agent-core/daemon';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const STARTUP_ITERATIONS = 10;
const MAX_STARTUP_TIME_MS = 1000;

describe('Performance: Startup Time (SC-001)', () => {
  let testDir: string;

  beforeAll(() => {
    testDir = join(tmpdir(), `test-perf-startup-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it(`should start daemon within ${MAX_STARTUP_TIME_MS}ms (p99 over ${STARTUP_ITERATIONS} iterations)`, async () => {
    const startupTimes: number[] = [];

    for (let i = 0; i < STARTUP_ITERATIONS; i++) {
      const iterDir = join(testDir, `iter-${i}`);
      mkdirSync(iterDir, { recursive: true });
      const socketPath = getSocketPath(iterDir);
      const server = new DaemonRpcServer({ socketPath });
      server.registerMethod('test.ping', () => ({ pong: true }));

      const startTime = Date.now();
      await server.start();
      const startupTime = Date.now() - startTime;

      startupTimes.push(startupTime);

      const transport = await createSocketTransport(socketPath);
      const response = await new Promise<{ result: unknown }>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 2000);
        transport.onMessage((data) => {
          clearTimeout(timeout);
          resolve(JSON.parse(data));
        });
        transport.send(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'test.ping', params: {} }));
      });

      expect(response.result).toEqual({ pong: true });
      transport.close();
      await server.stop();
      rmSync(join(testDir, `iter-${i}`), { recursive: true, force: true });
    }

    const sortedTimes = startupTimes.sort((a, b) => a - b);
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
    const averageTime = startupTimes.reduce((a, b) => a + b, 0) / startupTimes.length;

    process.stdout.write(`Startup iterations: ${STARTUP_ITERATIONS}\n`);
    process.stdout.write(`Average startup time: ${averageTime.toFixed(2)}ms\n`);
    process.stdout.write(`p99 startup time: ${p99.toFixed(2)}ms\n`);

    expect(p99).toBeLessThan(MAX_STARTUP_TIME_MS);
  });
});
