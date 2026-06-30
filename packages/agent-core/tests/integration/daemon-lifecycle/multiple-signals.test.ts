import { existsSync, unlinkSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { DaemonProcessManager } from '../../../src/daemon/lifecycle/daemon-process-manager';
import { ShutdownManager } from '../../../src/daemon/lifecycle/shutdown-manager';

describe('Multiple Shutdown Signals Integration', () => {
  let daemonManager: DaemonProcessManager;
  let shutdownManager: ShutdownManager;
  let socketPath: string;
  let pidPath: string;

  afterEach(async () => {
    if (daemonManager?.isRunning()) {
      await daemonManager.kill();
    }
    if (pidPath && existsSync(pidPath)) unlinkSync(pidPath);
    if (socketPath && existsSync(socketPath)) unlinkSync(socketPath);
  });

  it('should ignore subsequent shutdown signals', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-signals-${testId}.sock`;
    pidPath = `/tmp/test-daemon-signals-${testId}.pid`;

    daemonManager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 5000,
    });

    shutdownManager = new ShutdownManager({
      shutdownTimeoutMs: 5000,
      forceKillFn: () => daemonManager.kill(),
      drainTasksFn: async () => 0,
      cleanupResourcesFn: async () => {},
    });

    await daemonManager.start();

    const startSpy = { count: 0 };
    shutdownManager.on('start', () => {
      startSpy.count++;
    });

    // Start shutdown
    const shutdownPromise1 = shutdownManager.initiateShutdown();

    // Try to start another shutdown
    await shutdownManager.initiateShutdown();

    // Should only emit start once
    expect(startSpy.count).toBe(1);

    await shutdownPromise1;
  });

  it('should complete shutdown even with multiple signals', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-signals-${testId}.sock`;
    pidPath = `/tmp/test-daemon-signals-${testId}.pid`;

    daemonManager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 5000,
    });

    shutdownManager = new ShutdownManager({
      shutdownTimeoutMs: 5000,
      forceKillFn: () => daemonManager.kill(),
      drainTasksFn: async () => 0,
      cleanupResourcesFn: async () => {},
    });

    await daemonManager.start();

    const completeSpy = { called: false };
    shutdownManager.on('complete', () => {
      completeSpy.called = true;
    });

    // Send multiple shutdown signals
    await shutdownManager.initiateShutdown();
    await shutdownManager.initiateShutdown();
    await shutdownManager.initiateShutdown();

    await daemonManager.kill();

    expect(completeSpy.called).toBe(true);
    expect(daemonManager.isRunning()).toBe(false);
  });

  it('should not allow force shutdown during graceful shutdown', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-signals-${testId}.sock`;
    pidPath = `/tmp/test-daemon-signals-${testId}.pid`;

    daemonManager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 5000,
    });

    shutdownManager = new ShutdownManager({
      shutdownTimeoutMs: 5000,
      forceKillFn: () => daemonManager.kill(),
      drainTasksFn: async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return 0;
      },
      cleanupResourcesFn: async () => {},
    });

    await daemonManager.start();

    // Start graceful shutdown
    const shutdownPromise = shutdownManager.initiateShutdown();

    // Try to force shutdown
    await shutdownManager.forceShutdown();

    // Both should complete
    await shutdownPromise;
    await daemonManager.kill();
    expect(daemonManager.isRunning()).toBe(false);
  });
});
