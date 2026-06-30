import { existsSync, unlinkSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { DaemonProcessManager } from '../../../src/daemon/lifecycle/daemon-process-manager';
import { Watchdog } from '../../../src/daemon/lifecycle/watchdog';

describe('Crash Recovery Integration', () => {
  let daemonManager: DaemonProcessManager;
  let watchdog: Watchdog;
  let socketPath: string;
  let pidPath: string;

  afterEach(async () => {
    if (watchdog?.isRunning()) watchdog.stop();
    if (daemonManager?.isRunning()) await daemonManager.kill();
    if (pidPath && existsSync(pidPath)) unlinkSync(pidPath);
    if (socketPath && existsSync(socketPath)) unlinkSync(socketPath);
  });

  it('should detect crash via watchdog', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-crash-${testId}.sock`;
    pidPath = `/tmp/test-daemon-crash-${testId}.pid`;

    daemonManager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 5000,
      maxRestartAttempts: 3,
      baseRestartDelayMs: 100,
      maxRestartDelayMs: 1000,
      stabilityPeriodMs: 500,
    });

    const crashSpy = { called: false };
    watchdog = new Watchdog(daemonManager, {
      healthCheckIntervalMs: 100,
      maxConsecutiveFailures: 1,
    });
    watchdog.on('crash', () => {
      crashSpy.called = true;
    });

    await daemonManager.start();
    expect(daemonManager.isRunning()).toBe(true);

    watchdog.start();

    // Kill the underlying process directly to simulate crash
    const pid = daemonManager.getPid();
    if (pid) process.kill(pid, 'SIGKILL');

    // Wait for exit event to fire and watchdog to detect crash
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(crashSpy.called).toBe(true);
  });

  it('should track restart attempts on crash', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-crash-${testId}.sock`;
    pidPath = `/tmp/test-daemon-crash-${testId}.pid`;

    daemonManager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 5000,
      maxRestartAttempts: 3,
      baseRestartDelayMs: 100,
      maxRestartDelayMs: 1000,
      stabilityPeriodMs: 500,
    });

    const restartEvents: number[] = [];
    daemonManager.on('restartScheduled', (info: { attempt: number }) => {
      restartEvents.push(info.attempt);
    });

    await daemonManager.start();

    // Simulate crash by killing the underlying process directly
    const pid = daemonManager.getPid();
    if (pid) process.kill(pid, 'SIGKILL');

    // Wait for crash to be detected and restart to be scheduled
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(restartEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('should emit exit event on crash', async () => {
    const testId = Date.now();
    socketPath = `/tmp/test-daemon-crash-${testId}.sock`;
    pidPath = `/tmp/test-daemon-crash-${testId}.pid`;

    daemonManager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 5000,
      maxRestartAttempts: 0,
      baseRestartDelayMs: 100,
      maxRestartDelayMs: 1000,
      stabilityPeriodMs: 500,
    });

    const exitSpy = { called: false, code: 0 };
    daemonManager.on('exit', (info: { code: number }) => {
      exitSpy.called = true;
      exitSpy.code = info.code;
    });

    await daemonManager.start();

    // Kill the underlying process directly
    const pid = daemonManager.getPid();
    if (pid) process.kill(pid, 'SIGKILL');

    // Wait for exit event
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(exitSpy.called).toBe(true);
  });
});
