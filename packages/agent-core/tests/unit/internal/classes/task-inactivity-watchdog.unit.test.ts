import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskInactivityWatchdog } from '../../../../src/internal/classes/TaskInactivityWatchdog.js';

describe('TaskInactivityWatchdog', () => {
  let nowMs: number;
  const advance = (ms: number) => {
    nowMs += ms;
    vi.advanceTimersByTime(ms);
  };

  const flushMicrotasks = async () => {
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
    }
  };

  beforeEach(() => {
    vi.useFakeTimers();
    nowMs = 1_000_000;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not fire any callback while the fingerprint keeps advancing', async () => {
    const onSoft = vi.fn();
    const onHard = vi.fn();
    const fingerprints = ['a', 'b', 'c', 'd'];
    let i = 0;
    const sample = vi.fn(async () => ({
      fingerprint: fingerprints[Math.min(i++, fingerprints.length - 1)],
      inProgress: true,
    }));

    const watchdog = new TaskInactivityWatchdog({
      sample,
      onSoftTimeout: onSoft,
      onHardTimeout: onHard,
      sampleIntervalMs: 1000,
      stallTimeoutMs: 10_000,
      postNudgeTimeoutMs: 5_000,
      maxSoftTimeouts: 1,
      now: () => nowMs,
    });

    watchdog.start();
    for (let tick = 0; tick < 4; tick++) {
      advance(1000);
      await flushMicrotasks();
    }
    watchdog.stop();

    expect(onSoft).not.toHaveBeenCalled();
    expect(onHard).not.toHaveBeenCalled();
  });

  it('does not fire when inProgress is false, even with a stuck fingerprint', async () => {
    const onSoft = vi.fn();
    const onHard = vi.fn();
    const sample = vi.fn(async () => ({
      fingerprint: 'stable',
      inProgress: false,
    }));

    const watchdog = new TaskInactivityWatchdog({
      sample,
      onSoftTimeout: onSoft,
      onHardTimeout: onHard,
      sampleIntervalMs: 1000,
      stallTimeoutMs: 5_000,
      postNudgeTimeoutMs: 5_000,
      maxSoftTimeouts: 1,
      now: () => nowMs,
    });

    watchdog.start();
    for (let tick = 0; tick < 10; tick++) {
      advance(1000);
      await flushMicrotasks();
    }
    watchdog.stop();

    expect(onSoft).not.toHaveBeenCalled();
    expect(onHard).not.toHaveBeenCalled();
  });

  it('fires onSoftTimeout once after stallTimeoutMs of a frozen fingerprint', async () => {
    const onSoft = vi.fn(async () => {});
    const onHard = vi.fn(async () => {});
    const sample = vi.fn(async () => ({
      fingerprint: 'frozen',
      inProgress: true,
    }));

    const watchdog = new TaskInactivityWatchdog({
      sample,
      onSoftTimeout: onSoft,
      onHardTimeout: onHard,
      sampleIntervalMs: 1000,
      stallTimeoutMs: 10_000,
      postNudgeTimeoutMs: 5_000,
      maxSoftTimeouts: 1,
      now: () => nowMs,
    });

    watchdog.start();

    for (let i = 0; i < 11; i++) {
      advance(1000);
      await flushMicrotasks();
    }

    expect(onSoft).toHaveBeenCalledTimes(1);
    expect(onHard).not.toHaveBeenCalled();

    const arg = onSoft.mock.calls[0][0];
    expect(arg.attempt).toBe(1);
    expect(arg.elapsedMs).toBeGreaterThanOrEqual(10_000);

    watchdog.stop();
  });

  it('escalates to onHardTimeout when the post-nudge window elapses with no progress', async () => {
    const onSoft = vi.fn(async () => {});
    const onHard = vi.fn(async () => {});
    const sample = vi.fn(async () => ({
      fingerprint: 'still-frozen',
      inProgress: true,
      summary: 'stuck task',
    }));

    const watchdog = new TaskInactivityWatchdog({
      sample,
      onSoftTimeout: onSoft,
      onHardTimeout: onHard,
      sampleIntervalMs: 1000,
      stallTimeoutMs: 5_000,
      postNudgeTimeoutMs: 3_000,
      maxSoftTimeouts: 1,
      now: () => nowMs,
    });

    watchdog.start();

    for (let i = 0; i < 10; i++) {
      advance(1000);
      await flushMicrotasks();
    }

    expect(onSoft).toHaveBeenCalledTimes(1);
    expect(onHard).toHaveBeenCalledTimes(1);
    expect(onHard.mock.calls[0][0].snapshot.summary).toBe('stuck task');

    for (let i = 0; i < 5; i++) {
      advance(1000);
      await flushMicrotasks();
    }
    expect(onHard).toHaveBeenCalledTimes(1);
  });

  it('resets the soft-timeout counter when the fingerprint changes', async () => {
    const onSoft = vi.fn(async () => {});
    const onHard = vi.fn(async () => {});
    let fingerprint = 'A';
    const sample = vi.fn(async () => ({
      fingerprint,
      inProgress: true,
    }));

    const watchdog = new TaskInactivityWatchdog({
      sample,
      onSoftTimeout: onSoft,
      onHardTimeout: onHard,
      sampleIntervalMs: 1000,
      stallTimeoutMs: 5_000,
      postNudgeTimeoutMs: 3_000,
      maxSoftTimeouts: 1,
      now: () => nowMs,
    });

    watchdog.start();

    for (let i = 0; i < 6; i++) {
      advance(1000);
      await flushMicrotasks();
    }
    expect(onSoft).toHaveBeenCalledTimes(1);
    expect(onHard).not.toHaveBeenCalled();

    fingerprint = 'B';
    for (let i = 0; i < 2; i++) {
      advance(1000);
      await flushMicrotasks();
    }
    expect(onHard).not.toHaveBeenCalled();

    for (let i = 0; i < 6; i++) {
      advance(1000);
      await flushMicrotasks();
    }
    expect(onSoft).toHaveBeenCalledTimes(2);
    expect(onHard).not.toHaveBeenCalled();

    watchdog.stop();
  });

  it('stop() cancels scheduled ticks so no callback fires after it', async () => {
    const onSoft = vi.fn(async () => {});
    const onHard = vi.fn(async () => {});
    const sample = vi.fn(async () => ({
      fingerprint: 'stuck',
      inProgress: true,
    }));

    const watchdog = new TaskInactivityWatchdog({
      sample,
      onSoftTimeout: onSoft,
      onHardTimeout: onHard,
      sampleIntervalMs: 1000,
      stallTimeoutMs: 5_000,
      postNudgeTimeoutMs: 3_000,
      maxSoftTimeouts: 1,
      now: () => nowMs,
    });

    watchdog.start();
    advance(2000);
    await flushMicrotasks();
    watchdog.stop();

    advance(30_000);
    await flushMicrotasks();

    expect(onSoft).not.toHaveBeenCalled();
    expect(onHard).not.toHaveBeenCalled();
  });

  it('sample errors are surfaced to onDebug and the loop keeps running', async () => {
    const onSoft = vi.fn();
    const onHard = vi.fn();
    const onDebug = vi.fn();
    let calls = 0;
    const sample = vi.fn(async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error('boom');
      }
      return { fingerprint: 'x', inProgress: true };
    });

    const watchdog = new TaskInactivityWatchdog({
      sample,
      onSoftTimeout: onSoft,
      onHardTimeout: onHard,
      onDebug,
      sampleIntervalMs: 500,
      stallTimeoutMs: 5_000,
      postNudgeTimeoutMs: 3_000,
      maxSoftTimeouts: 1,
      now: () => nowMs,
    });

    watchdog.start();
    advance(500);
    await flushMicrotasks();
    advance(500);
    await flushMicrotasks();

    expect(onDebug).toHaveBeenCalledWith(
      'watchdog_sample_error',
      expect.any(String),
      expect.objectContaining({ message: 'boom' }),
    );
    expect(calls).toBeGreaterThanOrEqual(2);
    watchdog.stop();
  });
});
