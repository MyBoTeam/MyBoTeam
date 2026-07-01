import { existsSync, unlinkSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DaemonProcessManager } from '../../../src/daemon/lifecycle/daemon-process-manager';
import { ShutdownManager } from '../../../src/daemon/lifecycle/shutdown-manager';

describe('Forced Shutdown on Timeout Integration', () => {
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

  it('should force kill when shutdown timeout is reached', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-forced-${testId}.sock`;
    pidPath = `/tmp/test-daemon-forced-${testId}.pid`;

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
    expect(daemonManager.isRunning()).toBe(true);

    await shutdownManager.initiateShutdown();

    expect(daemonManager.isRunning()).toBe(false);
    const stats = shutdownManager.getStats();
    expect(stats.wasForced).toBe(true);
  });

  it('should log timeout warning', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-forced-${testId}.sock`;
    pidPath = `/tmp/test-daemon-forced-${testId}.pid`;

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

    const forceSpy = vi.fn();
    shutdownManager.on('force', forceSpy);

    await shutdownManager.initiateShutdown();

    expect(daemonManager.isRunning()).toBe(false);
    expect(forceSpy).toHaveBeenCalled();
  });
});
