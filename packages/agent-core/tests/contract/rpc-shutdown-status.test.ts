import { describe, expect, it } from 'vitest';
import { createShutdownManager } from '../../src/daemon/shutdown-manager.js';

describe('daemon.getShutdownStatus RPC Contract', () => {
  it('should return initial shutdown status', () => {
    const shutdownManager = createShutdownManager();

    // Simulate RPC handler logic
    const handler = () => {
      const state = shutdownManager.getState();
      return {
        isShuttingDown: state.isShuttingDown,
        shutdownStartTime: state.shutdownStartTime?.toISOString() || null,
        drainTimeoutMs: state.drainTimeoutMs,
      };
    };

    const result = handler();
    expect(result.isShuttingDown).toBe(false);
    expect(result.shutdownStartTime).toBeNull();
    expect(result.drainTimeoutMs).toBe(30000);
  });

  it('should return shutdown status after initiation', () => {
    const shutdownManager = createShutdownManager();
    shutdownManager.initiateShutdown();

    const handler = () => {
      const state = shutdownManager.getState();
      return {
        isShuttingDown: state.isShuttingDown,
        shutdownStartTime: state.shutdownStartTime?.toISOString() || null,
        drainTimeoutMs: state.drainTimeoutMs,
      };
    };

    const result = handler();
    expect(result.isShuttingDown).toBe(true);
    expect(result.shutdownStartTime).toBeDefined();
    expect(result.drainTimeoutMs).toBe(30000);
  });

  it('should return custom drain timeout', () => {
    const shutdownManager = createShutdownManager(60000);

    const handler = () => {
      const state = shutdownManager.getState();
      return {
        isShuttingDown: state.isShuttingDown,
        shutdownStartTime: state.shutdownStartTime?.toISOString() || null,
        drainTimeoutMs: state.drainTimeoutMs,
      };
    };

    const result = handler();
    expect(result.drainTimeoutMs).toBe(60000);
  });
});
