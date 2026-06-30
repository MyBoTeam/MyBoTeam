import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { acquirePidLock, detectStaleLock, removeStaleLock } from '../../src/daemon/pid-lock.js';

describe('Crash Detection', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `test-crash-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('detectStaleLock', () => {
    it('should return false when no lock file exists', () => {
      const result = detectStaleLock(testDir);
      expect(result).toBe(false);
    });

    it('should return true when lock file exists with dead process', () => {
      // Create a lock file with a non-existent PID
      const lockPath = join(testDir, 'daemon.pid');
      writeFileSync(
        lockPath,
        JSON.stringify({ pid: 999999999, createdAt: new Date().toISOString() }),
      );

      const result = detectStaleLock(testDir);
      expect(result).toBe(true);
    });

    it('should return false when lock file exists with current process', () => {
      // Create a lock file with current PID
      const lockPath = join(testDir, 'daemon.pid');
      writeFileSync(
        lockPath,
        JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }),
      );

      const result = detectStaleLock(testDir);
      expect(result).toBe(false);
    });

    it('should return true when lock file is empty', () => {
      const lockPath = join(testDir, 'daemon.pid');
      writeFileSync(lockPath, '');

      const result = detectStaleLock(testDir);
      expect(result).toBe(true);
    });

    it('should return true when lock file is corrupted', () => {
      const lockPath = join(testDir, 'daemon.pid');
      writeFileSync(lockPath, 'not valid json');

      const result = detectStaleLock(testDir);
      expect(result).toBe(true);
    });
  });

  describe('removeStaleLock', () => {
    it('should remove lock file if it exists', () => {
      const lockPath = join(testDir, 'daemon.pid');
      writeFileSync(
        lockPath,
        JSON.stringify({ pid: 999999999, createdAt: new Date().toISOString() }),
      );

      removeStaleLock(testDir);

      expect(existsSync(lockPath)).toBe(false);
    });

    it('should not throw if lock file does not exist', () => {
      expect(() => removeStaleLock(testDir)).not.toThrow();
    });
  });

  describe('acquirePidLock', () => {
    it('should acquire lock when no stale lock exists', () => {
      const handle = acquirePidLock(testDir);

      expect(handle.isAcquired).toBe(true);
      expect(existsSync(handle.pidPath)).toBe(true);

      handle.release();
    });

    it('should acquire lock after removing stale lock', () => {
      // Create a stale lock
      const lockPath = join(testDir, 'daemon.pid');
      writeFileSync(
        lockPath,
        JSON.stringify({ pid: 999999999, createdAt: new Date().toISOString() }),
      );

      const handle = acquirePidLock(testDir);

      expect(handle.isAcquired).toBe(true);
      expect(existsSync(handle.pidPath)).toBe(true);

      handle.release();
    });

    it('should release lock when release() is called', () => {
      const handle = acquirePidLock(testDir);
      handle.release();

      expect(handle.isAcquired).toBe(false);
      expect(existsSync(handle.pidPath)).toBe(false);
    });
  });

  describe('Performance (SC-001)', () => {
    it('should detect and recover from stale lock within 100ms', () => {
      const lockPath = join(testDir, 'daemon.pid');
      writeFileSync(
        lockPath,
        JSON.stringify({ pid: 999999999, createdAt: new Date().toISOString() }),
      );

      const start = performance.now();
      const isStale = detectStaleLock(testDir);
      removeStaleLock(testDir);
      const handle = acquirePidLock(testDir);
      const elapsed = performance.now() - start;

      expect(isStale).toBe(true);
      expect(handle.isAcquired).toBe(true);
      expect(elapsed).toBeLessThan(100);

      handle.release();
    });
  });
});
