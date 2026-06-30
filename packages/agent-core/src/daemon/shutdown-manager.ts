import { createChildLogger } from './logger.js';

const log = createChildLogger('shutdown-manager');

export interface ShutdownState {
  isShuttingDown: boolean;
  shutdownStartTime: Date | null;
  drainTimeoutMs: number;
}

export interface ShutdownManager {
  getState: () => ShutdownState;
  initiateShutdown: () => boolean;
  getDrainTimeout: () => number;
}

export function createShutdownManager(
  drainTimeoutMs: number = parseInt(process.env.MYBOTEAM_DRAIN_TIMEOUT_MS || '30000', 10),
): ShutdownManager {
  const state: ShutdownState = {
    isShuttingDown: false,
    shutdownStartTime: null,
    drainTimeoutMs,
  };

  return {
    getState: () => ({
      ...state,
      shutdownStartTime: state.shutdownStartTime
        ? new Date(state.shutdownStartTime.getTime())
        : null,
    }),

    initiateShutdown: () => {
      if (state.isShuttingDown) {
        log.warn('Shutdown already in progress, ignoring subsequent request');
        return false;
      }

      state.isShuttingDown = true;
      state.shutdownStartTime = new Date();
      log.info('Shutdown initiated');
      return true;
    },

    getDrainTimeout: () => state.drainTimeoutMs,
  };
}
