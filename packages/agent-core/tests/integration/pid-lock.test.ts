import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { acquirePidLock } from '../../src/daemon/pid-lock.js';
import { getPidFilePath } from '../../src/daemon/socket-path.js';

function makeTmpDir(): string {
  const dir = join(tmpdir(), `pid-lock-integration-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe('PID Lock Integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it('only one caller succeeds when two try to acquire the same lock', () => {
    const results = [false, false];
    const errors = [null, null];

    for (let i = 0; i < 2; i++) {
      try {
        acquirePidLock(tmpDir);
        results[i] = true;
      } catch (err) {
        errors[i] = err;
      }
    }

    const successCount = results.filter(Boolean).length;
    expect(successCount).toBe(1);
    expect(errors[0] === null || errors[1] === null).toBe(true);
    expect(errors[0] !== null || errors[1] !== null).toBe(true);
  });

  it('acquire and release completes within 50ms under normal conditions', () => {
    const start = Date.now();
    const handle = acquirePidLock(tmpDir);
    handle.release();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it('stale lock detection completes within 50ms', () => {
    const pidPath = getPidFilePath(tmpDir);
    writeFileSync(pidPath, JSON.stringify({ pid: 99999999, createdAt: new Date().toISOString(), startTime: Date.now() }));

    const start = Date.now();
    const handle = acquirePidLock(tmpDir);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
    handle.release();
  });

  it('fail-fast when lock conflict detected (under 100ms)', () => {
    const pidPath = getPidFilePath(tmpDir);
    writeFileSync(pidPath, JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString(), startTime: Date.now() }));

    const start = Date.now();
    expect(() => acquirePidLock(tmpDir)).toThrow();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
