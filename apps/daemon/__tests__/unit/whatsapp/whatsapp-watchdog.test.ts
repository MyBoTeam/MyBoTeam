import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/logger.js', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import type { LifecycleState } from '../../../src/whatsapp/service-lifecycle.js';
import { startWatchdog, stopWatchdog } from '../../../src/whatsapp/service-watchdog.js';

function createState(overrides?: Partial<LifecycleState>): LifecycleState {
  return {
    socket: null,
    store: null,
    status: 'connected',
    reconnect: { attempts: 0, scheduled: false, timer: null },
    disposed: false,
    manualDisconnect: false,
    qrCode: null,
    qrIssuedAt: null,
    sentMessageIds: new Set(),
    phoneNumber: null,
    authStatePath: '/tmp/auth',
    storePath: '/tmp/store',
    lastTransportActivity: Date.now(),
    watchdogTimer: null,
    syncState: 'idle',
    syncProgress: { chatsProcessed: 0, messagesProcessed: 0 },
    syncListeners: null,
    ...overrides,
  };
}

describe('startWatchdog', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not disconnect when transport activity is recent', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    const setStatus = vi.fn();
    const state = createState({
      socket: { ev: { on: vi.fn(), removeAllListeners: vi.fn() } } as never,
      lastTransportActivity: now,
      syncState: 'idle',
    });

    startWatchdog(state, setStatus);
    vi.advanceTimersByTime(60_000);

    expect(setStatus).not.toHaveBeenCalled();
  });

  it('disconnects after 5 minutes of no transport activity', () => {
    const fiveMinAgo = 0;
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(fiveMinAgo)
      .mockReturnValueOnce(fiveMinAgo + 300_001);

    const setStatus = vi.fn();
    const state = createState({
      socket: { ev: { on: vi.fn(), removeAllListeners: vi.fn() } } as never,
      lastTransportActivity: fiveMinAgo,
      syncState: 'idle',
    });

    startWatchdog(state, setStatus);
    vi.advanceTimersByTime(60_000);

    expect(setStatus).toHaveBeenCalledWith('disconnected');
  });

  it('does NOT disconnect during sync even with stale transport', () => {
    const fiveMinAgo = 0;
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(fiveMinAgo)
      .mockReturnValueOnce(fiveMinAgo + 300_001);

    const setStatus = vi.fn();
    const state = createState({
      socket: { ev: { on: vi.fn(), removeAllListeners: vi.fn() } } as never,
      lastTransportActivity: fiveMinAgo,
      syncState: 'syncing',
    });

    startWatchdog(state, setStatus);
    vi.advanceTimersByTime(60_000);

    expect(setStatus).not.toHaveBeenCalled();
  });

  it('resumes disconnection checks after sync completes', () => {
    const fiveMinAgo = 0;
    const nowSpy = vi.spyOn(Date, 'now');

    const setStatus = vi.fn();
    const state = createState({
      socket: { ev: { on: vi.fn(), removeAllListeners: vi.fn() } } as never,
      lastTransportActivity: fiveMinAgo,
      syncState: 'syncing',
    });

    startWatchdog(state, setStatus);

    nowSpy.mockReturnValue(fiveMinAgo + 300_001);
    vi.advanceTimersByTime(60_000);
    expect(setStatus).not.toHaveBeenCalled();

    state.syncState = 'complete';

    nowSpy.mockReturnValue(fiveMinAgo + 300_001 + 60_000);
    vi.advanceTimersByTime(60_000);
    expect(setStatus).toHaveBeenCalledWith('disconnected');
  });

  it('skips check when socket is null', () => {
    vi.spyOn(Date, 'now').mockReturnValue(300_001);

    const setStatus = vi.fn();
    const state = createState({
      socket: null,
      lastTransportActivity: 0,
      syncState: 'idle',
    });

    startWatchdog(state, setStatus);
    vi.advanceTimersByTime(60_000);

    expect(setStatus).not.toHaveBeenCalled();
  });
});

describe('stopWatchdog', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears the watchdog timer', () => {
    const setStatus = vi.fn();
    const state = createState({
      socket: { ev: { on: vi.fn(), removeAllListeners: vi.fn() } } as never,
      syncState: 'idle',
    });

    startWatchdog(state, setStatus);
    expect(state.watchdogTimer).not.toBeNull();

    stopWatchdog(state);
    expect(state.watchdogTimer).toBeNull();

    vi.advanceTimersByTime(60_000);
    expect(setStatus).not.toHaveBeenCalled();
  });
});
