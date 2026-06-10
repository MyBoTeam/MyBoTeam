import type { MessagingConnectionStatus } from '@myboteam/agent-core/common';
import { cleanupAuthState } from './authCleanup.js';
import type { BaileysSocket } from './baileys-types.js';
import type { ReconnectState } from './reconnection.js';
import { clearReconnectTimer } from './reconnection.js';
import { cleanupSyncListeners, syncAttachListeners } from './service-sync.js';
import { startWatchdog } from './service-watchdog.js';
import { initBaileysSocket, wireSocketEvents } from './whatsapp-service-init.js';
import type { WhatsAppStore } from './whatsapp-store.js';
import type { SentMessageTracker } from './whatsapp-types.js';

export interface LifecycleState {
  socket: BaileysSocket | null;
  store: WhatsAppStore | null;
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
  syncListeners: {
    onHistorySet: (raw: unknown) => void;
    onMessagesUpsert: () => void;
    timeoutTimer: ReturnType<typeof setTimeout> | null;
  } | null;
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
    syncAttachListeners(state, emit);
    startWatchdog(state, setStatus);
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
  cleanupSyncListeners(state);
  if (state.socket) {
    state.socket.ev.removeAllListeners('creds.update');
    state.socket.ev.removeAllListeners('connection.update');
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

export function lifecycleDispose(state: LifecycleState): void {
  state.disposed = true;
  state.qrCode = null;
  state.qrIssuedAt = null;
  state.store = null;
  stopWatchdog(state);
  cleanupSyncListeners(state);
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

function stopWatchdog(state: LifecycleState): void {
  if (state.watchdogTimer) {
    clearInterval(state.watchdogTimer);
    state.watchdogTimer = null;
  }
}

export function touchTransport(state: LifecycleState): void {
  state.lastTransportActivity = Date.now();
}

export function lifecycleSoftResync(
  state: LifecycleState,
  emit: (event: string, ...args: unknown[]) => void,
): void {
  if (!state.socket || !state.store) return;
  state.syncState = 'idle';
  cleanupSyncListeners(state);
  syncAttachListeners(state, emit);
}

export function requireSocket(state: LifecycleState): BaileysSocket {
  if (!state.socket) throw new Error('WhatsApp is not connected');
  touchTransport(state);
  return state.socket;
}
