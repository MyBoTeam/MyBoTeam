import { describe, expect, it } from 'vitest';
import { createShutdownManager } from '../../packages/agent-core/src/daemon/shutdown-manager.js';

describe('daemon.shutdown RPC Contract', () => {
  it('should accept shutdown request with default timeout', () => {
    const shutdownManager = createShutdownManager();

    // Simulate RPC handler logic
    const handler = (params: { timeoutMs?: number }) => {
      const { isShuttingDown } = shutdownManager.getState();
      if (isShuttingDown) {
        return { success: true, message: 'Shutdown already in progress' };
      }

      const initiated = shutdownManager.initiateShutdown();
      if (!initiated) {
        return { success: true, message: 'Shutdown already in progress' };
      }

      const drainTimeout = params?.timeoutMs || shutdownManager.getDrainTimeout();
      return { success: true, drainTimeout };
    };

    const result = handler({});
    expect(result.success).toBe(true);
    expect(result.drainTimeout).toBe(30000);
  });

  it('should accept shutdown request with custom timeout', () => {
    const shutdownManager = createShutdownManager();

    const handler = (params: { timeoutMs?: number }) => {
      const { isShuttingDown } = shutdownManager.getState();
      if (isShuttingDown) {
        return { success: true, message: 'Shutdown already in progress' };
      }

      const initiated = shutdownManager.initiateShutdown();
      if (!initiated) {
        return { success: true, message: 'Shutdown already in progress' };
      }

      const drainTimeout = params?.timeoutMs || shutdownManager.getDrainTimeout();
      return { success: true, drainTimeout };
    };

    const result = handler({ timeoutMs: 60000 });
    expect(result.success).toBe(true);
    expect(result.drainTimeout).toBe(60000);
  });

  it('should return success when shutdown already in progress', () => {
    const shutdownManager = createShutdownManager();
    shutdownManager.initiateShutdown();

    const handler = (params: { timeoutMs?: number }) => {
      const { isShuttingDown } = shutdownManager.getState();
      if (isShuttingDown) {
        return { success: true, message: 'Shutdown already in progress' };
      }

      const initiated = shutdownManager.initiateShutdown();
      if (!initiated) {
        return { success: true, message: 'Shutdown already in progress' };
      }

      const drainTimeout = params?.timeoutMs || shutdownManager.getDrainTimeout();
      return { success: true, drainTimeout };
    };

    const result = handler({});
    expect(result.success).toBe(true);
    expect(result.message).toBe('Shutdown already in progress');
  });
});
