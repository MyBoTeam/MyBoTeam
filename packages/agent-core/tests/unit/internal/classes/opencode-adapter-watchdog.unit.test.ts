import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenCodeAdapter } from '../../../../src/internal/classes/open-code-adapter.js';

describe('OpenCodeAdapter watchdog wiring', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function constructAdapter(): OpenCodeAdapter {
    const adapter = new OpenCodeAdapter(
      {
        platform: 'darwin',
        isPackaged: false,
        tempPath: '/tmp',
      },
      'tsk_watchdog_test',
    );
    return adapter;
  }

  it('startWatchdog constructs a watchdog instance', () => {
    const adapter = constructAdapter();

    expect((adapter as unknown as { watchdog: unknown }).watchdog).toBeNull();

    (adapter as unknown as { startWatchdog: () => void }).startWatchdog();

    expect((adapter as unknown as { watchdog: unknown }).watchdog).not.toBeNull();

    (adapter as unknown as { teardown: () => void }).teardown();
    expect((adapter as unknown as { watchdog: unknown }).watchdog).toBeNull();
  });

  it('hard-timeout handler emits "error" and calls markComplete with status="error"', () => {
    const adapter = constructAdapter();

    const errorEvents: Error[] = [];
    adapter.on('error', (err) => errorEvents.push(err));
    const completeEvents: Array<{ status: string; error?: string }> = [];
    adapter.on('complete', (result) => completeEvents.push(result));

    (
      adapter as unknown as {
        handleWatchdogHardTimeout: (ctx: {
          elapsedMs: number;
          attempt: number;
          snapshot: { fingerprint: string; inProgress: boolean };
        }) => void;
      }
    ).handleWatchdogHardTimeout({
      elapsedMs: 150_000,
      attempt: 1,
      snapshot: { fingerprint: 'frozen:0:no-pending', inProgress: true },
    });

    expect(errorEvents).toHaveLength(1);
    expect(errorEvents[0].message).toMatch(/watchdog/i);
    expect(errorEvents[0].message).toMatch(/\d+s/);

    expect(completeEvents).toHaveLength(1);
    expect(completeEvents[0].status).toBe('error');
    expect(completeEvents[0].error).toMatch(/watchdog/i);
  });

  it('sampleWatchdogState reports inProgress=false when a pending request is waiting on a human', () => {
    const adapter = constructAdapter();

    const priv = adapter as unknown as {
      currentSessionId: string | null;
      watchdogActivityCounter: number;
      pendingRequest: unknown;
      sampleWatchdogState: () => { fingerprint: string; inProgress: boolean };
    };
    priv.currentSessionId = 'ses_1';
    priv.watchdogActivityCounter = 5;
    priv.pendingRequest = {
      kind: 'permission',
      ossRequestId: 'filereq_xyz',
      sdkRequestId: 'per_sdk_xyz',
    };

    const snap = priv.sampleWatchdogState();

    expect(snap.inProgress).toBe(false);

    expect(snap.fingerprint).toContain('per_sdk_xyz');
  });

  it('hard-timeout handler is a no-op when the task already completed', () => {
    const adapter = constructAdapter();
    const errorEvents: Error[] = [];
    adapter.on('error', (err) => errorEvents.push(err));

    (adapter as unknown as { hasCompleted: boolean }).hasCompleted = true;

    (
      adapter as unknown as {
        handleWatchdogHardTimeout: (ctx: {
          elapsedMs: number;
          attempt: number;
          snapshot: { fingerprint: string; inProgress: boolean };
        }) => void;
      }
    ).handleWatchdogHardTimeout({
      elapsedMs: 200_000,
      attempt: 1,
      snapshot: { fingerprint: 'x', inProgress: true },
    });

    expect(errorEvents).toHaveLength(0);
  });
});
