import { describe, expect, it } from 'vitest';
import { ProviderHealthTracker } from '../../../src/providers/provider-health.js';

describe('ProviderHealthTracker', () => {
  describe('initial state', () => {
    it('should return healthy by default', () => {
      const tracker = new ProviderHealthTracker();
      const state = tracker.getState('p1');

      expect(state.state).toBe('healthy');
      expect(state.failureCount).toBe(0);
    });
  });

  describe('isSuccess', () => {
    it('should reset failure count on success', () => {
      const tracker = new ProviderHealthTracker();

      tracker.isFailure('p1');
      tracker.isFailure('p1');
      tracker.isSuccess('p1');

      const state = tracker.getState('p1');
      expect(state.state).toBe('healthy');
      expect(state.failureCount).toBe(0);
      expect(state.lastSuccessAt).toBeDefined();
    });
  });

  describe('isFailure', () => {
    it('should track failure count', () => {
      const tracker = new ProviderHealthTracker();

      tracker.isFailure('p1');
      const state1 = tracker.getState('p1');
      expect(state1.failureCount).toBe(1);
      expect(state1.state).toBe('healthy');
      expect(state1.lastFailureAt).toBeDefined();
    });

    it('should mark as degraded after 2 failures', () => {
      const tracker = new ProviderHealthTracker();

      tracker.isFailure('p1');
      tracker.isFailure('p1');

      const state = tracker.getState('p1');
      expect(state.state).toBe('degraded');
      expect(state.failureCount).toBe(2);
    });

    it('should enter cooldown after 3 failures', () => {
      const tracker = new ProviderHealthTracker();

      tracker.isFailure('p1');
      tracker.isFailure('p1');
      tracker.isFailure('p1');

      const state = tracker.getState('p1');
      expect(state.state).toBe('cooldown');
      expect(state.failureCount).toBe(3);
      expect(state.cooldownExpiresAt).toBeDefined();
      expect(state.cooldownStartedAt).toBeDefined();
    });
  });

  describe('canUse', () => {
    it('should return true for healthy provider', () => {
      const tracker = new ProviderHealthTracker();
      expect(tracker.canUse('p1')).toBe(true);
    });

    it('should return false for provider in active cooldown', () => {
      const tracker = new ProviderHealthTracker();
      tracker.isFailure('p1');
      tracker.isFailure('p1');
      tracker.isFailure('p1');

      expect(tracker.canUse('p1')).toBe(false);
    });

    it('should return true after cooldown expires', () => {
      const tracker = new ProviderHealthTracker();
      tracker.isFailure('p1');
      tracker.isFailure('p1');
      tracker.isFailure('p1');

      const state = tracker.getState('p1');
      // Set cooldown to past
      const pastState = { ...state, cooldownExpiresAt: new Date(Date.now() - 1000).toISOString() };
      // @ts-expect-error - accessing internal state for test
      tracker.state.set('p1', pastState);

      expect(tracker.canUse('p1')).toBe(true);
    });
  });

  describe('getAll', () => {
    it('should return all tracked providers', () => {
      const tracker = new ProviderHealthTracker();
      tracker.isFailure('p1');
      tracker.isSuccess('p2');

      const all = tracker.getAll();
      expect(all.size).toBe(2);
      expect(all.get('p1')?.failureCount).toBe(1);
      expect(all.get('p2')?.state).toBe('healthy');
    });
  });
});
