import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/logger.js', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import type { LifecycleState } from '../../../src/whatsapp/service-lifecycle.js';
import { cleanupSyncListeners, syncAttachListeners } from '../../../src/whatsapp/service-sync.js';

function createMockSocket() {
  const handlers = new Map<string, Array<(...args: unknown[]) => void>>();

  return {
    handlers,
    ev: {
      on(event: string, handler: (...args: unknown[]) => void) {
        const list = handlers.get(event) ?? [];
        list.push(handler);
        handlers.set(event, list);
      },
      off(event: string, handler: (...args: unknown[]) => void) {
        const list = handlers.get(event);
        if (list) {
          const idx = list.indexOf(handler);
          if (idx !== -1) {
            list.splice(idx, 1);
          }
          if (list.length === 0) handlers.delete(event);
        }
      },
      removeAllListeners(event?: string) {
        if (event) {
          handlers.delete(event);
        } else {
          handlers.clear();
        }
      },
    },
    end: vi.fn(),
    logout: vi.fn(),
    sendMessage: vi.fn(),
    sendPresenceUpdate: vi.fn(),
    readMessages: vi.fn(),
  };
}

function createState(socket: ReturnType<typeof createMockSocket> | null): LifecycleState {
  return {
    socket,
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
  };
}

describe('syncAttachListeners', () => {
  let mockSocket: ReturnType<typeof createMockSocket>;
  let state: LifecycleState;
  let emit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    mockSocket = createMockSocket();
    state = createState(mockSocket);
    emit = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('sets syncState to syncing and emits initial progress', () => {
    syncAttachListeners(state, emit);

    expect(state.syncState).toBe('syncing');
    expect(state.syncListeners).not.toBeNull();
    expect(emit).toHaveBeenCalledWith('syncProgress', {
      chatsProcessed: 0,
      messagesProcessed: 0,
      syncState: 'syncing',
    });
  });

  it('completes immediately on isLatest=true', () => {
    state.store = {
      getChats: () => [
        { jid: 'c1', name: 'c1' },
        { jid: 'c2', name: 'c2' },
      ],
      getMessages: (jid: string) => [
        {
          messageId: 'm1',
          senderJid: jid,
          fromMe: false,
          text: '',
          timestamp: 0,
          messageType: 'text',
        },
      ],
      bind: vi.fn(),
    };

    syncAttachListeners(state, emit);
    emit.mockClear();

    const histHandlers = mockSocket.handlers.get('messaging-history.set')!;
    histHandlers.forEach((h) => h({ chats: [], messages: [], isLatest: true }));

    expect(state.syncState).toBe('complete');
  });

  it('completes sync after 90s timeout when isLatest is false', () => {
    state.store = {
      getChats: () => [{ jid: 'c1', name: 'c1' }],
      getMessages: () => [],
      bind: vi.fn(),
    };

    syncAttachListeners(state, emit);
    emit.mockClear();

    const histHandlers = mockSocket.handlers.get('messaging-history.set')!;
    histHandlers.forEach((h) => h({ chats: [], messages: [], isLatest: false }));

    expect(state.syncState).toBe('syncing');

    vi.advanceTimersByTime(90_000);

    expect(state.syncState).toBe('complete');
    expect(emit).toHaveBeenCalledWith(
      'syncProgress',
      expect.objectContaining({ syncState: 'complete' }),
    );
  });

  it('does not reset timeout timer on sync events', () => {
    state.store = {
      getChats: () => [{ jid: 'c1', name: 'c1' }],
      getMessages: () => [],
      bind: vi.fn(),
    };

    syncAttachListeners(state, emit);
    emit.mockClear();

    const histHandlers = mockSocket.handlers.get('messaging-history.set')!;
    histHandlers.forEach((h) => h({ chats: [], messages: [], isLatest: false }));

    vi.advanceTimersByTime(50_000);
    expect(state.syncState).toBe('syncing');

    const upsertHandlers = mockSocket.handlers.get('messages.upsert')!;
    upsertHandlers.forEach((h) => h({ type: 'notify', messages: [] }));

    vi.advanceTimersByTime(50_000);

    expect(state.syncState).toBe('complete');
  });

  it('cleans up listeners and timer on completion', () => {
    state.store = {
      getChats: () => [],
      getMessages: () => [],
      bind: vi.fn(),
    };

    syncAttachListeners(state, emit);
    emit.mockClear();

    vi.advanceTimersByTime(90_000);

    expect(state.syncState).toBe('complete');
    expect(state.syncListeners).toBeNull();
  });

  it('updates progress but does NOT complete on isLatest=false', () => {
    state.store = {
      getChats: () => [{ jid: 'c1', name: 'c1' }],
      getMessages: (jid: string) => [
        {
          messageId: 'm1',
          senderJid: jid,
          fromMe: false,
          text: '',
          timestamp: 0,
          messageType: 'text',
        },
      ],
      bind: vi.fn(),
    };

    syncAttachListeners(state, emit);
    emit.mockClear();

    const histHandlers = mockSocket.handlers.get('messaging-history.set')!;
    histHandlers.forEach((h) => h({ chats: [], messages: [], isLatest: false }));

    expect(state.syncState).toBe('syncing');
    expect(emit).toHaveBeenCalledWith(
      'syncProgress',
      expect.objectContaining({ syncState: 'syncing' }),
    );
  });

  it('updates progress on messages.upsert', () => {
    state.store = {
      getChats: () => [],
      getMessages: () => [],
      bind: vi.fn(),
    };

    syncAttachListeners(state, emit);
    emit.mockClear();

    const upsertHandlers = mockSocket.handlers.get('messages.upsert')!;
    upsertHandlers.forEach((h) => h({ type: 'notify', messages: [] }));

    expect(emit).toHaveBeenCalledWith(
      'syncProgress',
      expect.objectContaining({ syncState: 'syncing' }),
    );
  });

  it('does NOT use persisted store data to premature-complete sync', () => {
    state.store = {
      getChats: () => [{ jid: 'c1', name: 'c1' }],
      getMessages: () => [],
      bind: vi.fn(),
    };

    syncAttachListeners(state, emit);

    expect(state.syncState).toBe('syncing');
  });

  it('touches transport activity on each sync event', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(5000);

    syncAttachListeners(state, emit);

    nowSpy.mockReturnValue(6000);
    const upsertHandlers = mockSocket.handlers.get('messages.upsert')!;
    upsertHandlers.forEach((h) => h({ type: 'notify', messages: [] }));
    expect(state.lastTransportActivity).toBe(6000);

    nowSpy.mockReturnValue(7000);
    const histHandlers = mockSocket.handlers.get('messaging-history.set')!;
    histHandlers.forEach((h) => h({ chats: [], messages: [], isLatest: false }));
    expect(state.lastTransportActivity).toBe(7000);
  });

  it('does nothing when socket is null', () => {
    state = createState(null);
    syncAttachListeners(state, emit);

    expect(state.syncState).toBe('idle');
    expect(emit).not.toHaveBeenCalled();
  });

  it('replaces previous sync listeners when called again', () => {
    syncAttachListeners(state, emit);
    const firstListeners = state.syncListeners;
    expect(firstListeners).not.toBeNull();

    syncAttachListeners(state, emit);
    expect(state.syncListeners).not.toBe(firstListeners);
  });
});

describe('cleanupSyncListeners', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('removes only sync-specific listeners using off', () => {
    const mockSocket = createMockSocket();
    const localEmit = vi.fn();
    const externalHandler = vi.fn();

    const state = createState(mockSocket);
    mockSocket.ev.on('messages.upsert', externalHandler);

    syncAttachListeners(state, localEmit);

    const upsertHandlers = mockSocket.handlers.get('messages.upsert')!;
    expect(upsertHandlers.length).toBe(2);

    cleanupSyncListeners(state);

    const remaining = mockSocket.handlers.get('messages.upsert')!;
    expect(remaining.length).toBe(1);
    expect(remaining[0]).toBe(externalHandler);
    expect(state.syncListeners).toBeNull();
  });

  it('clears debounce timer on cleanup', () => {
    const mockSocket = createMockSocket();
    const state = createState(mockSocket);
    const localEmit = vi.fn();

    syncAttachListeners(state, localEmit);

    const histHandlers = mockSocket.handlers.get('messaging-history.set')!;
    histHandlers.forEach((h) => h({ chats: [], messages: [], isLatest: false }));

    expect(state.syncState).toBe('syncing');

    cleanupSyncListeners(state);

    vi.advanceTimersByTime(30_000);

    expect(state.syncState).toBe('syncing');
  });

  it('does nothing when socket is null', () => {
    const state = createState(null);
    expect(() => cleanupSyncListeners(state)).not.toThrow();
  });

  it('does nothing when syncListeners is null', () => {
    const mockSocket = createMockSocket();
    const state = createState(mockSocket);
    state.syncListeners = null;
    expect(() => cleanupSyncListeners(state)).not.toThrow();
  });
});
