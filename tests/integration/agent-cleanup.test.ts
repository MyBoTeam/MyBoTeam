import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createAgentTracker } from '../../packages/agent-core/src/daemon/agent-tracker.js';

describe('Agent Cleanup Integration', () => {
  let testDir: string;
  let agentTracker: ReturnType<typeof createAgentTracker>;

  beforeEach(() => {
    testDir = join(tmpdir(), `test-agent-cleanup-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    agentTracker = createAgentTracker(testDir);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should cleanup agent processes on shutdown', () => {
    // Save some agent PIDs (using dead PIDs for testing)
    const deadPids = [999999998, 999999997, 999999996];
    agentTracker.savePids(deadPids);

    // Verify PIDs file exists
    const pidFilePath = join(testDir, 'agent.pids');
    expect(existsSync(pidFilePath)).toBe(true);

    // Cleanup processes
    const cleaned = agentTracker.cleanupProcesses();

    // Verify cleanup completed (0 because PIDs are dead)
    expect(cleaned).toBe(0);

    // Verify PID file is removed
    expect(existsSync(pidFilePath)).toBe(false);
  });

  it('should handle missing PID file gracefully', () => {
    // No PID file created
    const cleaned = agentTracker.cleanupProcesses();
    expect(cleaned).toBe(0);
  });

  it('should handle multiple shutdown cycles', () => {
    // First cycle
    agentTracker.savePids([999999995, 999999994]);
    agentTracker.cleanupProcesses();

    // Second cycle
    agentTracker.savePids([999999993, 999999992, 999999991]);
    const cleaned = agentTracker.cleanupProcesses();
    expect(cleaned).toBe(0);
  });
});
