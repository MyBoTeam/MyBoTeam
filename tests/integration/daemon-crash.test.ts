import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  acquirePidLock,
  detectStaleLock,
  removeStaleLock,
} from '../../packages/agent-core/src/daemon/pid-lock.js';

describe('Daemon Crash Recovery Integration', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `test-daemon-crash-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should detect and recover from daemon crash', () => {
    // Simulate daemon crash: create lock file with dead process
    const lockPath = join(testDir, 'daemon.pid');
    const deadPid = 999999999;
    writeFileSync(
      lockPath,
      JSON.stringify({
        pid: deadPid,
        createdAt: new Date().toISOString(),
        startTime: Date.now(),
      }),
    );

    // Verify stale lock is detected
    expect(detectStaleLock(testDir)).toBe(true);

    // Remove stale lock
    removeStaleLock(testDir);

    // Verify lock is removed
    expect(existsSync(lockPath)).toBe(false);

    // New daemon can acquire lock
    const handle = acquirePidLock(testDir);
    expect(handle.isAcquired).toBe(true);

    // Verify new lock file has current PID
    const lockContent = readFileSync(lockPath, 'utf-8');
    const lockData = JSON.parse(lockContent);
    expect(lockData.pid).toBe(process.pid);

    handle.release();
  });

  it('should handle multiple crash recovery cycles', () => {
    const lockPath = join(testDir, 'daemon.pid');

    // First crash recovery cycle
    writeFileSync(
      lockPath,
      JSON.stringify({ pid: 999999998, createdAt: new Date().toISOString() }),
    );
    expect(detectStaleLock(testDir)).toBe(true);
    removeStaleLock(testDir);

    const handle1 = acquirePidLock(testDir);
    expect(handle1.isAcquired).toBe(true);
    handle1.release();

    // Second crash recovery cycle
    writeFileSync(
      lockPath,
      JSON.stringify({ pid: 999999997, createdAt: new Date().toISOString() }),
    );
    expect(detectStaleLock(testDir)).toBe(true);
    removeStaleLock(testDir);

    const handle2 = acquirePidLock(testDir);
    expect(handle2.isAcquired).toBe(true);
    handle2.release();
  });

  it('should not interfere with running daemon', () => {
    // Acquire lock as running daemon
    const handle = acquirePidLock(testDir);
    expect(handle.isAcquired).toBe(true);

    // Verify lock is not stale
    expect(detectStaleLock(testDir)).toBe(false);

    // Cannot acquire another lock
    expect(() => acquirePidLock(testDir)).toThrow();

    handle.release();
  });
});
