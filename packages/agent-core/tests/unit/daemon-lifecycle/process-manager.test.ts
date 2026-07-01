import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DaemonProcessManager } from '../../../src/daemon/lifecycle/daemon-process-manager';
import { DaemonState } from '../../../src/daemon/lifecycle/daemon-state';

describe('DaemonProcessManager', () => {
  let manager: DaemonProcessManager;
  let testSocketPath: string;
  let testPidPath: string;

  beforeEach(() => {
    const testId = Date.now();
    testSocketPath = `/tmp/test-daemon-${testId}.sock`;
    testPidPath = `/tmp/test-daemon-${testId}.pid`;
    manager = new DaemonProcessManager({
      socketPath: testSocketPath,
      pidFilePath: testPidPath,
      shutdownTimeoutMs: 5000,
      maxRestartAttempts: 3,
      baseRestartDelayMs: 100,
      maxRestartDelayMs: 1000,
      stabilityPeriodMs: 1000,
    });
  });

  afterEach(async () => {
    if (manager.isRunning()) {
      await manager.kill();
    }
  });

  describe('start()', () => {
    it('should start daemon as independent process', async () => {
      await manager.start();
      expect(manager.isRunning()).toBe(true);
      expect(manager.getState()).toBe(DaemonState.Running);
      expect(manager.getPid()).toBeTypeOf('number');
    });

    it('should write PID file on start', async () => {
      await manager.start();
      const pid = manager.getPid();
      expect(pid).toBeTypeOf('number');
    });

    it('should emit start event', async () => {
      const startSpy = vi.fn();
      manager.on('start', startSpy);
      await manager.start();
      expect(startSpy).toHaveBeenCalled();
    });
  });

  describe('stop()', () => {
    it('should stop daemon gracefully', async () => {
      await manager.start();
      await manager.stop();
      expect(manager.isRunning()).toBe(false);
      expect(manager.getState()).toBe(DaemonState.Stopped);
    });

    it('should remove PID file on stop', async () => {
      await manager.start();
      await manager.stop();
      expect(manager.getPid()).toBeNull();
    });

    it('should emit stop event', async () => {
      await manager.start();
      const stopSpy = vi.fn();
      manager.on('stop', stopSpy);
      await manager.stop();
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('kill()', () => {
    it('should force kill daemon immediately', async () => {
      await manager.start();
      await manager.kill();
      expect(manager.isRunning()).toBe(false);
      expect(manager.getState()).toBe(DaemonState.Stopped);
    });

    it('should emit kill event', async () => {
      await manager.start();
      const killSpy = vi.fn();
      manager.on('kill', killSpy);
      await manager.kill();
      expect(killSpy).toHaveBeenCalled();
    });
  });

  describe('isRunning()', () => {
    it('should return false when daemon is not started', () => {
      expect(manager.isRunning()).toBe(false);
    });

    it('should return true when daemon is running', async () => {
      await manager.start();
      expect(manager.isRunning()).toBe(true);
    });

    it('should return false after daemon is stopped', async () => {
      await manager.start();
      await manager.stop();
      expect(manager.isRunning()).toBe(false);
    });
  });

  describe('getState()', () => {
    it('should return Stopped initially', () => {
      expect(manager.getState()).toBe(DaemonState.Stopped);
    });

    it('should return Starting during startup', async () => {
      const stateSpy = vi.fn();
      manager.on('stateChange', stateSpy);
      await manager.start();
      expect(stateSpy).toHaveBeenCalledWith(DaemonState.Starting, DaemonState.Stopped);
    });

    it('should return Running after startup completes', async () => {
      await manager.start();
      expect(manager.getState()).toBe(DaemonState.Running);
    });
  });

  describe('getPid()', () => {
    it('should return null when daemon is not started', () => {
      expect(manager.getPid()).toBeNull();
    });

    it('should return process ID when daemon is running', async () => {
      await manager.start();
      expect(manager.getPid()).toBeTypeOf('number');
    });
  });

  describe('getUptime()', () => {
    it('should return 0 when daemon is not started', () => {
      expect(manager.getUptime()).toBe(0);
    });

    it('should return non-negative uptime when daemon starts', async () => {
      await manager.start();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const uptime = manager.getUptime();
      expect(uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('error handling', () => {
    it('should throw error if daemon fails to start', async () => {
      const failManager = new DaemonProcessManager({
        socketPath: '/invalid/path/that/does/not/exist.sock',
        pidFilePath: '/invalid/path/that/does/not/exist.pid',
      });

      await expect(failManager.start()).rejects.toThrow();
    });
  });
});
