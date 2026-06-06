import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createRateLimitState,
  getSessionForSender,
  isGlobalRateLimited,
  isRateLimited,
  MAX_TRACKED_SENDERS,
  RATE_LIMIT_MAX_MESSAGES,
  RATE_LIMIT_WINDOW_MS,
  recordMessage,
  SESSION_IDLE_TIMEOUT_MS,
  setSessionForSender,
} from '../../../src/whatsapp/task-bridge-rate-limit.js';

describe('task-bridge-rate-limit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createRateLimitState', () => {
    it('should return empty state with senderTimestamps and globalTimestamps', () => {
      const state = createRateLimitState();
      expect(state.senderTimestamps).toBeInstanceOf(Map);
      expect(state.senderTimestamps.size).toBe(0);
      expect(state.globalTimestamps).toEqual([]);
    });
  });

  describe('isRateLimited', () => {
    it('should return false when no messages have been sent', () => {
      const state = createRateLimitState();
      expect(isRateLimited(state, 'user-1')).toBe(false);
    });

    it('should return false when under the limit', () => {
      const state = createRateLimitState();
      for (let i = 0; i < RATE_LIMIT_MAX_MESSAGES - 1; i++) {
        recordMessage(state, 'user-1');
      }
      expect(isRateLimited(state, 'user-1')).toBe(false);
    });

    it('should return true when at the limit', () => {
      const state = createRateLimitState();
      for (let i = 0; i < RATE_LIMIT_MAX_MESSAGES; i++) {
        recordMessage(state, 'user-1');
      }
      expect(isRateLimited(state, 'user-1')).toBe(true);
    });

    it('should filter out old timestamps outside the window', () => {
      const state = createRateLimitState();
      for (let i = 0; i < RATE_LIMIT_MAX_MESSAGES; i++) {
        recordMessage(state, 'user-1');
      }
      expect(isRateLimited(state, 'user-1')).toBe(true);

      vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1);
      expect(isRateLimited(state, 'user-1')).toBe(false);
    });
  });

  describe('isGlobalRateLimited', () => {
    it('should return false when no messages have been sent', () => {
      const state = createRateLimitState();
      expect(isGlobalRateLimited(state)).toBe(false);
    });

    it('should return true when global limit is reached', () => {
      const state = createRateLimitState();
      for (let i = 0; i < 30; i++) {
        recordMessage(state, `user-${i}`);
      }
      expect(isGlobalRateLimited(state)).toBe(true);
    });

    it('should filter out old global timestamps', () => {
      const state = createRateLimitState();
      for (let i = 0; i < 30; i++) {
        recordMessage(state, `user-${i}`);
      }
      expect(isGlobalRateLimited(state)).toBe(true);

      vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1);
      expect(isGlobalRateLimited(state)).toBe(false);
    });
  });

  describe('recordMessage', () => {
    it('should record a timestamp for a sender', () => {
      const state = createRateLimitState();
      recordMessage(state, 'user-1');
      expect(state.senderTimestamps.get('user-1')).toHaveLength(1);
      expect(state.globalTimestamps).toHaveLength(1);
    });

    it('should record multiple timestamps for the same sender', () => {
      const state = createRateLimitState();
      recordMessage(state, 'user-1');
      recordMessage(state, 'user-1');
      expect(state.senderTimestamps.get('user-1')).toHaveLength(2);
      expect(state.globalTimestamps).toHaveLength(2);
    });

    it('should clean up old senders when exceeding MAX_TRACKED_SENDERS', () => {
      const state = createRateLimitState();

      // Add more than MAX_TRACKED_SENDERS senders with recent timestamps
      for (let i = 0; i < MAX_TRACKED_SENDERS + 1; i++) {
        recordMessage(state, `sticky-user-${i}`);
      }
      // All timestamps are recent, so no cleanup happens
      expect(state.senderTimestamps.size).toBe(MAX_TRACKED_SENDERS + 1);

      // Advance time past the window so all existing timestamps expire
      vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1);

      // Add one more sender to trigger cleanup
      recordMessage(state, 'new-user');

      // Old senders should have been cleaned up (all their timestamps expired)
      // Only the new sender should remain
      expect(state.senderTimestamps.size).toBe(1);
      expect(state.senderTimestamps.has('new-user')).toBe(true);
    });
  });

  describe('getSessionForSender', () => {
    it('should return null when no session exists', () => {
      const sessions = new Map();
      expect(getSessionForSender(sessions, 'user-1')).toBeNull();
    });

    it('should return session ID when session exists and is active', () => {
      const sessions = new Map();
      setSessionForSender(sessions, 'user-1', 'session-abc');
      expect(getSessionForSender(sessions, 'user-1')).toBe('session-abc');
    });

    it('should return null and delete idle session that has timed out', () => {
      const sessions = new Map();
      setSessionForSender(sessions, 'user-1', 'session-abc');

      vi.advanceTimersByTime(SESSION_IDLE_TIMEOUT_MS + 1);

      expect(getSessionForSender(sessions, 'user-1')).toBeNull();
      expect(sessions.has('user-1')).toBe(false);
    });

    it('should keep session alive within idle timeout', () => {
      const sessions = new Map();
      setSessionForSender(sessions, 'user-1', 'session-abc');

      vi.advanceTimersByTime(SESSION_IDLE_TIMEOUT_MS - 1000);

      expect(getSessionForSender(sessions, 'user-1')).toBe('session-abc');
      expect(sessions.has('user-1')).toBe(true);
    });
  });

  describe('setSessionForSender', () => {
    it('should set a session and update lastActivity', () => {
      const sessions = new Map();
      setSessionForSender(sessions, 'user-1', 'session-xyz');
      const entry = sessions.get('user-1');
      expect(entry.sessionId).toBe('session-xyz');
      expect(entry.lastActivity).toBe(Date.now());
    });

    it('should overwrite existing session', () => {
      const sessions = new Map();
      setSessionForSender(sessions, 'user-1', 'session-old');
      setSessionForSender(sessions, 'user-1', 'session-new');
      expect(sessions.get('user-1').sessionId).toBe('session-new');
    });
  });
});
