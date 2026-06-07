import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DaemonClient } from '../../../src/daemon/client.js';
import { DaemonRpcServer } from '../../../src/daemon/rpc-server.js';
import { createSocketTransport } from '../../../src/daemon/socket-transport.js';

let tempDir: string;
let server: DaemonRpcServer | null = null;

function createTempSocketPath(): string {
  tempDir = mkdtempSync(join(tmpdir(), 'daemon-lifecycle-test-'));
  return join(tempDir, 'test.sock');
}

afterEach(async () => {
  if (server) {
    await server.stop();
    server = null;
  }
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

describe('DaemonClient offNotification', () => {
  it('removes a specific handler so it no longer fires', async () => {
    const socketPath = createTempSocketPath();
    server = new DaemonRpcServer({ socketPath });
    await server.start();

    const transport = await createSocketTransport({ socketPath });
    const client = new DaemonClient({ transport });
    await client.ping();

    const received: unknown[] = [];
    const handler = (data: unknown) => {
      received.push(data);
    };

    client.onNotification('task.progress' as never, handler);

    server.notify('task.progress', { taskId: 'tsk-1', stage: 'running' });
    await new Promise((r) => setTimeout(r, 100));
    expect(received).toHaveLength(1);

    client.offNotification('task.progress' as never, handler);

    server.notify('task.progress', { taskId: 'tsk-2', stage: 'done' });
    await new Promise((r) => setTimeout(r, 100));
    expect(received).toHaveLength(1);

    client.close();
  });

  it('only removes the specific handler, not others on the same method', async () => {
    const socketPath = createTempSocketPath();
    server = new DaemonRpcServer({ socketPath });
    await server.start();

    const transport = await createSocketTransport({ socketPath });
    const client = new DaemonClient({ transport });
    await client.ping();

    const receivedA: unknown[] = [];
    const receivedB: unknown[] = [];
    const handlerA = (data: unknown) => receivedA.push(data);
    const handlerB = (data: unknown) => receivedB.push(data);

    client.onNotification('task.progress' as never, handlerA);
    client.onNotification('task.progress' as never, handlerB);

    client.offNotification('task.progress' as never, handlerA);

    server.notify('task.progress', { taskId: 'tsk-1' });
    await new Promise((r) => setTimeout(r, 100));

    expect(receivedA).toHaveLength(0);
    expect(receivedB).toHaveLength(1);

    client.close();
  });

  it('is a no-op for unregistered handlers', async () => {
    const socketPath = createTempSocketPath();
    server = new DaemonRpcServer({ socketPath });
    await server.start();

    const transport = await createSocketTransport({ socketPath });
    const client = new DaemonClient({ transport });

    client.offNotification('task.progress' as never, () => {});

    client.close();
  });
});

describe('DaemonClient.call per-call timeoutMs', () => {
  it('uses the client-wide default when no per-call override is given', async () => {
    const socketPath = createTempSocketPath();
    server = new DaemonRpcServer({ socketPath });
    server.registerMethod(
      'auth.openai.awaitCompletion' as never,
      (async () => {
        await new Promise(() => {});
      }) as never,
    );
    await server.start();

    const transport = await createSocketTransport({ socketPath });
    const client = new DaemonClient({ transport, timeout: 100 });

    const start = Date.now();
    await expect(
      client.call('auth.openai.awaitCompletion' as never, undefined as never),
    ).rejects.toThrow(/RPC timeout.*100ms/);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(80);
    expect(elapsed).toBeLessThan(500);

    client.close();
  });

  it('per-call timeoutMs overrides the client-wide default — required for OAuth', async () => {
    const socketPath = createTempSocketPath();
    server = new DaemonRpcServer({ socketPath });
    let resolveServerSide: (value: unknown) => void = () => {};
    server.registerMethod(
      'auth.openai.awaitCompletion' as never,
      (async () => {
        return new Promise((resolve) => {
          resolveServerSide = resolve;
        });
      }) as never,
    );
    await server.start();

    const transport = await createSocketTransport({ socketPath });

    const client = new DaemonClient({ transport, timeout: 50 });

    const callPromise = client.call('auth.openai.awaitCompletion' as never, undefined as never, {
      timeoutMs: 5_000,
    });

    await new Promise((r) => setTimeout(r, 200));

    resolveServerSide({ ok: true, plan: 'paid' });
    await expect(callPromise).resolves.toEqual({ ok: true, plan: 'paid' });

    client.close();
  });
});
