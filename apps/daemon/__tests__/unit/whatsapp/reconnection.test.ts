import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/logger.js', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  clearReconnectTimer,
  createReconnectState,
  INITIAL_RECONNECT_DELAY_MS,
  MAX_RECONNECT_ATTEMPTS,
  scheduleReconnect,
} from '../../../src/whatsapp/reconnection.js';

describe('reconnection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createReconnectState', () => {
    it('should return initial state', () => {
      const state = createReconnectState();
      expect(state.attempts).toBe(0);
      expect(state.scheduled).toBe(false);
      expect(state.timer).toBeNull();
    });
  });

  describe('clearReconnectTimer', () => {
    it('should clear and nullify the timer when set', () => {
      const state = createReconnectState();
      state.timer = setTimeout(() => {}, 1000);
      expect(state.timer).not.toBeNull();

      clearReconnectTimer(state);
      expect(state.timer).toBeNull();
    });

    it('should do nothing when timer is null', () => {
      const state = createReconnectState();
      expect(() => clearReconnectTimer(state)).not.toThrow();
      expect(state.timer).toBeNull();
    });
  });

  describe('scheduleReconnect', () => {
    it('should NOT schedule when already scheduled', () => {
      const state = createReconnectState();
      state.scheduled = true;
      const onConnect = vi.fn(async () => {});
      const onMaxReached = vi.fn();

      scheduleReconnect(state, onConnect, onMaxReached);

      expect(onConnect).not.toHaveBeenCalled();
      expect(onMaxReached).not.toHaveBeenCalled();
      expect(state.attempts).toBe(0);
    });

    it('should call onMaxReached when max attempts exceeded', () => {
      const state = createReconnectState();
      state.attempts = MAX_RECONNECT_ATTEMPTS;
      const onConnect = vi.fn(async () => {});
      const onMaxReached = vi.fn();

      scheduleReconnect(state, onConnect, onMaxReached);

      expect(onMaxReached).toHaveBeenCalledOnce();
      expect(onConnect).not.toHaveBeenCalled();
      expect(state.attempts).toBe(MAX_RECONNECT_ATTEMPTS);
    });

    it('should schedule reconnect with exponential backoff on first attempt', () => {
      const state = createReconnectState();
      const onConnect = vi.fn(async () => {});
      const onMaxReached = vi.fn();

      scheduleReconnect(state, onConnect, onMaxReached);

      expect(state.attempts).toBe(1);
      expect(state.scheduled).toBe(true);
      expect(state.timer).not.toBeNull();
      expect(onMaxReached).not.toHaveBeenCalled();

      vi.advanceTimersByTime(INITIAL_RECONNECT_DELAY_MS - 1);
      expect(onConnect).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(onConnect).toHaveBeenCalledOnce();
      expect(state.scheduled).toBe(false);
    });

    it('should use exponential backoff for subsequent attempts', () => {
      const state = createReconnectState();
      state.attempts = 2;
      const onConnect = vi.fn(async () => {});
      const onMaxReached = vi.fn();

      scheduleReconnect(state, onConnect, onMaxReached);

      expect(state.attempts).toBe(3);

      vi.advanceTimersByTime(8000);
      expect(onConnect).toHaveBeenCalledOnce();
    });

    it('should log error when onConnect rejects', () => {
      const state = createReconnectState();
      const onConnect = vi.fn(async () => {
        throw new Error('Connection failed');
      });
      const onMaxReached = vi.fn();

      scheduleReconnect(state, onConnect, onMaxReached);

      vi.advanceTimersByTime(INITIAL_RECONNECT_DELAY_MS);

      expect(onConnect).toHaveBeenCalledOnce();
    });

    it('should clear existing timer before scheduling new one', () => {
      const state = createReconnectState();
      const oldTimer = setTimeout(() => {}, 99999);
      state.timer = oldTimer;

      const onConnect = vi.fn();
      const onMaxReached = vi.fn();

      scheduleReconnect(state, onConnect, onMaxReached);

      expect(state.timer).not.toBe(oldTimer);
    });
  });
});
