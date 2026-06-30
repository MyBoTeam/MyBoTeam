import { describe, expect, it } from 'vitest';
import { createShutdownManager } from '../../packages/agent-core/src/daemon/shutdown-manager.js';

describe('Graceful Shutdown Integration', () => {
  it('should handle shutdown sequence correctly', () => {
    const shutdownManager = createShutdownManager(1000); // 1 second timeout for testing

    // Verify initial state
    const initialState = shutdownManager.getState();
    expect(initialState.isShuttingDown).toBe(false);
    expect(initialState.shutdownStartTime).toBeNull();

    // Initiate shutdown
    const initiated = shutdownManager.initiateShutdown();
    expect(initiated).toBe(true);

    // Verify shutdown state
    const shutdownState = shutdownManager.getState();
    expect(shutdownState.isShuttingDown).toBe(true);
    expect(shutdownState.shutdownStartTime).toBeInstanceOf(Date);

    // Verify idempotent behavior
    const secondAttempt = shutdownManager.initiateShutdown();
    expect(secondAttempt).toBe(false);
  });

  it('should use configurable drain timeout', () => {
    const timeout = 5000;
    const shutdownManager = createShutdownManager(timeout);

    expect(shutdownManager.getDrainTimeout()).toBe(timeout);
  });
});
