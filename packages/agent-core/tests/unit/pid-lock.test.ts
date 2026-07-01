import { existsSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanupAgentProcesses, saveAgentPids } from '../../src/daemon/agent-pids.js';
import {
  acquirePidLock,
  PidLockError,
  type PidLockPayload,
} from '../../src/daemon/pid-lock.js';
import { getPidFilePath } from '../../src/daemon/socket-path.js';

function makeTmpDir(): string {
  const dir = join(tmpdir(), `pid-lock-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe('PidLockError', () => {
  it('has name "PidLockError"', () => {
    const err = new PidLockError('test');
    expect(err.name).toBe('PidLockError');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PidLockError);
  });

  it('stores existingPid when provided', () => {
    const err = new PidLockError('conflict', 12345);
    expect(err.existingPid).toBe(12345);
    expect(err.message).toBe('conflict');
  });

  it('has undefined existingPid when not provided', () => {
    const err = new PidLockError('no conflict');
    expect(err.existingPid).toBeUndefined();
  });
});

describe('PidLockPayload type', () => {
  it('can be created with required fields', () => {
    const payload: PidLockPayload = {
      pid: 12345,
      createdAt: '2026-06-26T12:00:00.000Z',
      startTime: Date.now(),
    };
    expect(payload.pid).toBe(12345);
    expect(payload.createdAt).toBe('2026-06-26T12:00:00.000Z');
    expect(typeof payload.startTime).toBe('number');
  });
});

describe('getPidFilePath', () => {
  it('returns daemon.pid inside the given dataDir', () => {
    const result = getPidFilePath('/tmp/my-data');
    expect(result).toBe(join('/tmp/my-data', 'daemon.pid'));
  });
});

describe('acquirePidLock', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    try {
      const pidPath = getPidFilePath(tmpDir);
      if (existsSync(pidPath)) {
        unlinkSync(pidPath);
      }
    } catch {}
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it('creates a PID file with valid JSON payload', () => {
    const handle = acquirePidLock(tmpDir);
    const pidPath = getPidFilePath(tmpDir);
    expect(existsSync(pidPath)).toBe(true);

    const raw = readFileSync(pidPath, 'utf-8');
    const payload = JSON.parse(raw) as PidLockPayload;
    expect(payload.pid).toBe(process.pid);
    expect(typeof payload.createdAt).toBe('string');
    expect(typeof payload.startTime).toBe('number');

    handle.release();
  });

  it('returns a handle with isAcquired=true', () => {
    const handle = acquirePidLock(tmpDir);
    expect(handle.isAcquired).toBe(true);
    expect(handle.pidPath).toBe(getPidFilePath(tmpDir));
    handle.release();
  });

  it('throws PidLockError when another instance is running', () => {
    const pidPath = getPidFilePath(tmpDir);
    const fakePayload: PidLockPayload = {
      pid: process.pid,
      createdAt: new Date().toISOString(),
      startTime: Date.now(),
    };
    writeFileSync(pidPath, JSON.stringify(fakePayload));

    expect(() => acquirePidLock(tmpDir)).toThrow(PidLockError);
    try {
      acquirePidLock(tmpDir);
    } catch (err) {
      expect(err).toBeInstanceOf(PidLockError);
      expect((err as PidLockError).existingPid).toBe(process.pid);
    }
  });

  it('removes stale lock and acquires when recorded PID is dead', () => {
    const pidPath = getPidFilePath(tmpDir);
    const deadPid = 99999999;
    const stalePayload: PidLockPayload = {
      pid: deadPid,
      createdAt: new Date().toISOString(),
      startTime: Date.now(),
    };
    writeFileSync(pidPath, JSON.stringify(stalePayload));

    const handle = acquirePidLock(tmpDir);
    expect(handle.isAcquired).toBe(true);

    const raw = readFileSync(pidPath, 'utf-8');
    const payload = JSON.parse(raw) as PidLockPayload;
    expect(payload.pid).toBe(process.pid);

    handle.release();
  });

  it('handles corrupted PID file by treating as stale', () => {
    const pidPath = getPidFilePath(tmpDir);
    writeFileSync(pidPath, 'not valid json');

    const handle = acquirePidLock(tmpDir);
    expect(handle.isAcquired).toBe(true);
    handle.release();
  });

  it('handles empty PID file by treating as stale', () => {
    const pidPath = getPidFilePath(tmpDir);
    writeFileSync(pidPath, '');

    const handle = acquirePidLock(tmpDir);
    expect(handle.isAcquired).toBe(true);
    handle.release();
  });

  it('handles PID file with missing required fields as stale', () => {
    const pidPath = getPidFilePath(tmpDir);
    writeFileSync(pidPath, JSON.stringify({ foo: 'bar' }));

    const handle = acquirePidLock(tmpDir);
    expect(handle.isAcquired).toBe(true);
    handle.release();
  });
});

describe('release()', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it('removes the PID file', () => {
    const handle = acquirePidLock(tmpDir);
    const pidPath = getPidFilePath(tmpDir);
    expect(existsSync(pidPath)).toBe(true);

    handle.release();
    expect(existsSync(pidPath)).toBe(false);
  });

  it('is idempotent — calling release() twice does not throw', () => {
    const handle = acquirePidLock(tmpDir);
    handle.release();
    expect(() => handle.release()).not.toThrow();
  });

  it('sets isAcquired to false after release', () => {
    const handle = acquirePidLock(tmpDir);
    expect(handle.isAcquired).toBe(true);
    handle.release();
    expect(handle.isAcquired).toBe(false);
  });
});

describe('saveAgentPids()', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it('persists agent PIDs to agent.pids file', () => {
    saveAgentPids(tmpDir, [100, 200, 300]);
    const pidFilePath = join(tmpDir, 'agent.pids');
    expect(existsSync(pidFilePath)).toBe(true);

    const raw = readFileSync(pidFilePath, 'utf-8');
    const pids = JSON.parse(raw) as number[];
    expect(pids).toEqual([100, 200, 300]);
  });
});

describe('cleanupAgentProcesses()', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it('returns 0 when no agent.pids file exists', () => {
    const cleaned = cleanupAgentProcesses(tmpDir);
    expect(cleaned).toBe(0);
  });

  it('skips dead PIDs without error', () => {
    saveAgentPids(tmpDir, [99999999]);
    const cleaned = cleanupAgentProcesses(tmpDir);
    expect(cleaned).toBe(0);
  });

  it('removes agent.pids file after cleanup', () => {
    saveAgentPids(tmpDir, [99999999]);
    cleanupAgentProcesses(tmpDir);
    expect(existsSync(join(tmpDir, 'agent.pids'))).toBe(false);
  });

  it('sends SIGTERM to live agent processes', async () => {
    const { spawn } = await import('node:child_process');
    const child = spawn('sleep', ['60'], { stdio: 'ignore' });
    const agentPid = child.pid as NonNullable<typeof child.pid>;

    saveAgentPids(tmpDir, [agentPid]);
    const cleaned = cleanupAgentProcesses(tmpDir);
    expect(cleaned).toBe(1);

    await new Promise<void>((resolve) => {
      child.on('exit', () => resolve());
      setTimeout(() => {
        child.kill('SIGKILL');
        resolve();
      }, 2000);
    });
  });
});
