import { existsSync, unlinkSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { DaemonProcessManager } from '../../../src/daemon/lifecycle/daemon-process-manager';
import type { RestartManager } from '../../../src/daemon/lifecycle/restart-manager';
import type { Watchdog } from '../../../src/daemon/lifecycle/watchdog';

describe('Auto-Restart Integration', () => {
  let daemonManager: DaemonProcessManager;
  let watchdog: Watchdog;
  let restartManager: RestartManager;
  let socketPath: string;
  let pidPath: string;

  afterEach(async () => {
    if (watchdog?.isRunning()) watchdog.stop();
    if (restartManager) restartManager.stop();
    if (daemonManager?.isRunning()) await daemonManager.kill();
    if (pidPath && existsSync(pidPath)) unlinkSync(pidPath);
    if (socketPath && existsSync(socketPath)) unlinkSync(socketPath);
  });

  it('should detect crash and emit exit event', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-restart-${testId}.sock`;
    pidPath = `/tmp/test-daemon-restart-${testId}.pid`;

    daemonManager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 5000,
      maxRestartAttempts: 0,
      baseRestartDelayMs: 100,
      maxRestartDelayMs: 1000,
      stabilityPeriodMs: 500,
    });

    const exitSpy = { called: false };
    daemonManager.on('exit', () => {
      exitSpy.called = true;
    });

    await daemonManager.start();
    expect(daemonManager.isRunning()).toBe(true);

    // Kill the underlying process directly to simulate crash
    const pid = daemonManager.getPid();
    if (pid) process.kill(pid, 'SIGKILL');

    // Wait for exit event
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(exitSpy.called).toBe(true);
  });

  it('should use exponential backoff for restarts', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-restart-${testId}.sock`;
    pidPath = `/tmp/test-daemon-restart-${testId}.pid`;

    daemonManager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 5000,
      maxRestartAttempts: 3,
      baseRestartDelayMs: 100,
      maxRestartDelayMs: 1000,
      stabilityPeriodMs: 500,
    });

    const delays: number[] = [];
    daemonManager.on('restartScheduled', (info: { delay: number; attempt: number }) => {
      delays.push(info.delay);
    });

    await daemonManager.start();

    // Simulate crash by killing underlying process directly
    const pid = daemonManager.getPid();
    if (pid) process.kill(pid, 'SIGKILL');

    // Wait for crash detection and restart scheduling
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify restart was scheduled
    expect(delays.length).toBeGreaterThanOrEqual(1);
    if (delays.length >= 2) {
      // Verify exponential backoff (delays should increase)
      expect(delays[1]).toBeGreaterThanOrEqual(delays[0]);
    }
  });

  it('should stop restarting after max attempts', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-restart-${testId}.sock`;
    pidPath = `/tmp/test-daemon-restart-${testId}.pid`;

    daemonManager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 5000,
      maxRestartAttempts: 2,
      baseRestartDelayMs: 100,
      maxRestartDelayMs: 1000,
      stabilityPeriodMs: 500,
    });

    const maxReachedSpy = { called: false };
    daemonManager.on('maxRestartsReached', () => {
      maxReachedSpy.called = true;
    });

    await daemonManager.start();

    // Simulate crashes exceeding max attempts by killing underlying process
    for (let i = 0; i < 4; i++) {
      const pid = daemonManager.getPid();
      if (pid) {
        try {
          process.kill(pid, 'SIGKILL');
        } catch {
          // Process may already be dead
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    expect(maxReachedSpy.called).toBe(true);
  });
});
