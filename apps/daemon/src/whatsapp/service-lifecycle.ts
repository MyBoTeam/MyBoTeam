import type { MessagingConnectionStatus } from '@myboteam/agent-core/common';
import { cleanupAuthState } from './authCleanup.js';
import type { BaileysSocket, BaileysStore } from './baileys-types.js';
import type { ReconnectState } from './reconnection.js';
import { clearReconnectTimer } from './reconnection.js';
import { initBaileysSocket, wireSocketEvents } from './whatsapp-service-init.js';
import type { SentMessageTracker } from './whatsapp-types.js';

export interface LifecycleState {
  socket: BaileysSocket | null;
  store: BaileysStore | null;
  status: MessagingConnectionStatus;
  reconnect: ReconnectState;
  disposed: boolean;
  manualDisconnect: boolean;
  qrCode: string | null;
  qrIssuedAt: number | null;
  sentMessageIds: SentMessageTracker;
  phoneNumber: string | null;
  authStatePath: string;
  storePath: string;
  lastTransportActivity: number;
  watchdogTimer: ReturnType<typeof setInterval> | null;
  syncState: 'idle' | 'syncing' | 'complete';
  syncProgress: {
    chatsProcessed: number;
    messagesProcessed: number;
    totalChats?: number;
    totalMessages?: number;
  };
}

export async function lifecycleConnect(
  state: LifecycleState,
  setStatus: (s: MessagingConnectionStatus) => void,
  emit: (event: string, ...args: unknown[]) => void,
): Promise<void> {
  if (state.disposed) throw new Error('WhatsApp service has been disposed');
  clearReconnectTimer(state.reconnect);
  state.reconnect.scheduled = false;
  state.reconnect.attempts = 0;
  state.manualDisconnect = false;
  if (state.status === 'connecting') return;
  setStatus('connecting');
  try {
    const { socket, store, saveCreds, DisconnectReason, jidNormalizedUser } =
      await initBaileysSocket(
        state.authStatePath,
        state.storePath,
        () => state.disposed,
        () => setStatus('disconnected'),
      );
    if (state.disposed) {
      setStatus('disconnected');
      return;
    }
    disposeSocket(state);
    state.socket = socket as unknown as BaileysSocket;
    state.store = store;
    wireSocketEvents(
      socket as unknown as BaileysSocket,
      saveCreds,
      DisconnectReason as unknown as Record<string, number>,
      jidNormalizedUser,
      {
        reconnect: state.reconnect,
        authStatePath: state.authStatePath,
        disposed: state.disposed,
        manualDisconnect: state.manualDisconnect,
        setStatus: (s) => setStatus(s),
        setQrCode: (qr) => {
          state.qrCode = qr;
          state.qrIssuedAt = Date.now();
        },
        emitQr: (qr) => emit('qr', qr),
        emitPhoneNumber: (p) => {
          state.phoneNumber = p;
          emit('phoneNumber', p);
        },
        emitOwnerLid: (lid) => emit('ownerLid', lid),
        connect: () => lifecycleConnect(state, setStatus, emit),
        sentMessageIds: state.sentMessageIds,
        emitMessage: (msg) => emit('message', msg),
      },
    );

    const countStoreMessages = (): { chats: number; messages: number } => ({
      chats: state.store?.chats?.all()?.length ?? 0,
      messages: state.store?.messages
        ? Object.values(state.store.messages).reduce(
            (sum, msgMap) => sum + (msgMap?.all()?.length ?? 0),
            0,
          )
        : 0,
    });

    const checkStoreAndEmit = () => {
      const counts = countStoreMessages();
      state.syncProgress = {
        chatsProcessed: Math.max(state.syncProgress.chatsProcessed, counts.chats),
        messagesProcessed: Math.max(state.syncProgress.messagesProcessed, counts.messages),
      };
      emit('syncProgress', { ...state.syncProgress, syncState: state.syncState });
    };

    const counts = countStoreMessages();
    if (counts.chats > 0 || counts.messages > 0) {
      state.syncState = 'complete';
      state.syncProgress = { chatsProcessed: counts.chats, messagesProcessed: counts.messages };
      emit('syncProgress', { ...state.syncProgress, syncState: 'complete' });
    } else {
      state.syncState = 'syncing';
      state.syncProgress = { chatsProcessed: 0, messagesProcessed: 0 };
      emit('syncProgress', { ...state.syncProgress, syncState: 'syncing' });
    }

    let syncTimeout: ReturnType<typeof setTimeout> | null = null;

    const resetSyncTimeout = () => {
      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        if (state.syncState === 'syncing') {
          state.syncState = 'complete';
          emit('syncProgress', { ...state.syncProgress, syncState: 'complete' });
        }
      }, 5000);
    };

    const onHistorySet = () => {
      checkStoreAndEmit();
      resetSyncTimeout();
    };

    state.socket.ev.on('messaging-history.set', (raw: unknown) => {
      const data = raw as
        | { chats?: unknown[]; messages?: unknown[]; isLatest?: boolean }
        | undefined;
      if (data?.isLatest) {
        state.syncState = 'complete';
        if (syncTimeout) clearTimeout(syncTimeout);
        checkStoreAndEmit();
        return;
      }
      onHistorySet();
    });

    state.socket.ev.on('messages.upsert', () => {
      onHistorySet();
    });

    startWatchdog(state, setStatus, emit);
  } catch (err) {
    setStatus('disconnected');
    throw err;
  }
}

export async function lifecycleDisconnect(
  state: LifecycleState,
  setStatus: (s: MessagingConnectionStatus) => void,
): Promise<void> {
  state.manualDisconnect = true;
  state.reconnect.scheduled = false;
  state.reconnect.attempts = 0;
  clearReconnectTimer(state.reconnect);
  stopWatchdog(state);
  if (state.socket) {
    state.socket.ev.removeAllListeners('creds.update');
    state.socket.ev.removeAllListeners('connection.update');
    state.socket.ev.removeAllListeners('messages.upsert');
    state.socket.ev.removeAllListeners('messaging-history.set');
    state.socket.ev.removeAllListeners('messages.upsert');
    await state.socket.logout().catch(() => {});
    state.socket.end(new Error('User requested disconnect'));
    state.socket = null;
  }
  state.qrCode = null;
  state.qrIssuedAt = null;
  state.store = null;
  state.syncState = 'idle';
  state.syncProgress = { chatsProcessed: 0, messagesProcessed: 0 };
  cleanupAuthState(state.authStatePath);
  setStatus('disconnected');
}

export async function lifecycleReconnect(
  state: LifecycleState,
  setStatus: (s: MessagingConnectionStatus) => void,
  emit: (event: string, ...args: unknown[]) => void,
): Promise<void> {
  state.manualDisconnect = false;
  stopWatchdog(state);
  if (state.socket) {
    state.socket.ev.removeAllListeners('creds.update');
    state.socket.ev.removeAllListeners('connection.update');
    state.socket.ev.removeAllListeners('messages.upsert');
    state.socket.ev.removeAllListeners('messaging-history.set');
    state.socket.ev.removeAllListeners('messages.upsert');
    state.socket.end(new Error('Reconnecting'));
    state.socket = null;
  }
  state.qrCode = null;
  state.qrIssuedAt = null;
  state.syncState = 'idle';
  state.syncProgress = { chatsProcessed: 0, messagesProcessed: 0 };
  setStatus('disconnected');
  await lifecycleConnect(state, setStatus, emit);
}

export function lifecycleDispose(state: LifecycleState): void {
  state.disposed = true;
  state.qrCode = null;
  state.qrIssuedAt = null;
  state.store = null;
  stopWatchdog(state);
  clearReconnectTimer(state.reconnect);
  if (state.socket) {
    state.socket.ev.removeAllListeners('creds.update');
    state.socket.ev.removeAllListeners('connection.update');
    state.socket.ev.removeAllListeners('messages.upsert');
    state.socket.end(new Error('Socket replaced'));
    state.socket = null;
  }
}

function disposeSocket(state: LifecycleState): void {
  if (!state.socket) return;
  state.socket.ev.removeAllListeners('creds.update');
  state.socket.ev.removeAllListeners('connection.update');
  state.socket.ev.removeAllListeners('messages.upsert');
  state.socket.end(new Error('Socket replaced'));
  state.socket = null;
}

function startWatchdog(
  state: LifecycleState,
  setStatus: (s: MessagingConnectionStatus) => void,
  emit: (event: string, ...args: unknown[]) => void,
): void {
  stopWatchdog(state);
  const TIMEOUT_MS = 120_000;
  state.watchdogTimer = setInterval(
    () => {
      if (!state.socket) return;
      if (Date.now() - state.lastTransportActivity > TIMEOUT_MS) {
        setStatus('disconnected');
        lifecycleConnect(state, setStatus, emit).catch(() => {});
      }
    },
    Math.floor(TIMEOUT_MS / 2),
  );
}

function stopWatchdog(state: LifecycleState): void {
  if (state.watchdogTimer) {
    clearInterval(state.watchdogTimer);
    state.watchdogTimer = null;
  }
}

export function touchTransport(state: LifecycleState): void {
  state.lastTransportActivity = Date.now();
}

export function requireSocket(state: LifecycleState): BaileysSocket {
  if (!state.socket) throw new Error('WhatsApp is not connected');
  touchTransport(state);
  return state.socket;
}
