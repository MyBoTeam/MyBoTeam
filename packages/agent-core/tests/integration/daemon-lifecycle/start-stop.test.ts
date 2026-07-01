import { existsSync, unlinkSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { DaemonProcessManager } from '../../../src/daemon/lifecycle/daemon-process-manager';
import { DaemonState } from '../../../src/daemon/lifecycle/daemon-state';

describe('Daemon Start/Stop Integration', () => {
  let manager: DaemonProcessManager;
  let socketPath: string;
  let pidPath: string;

  afterEach(async () => {
    if (manager?.isRunning()) {
      await manager.kill();
    }
    if (pidPath && existsSync(pidPath)) unlinkSync(pidPath);
    if (socketPath && existsSync(socketPath)) unlinkSync(socketPath);
  });

  it('should start daemon as independent process', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-integration-${testId}.sock`;
    pidPath = `/tmp/test-daemon-integration-${testId}.pid`;

    manager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 5000,
    });

    await manager.start();

    expect(manager.getState()).toBe(DaemonState.Running);
    expect(manager.getPid()).toBeTypeOf('number');
  });

  it('should stop daemon gracefully', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-integration-${testId}.sock`;
    pidPath = `/tmp/test-daemon-integration-${testId}.pid`;

    manager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 5000,
    });

    await manager.start();
    await manager.stop();

    expect(manager.isRunning()).toBe(false);
    expect(manager.getState()).toBe(DaemonState.Stopped);
  });

  it('should emit exit event when daemon exits', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-integration-${testId}.sock`;
    pidPath = `/tmp/test-daemon-integration-${testId}.pid`;

    manager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 5000,
      maxRestartAttempts: 0,
    });

    const exitSpy = { called: false };
    manager.on('exit', () => {
      exitSpy.called = true;
    });

    await manager.start();

    // Wait for daemon to exit (it spawns `node --daemon` which fails)
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(exitSpy.called).toBe(true);
  });

  it('should handle multiple start/stop cycles', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-integration-${testId}.sock`;
    pidPath = `/tmp/test-daemon-integration-${testId}.pid`;

    manager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 5000,
      maxRestartAttempts: 0,
    });

    for (let i = 0; i < 3; i++) {
      await manager.start();
      expect(manager.getState()).toBe(DaemonState.Running);

      await manager.stop();
      expect(manager.getState()).toBe(DaemonState.Stopped);
    }
  });
});
