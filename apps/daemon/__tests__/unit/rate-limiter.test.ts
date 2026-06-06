import { afterEach, describe, expect, it, vi } from 'vitest';
import { RateLimiter } from '../../src/rate-limiter.js';

describe('RateLimiter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow up to max requests within the window and then block', () => {
    const limiter = new RateLimiter(60_000, 2);

    expect(limiter.isAllowed('127.0.0.1')).toBe(true);
    expect(limiter.isAllowed('127.0.0.1')).toBe(true);
    expect(limiter.isAllowed('127.0.0.1')).toBe(false);

    limiter.dispose();
  });

  it('should track limits independently per IP', () => {
    const limiter = new RateLimiter(60_000, 1);

    expect(limiter.isAllowed('127.0.0.1')).toBe(true);
    expect(limiter.isAllowed('127.0.0.2')).toBe(true);
    expect(limiter.isAllowed('127.0.0.1')).toBe(false);
    expect(limiter.isAllowed('127.0.0.2')).toBe(false);

    limiter.dispose();
  });

  it('should allow requests again after the window has elapsed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

    const limiter = new RateLimiter(1_000, 1);

    expect(limiter.isAllowed('127.0.0.1')).toBe(true);
    expect(limiter.isAllowed('127.0.0.1')).toBe(false);

    vi.advanceTimersByTime(1_001);

    expect(limiter.isAllowed('127.0.0.1')).toBe(true);

    limiter.dispose();
  });

  it('should remove stale entries during periodic cleanup', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

    const limiter = new RateLimiter(1_000, 10);
    const requests = (limiter as unknown as { requests: Map<string, number[]> }).requests;

    expect(limiter.isAllowed('127.0.0.1')).toBe(true);
    expect(requests.size).toBe(1);

    vi.advanceTimersByTime(61_000);

    expect(requests.size).toBe(0);

    limiter.dispose();
  });

  it('should filter partially stale entries during periodic cleanup', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

    const limiter = new RateLimiter(60_000, 10);
    const requests = (limiter as unknown as { requests: Map<string, number[]> }).requests;

    // First request at time 0
    expect(limiter.isAllowed('127.0.0.1')).toBe(true);

    // Second request at time 55s — still within the same window
    vi.advanceTimersByTime(55_000);
    expect(limiter.isAllowed('127.0.0.1')).toBe(true);

    expect(requests.get('127.0.0.1')).toHaveLength(2);

    // Advance to 60s — cleanup fires. First timestamp is stale (60s old),
    // second is still fresh (5s old), so entry is kept with filtered timestamps
    vi.advanceTimersByTime(5_000);

    // After cleanup, only the newer timestamp should remain
    expect(requests.get('127.0.0.1')).toHaveLength(1);

    limiter.dispose();
  });

  it('should clear state and timer on dispose', () => {
    const limiter = new RateLimiter(60_000, 2);
    const typed = limiter as unknown as {
      requests: Map<string, number[]>;
      cleanupTimer: ReturnType<typeof setInterval> | null;
    };

    limiter.isAllowed('127.0.0.1');
    expect(typed.requests.size).toBe(1);
    expect(typed.cleanupTimer).not.toBeNull();

    limiter.dispose();

    expect(typed.requests.size).toBe(0);
    expect(typed.cleanupTimer).toBeNull();
  });

  it('should handle double dispose without error', () => {
    const limiter = new RateLimiter(60_000, 2);
    expect(() => {
      limiter.dispose();
      limiter.dispose();
    }).not.toThrow();
  });
});
