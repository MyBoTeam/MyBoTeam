import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAgentTracker } from '../../packages/agent-core/src/daemon/agent-tracker.js';

describe('Agent Tracker', () => {
  let testDir: string;
  let agentTracker: ReturnType<typeof createAgentTracker>;

  beforeEach(() => {
    testDir = join(tmpdir(), `test-agent-tracker-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    agentTracker = createAgentTracker(testDir);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('savePids', () => {
    it('should save PIDs to file', () => {
      const pids = [1234, 5678, 9012];
      agentTracker.savePids(pids);

      const pidFilePath = join(testDir, 'agent.pids');
      expect(existsSync(pidFilePath)).toBe(true);

      const content = readFileSync(pidFilePath, 'utf-8');
      const savedPids = JSON.parse(content);
      expect(savedPids).toEqual(pids);
    });

    it('should overwrite existing PIDs', () => {
      agentTracker.savePids([1111, 2222]);
      agentTracker.savePids([3333, 4444, 5555]);

      const pidFilePath = join(testDir, 'agent.pids');
      const content = readFileSync(pidFilePath, 'utf-8');
      const savedPids = JSON.parse(content);
      expect(savedPids).toEqual([3333, 4444, 5555]);
    });
  });

  describe('cleanupProcesses', () => {
    it('should return 0 when no PID file exists', () => {
      const cleaned = agentTracker.cleanupProcesses();
      expect(cleaned).toBe(0);
    });

    it('should return 0 when PID file is empty', () => {
      const pidFilePath = join(testDir, 'agent.pids');
      const fs = require('node:fs');
      fs.writeFileSync(pidFilePath, '[]');

      const cleaned = agentTracker.cleanupProcesses();
      expect(cleaned).toBe(0);
    });

    it('should skip dead processes without error', () => {
      const pidFilePath = join(testDir, 'agent.pids');
      const fs = require('node:fs');
      fs.writeFileSync(pidFilePath, JSON.stringify([999999999]));

      const cleaned = agentTracker.cleanupProcesses();
      expect(cleaned).toBe(0);
    });
  });

  describe('Performance (SC-004)', () => {
    it('should send SIGTERM to agent processes within 5s', async () => {
      const { spawn } = await import('node:child_process');
      const child = spawn('sleep', ['60'], { stdio: 'ignore' });
      const agentPid = child.pid!;

      agentTracker.savePids([agentPid]);

      const start = performance.now();
      const cleaned = agentTracker.cleanupProcesses();
      const elapsed = performance.now() - start;

      expect(cleaned).toBe(1);
      expect(elapsed).toBeLessThan(5000);

      await new Promise<void>((resolve) => {
        child.on('exit', () => resolve());
        setTimeout(() => {
          child.kill('SIGKILL');
          resolve();
        }, 2000);
      });
    });
  });
});
