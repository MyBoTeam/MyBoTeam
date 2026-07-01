import { existsSync, unlinkSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { DaemonProcessManager } from '../../../src/daemon/lifecycle/daemon-process-manager';
import { DaemonState } from '../../../src/daemon/lifecycle/daemon-state';
import { ShutdownManager } from '../../../src/daemon/lifecycle/shutdown-manager';

describe('Graceful Shutdown Integration', () => {
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

  it('should gracefully shutdown with active tasks', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-graceful-${testId}.sock`;
    pidPath = `/tmp/test-daemon-graceful-${testId}.pid`;

    daemonManager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 5000,
    });

    shutdownManager = new ShutdownManager({
      shutdownTimeoutMs: 5000,
      forceKillFn: () => daemonManager.kill(),
      drainTasksFn: async () => 2,
      cleanupResourcesFn: async () => {},
    });

    await daemonManager.start();
    expect(daemonManager.isRunning()).toBe(true);

    await shutdownManager.initiateShutdown();
    await daemonManager.stop();

    expect(daemonManager.isRunning()).toBe(false);
    expect(daemonManager.getState()).toBe(DaemonState.Stopped);
  });

  it('should complete shutdown within timeout', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-graceful-${testId}.sock`;
    pidPath = `/tmp/test-daemon-graceful-${testId}.pid`;

    daemonManager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 1000,
    });

    shutdownManager = new ShutdownManager({
      shutdownTimeoutMs: 1000,
      forceKillFn: () => daemonManager.kill(),
      drainTasksFn: async () => 0,
      cleanupResourcesFn: async () => {},
    });

    await daemonManager.start();

    const startTime = Date.now();
    await shutdownManager.initiateShutdown();
    await daemonManager.stop();
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(2000);
  });

  it('should force kill on timeout', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-graceful-${testId}.sock`;
    pidPath = `/tmp/test-daemon-graceful-${testId}.pid`;

    daemonManager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 100,
    });

    shutdownManager = new ShutdownManager({
      shutdownTimeoutMs: 100,
      forceKillFn: () => daemonManager.kill(),
      drainTasksFn: async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return 0;
      },
      cleanupResourcesFn: async () => {},
    });

    await daemonManager.start();
    await shutdownManager.initiateShutdown();

    expect(daemonManager.isRunning()).toBe(false);
    const stats = shutdownManager.getStats();
    expect(stats.wasForced).toBe(true);
  });
});
