import { existsSync, unlinkSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { DaemonProcessManager } from '../../../src/daemon/lifecycle/daemon-process-manager';
import { DaemonState } from '../../../src/daemon/lifecycle/daemon-state';

describe('Normal Start/Stop Cycle Integration', () => {
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

  it('should complete normal start/stop cycle', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-normal-${testId}.sock`;
    pidPath = `/tmp/test-daemon-normal-${testId}.pid`;

    manager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 5000,
      maxRestartAttempts: 0,
    });

    await manager.start();
    expect(manager.getState()).toBe(DaemonState.Running);
    expect(manager.getPid()).toBeTypeOf('number');

    await new Promise((resolve) => setTimeout(resolve, 100));

    await manager.stop();
    expect(manager.isRunning()).toBe(false);
    expect(manager.getState()).toBe(DaemonState.Stopped);
    expect(manager.getPid()).toBeNull();
  });

  it('should handle multiple start/stop cycles', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-normal-${testId}.sock`;
    pidPath = `/tmp/test-daemon-normal-${testId}.pid`;

    manager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 5000,
      maxRestartAttempts: 0,
    });

    for (let i = 0; i < 3; i++) {
      await manager.start();
      expect(manager.getState()).toBe(DaemonState.Running);

      await new Promise((resolve) => setTimeout(resolve, 50));

      await manager.stop();
      expect(manager.getState()).toBe(DaemonState.Stopped);
    }
  });

  it('should maintain daemon state throughout cycle', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-normal-${testId}.sock`;
    pidPath = `/tmp/test-daemon-normal-${testId}.pid`;

    manager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 5000,
      maxRestartAttempts: 0,
    });

    const stateChanges: DaemonState[] = [];
    manager.on('stateChange', (state: DaemonState) => {
      stateChanges.push(state);
    });

    await manager.start();
    await manager.stop();

    expect(stateChanges).toContain(DaemonState.Starting);
    expect(stateChanges).toContain(DaemonState.Running);
    expect(stateChanges).toContain(DaemonState.Draining);
    expect(stateChanges).toContain(DaemonState.Stopped);
  });
});
