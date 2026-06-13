import type { LifecycleState } from './service-lifecycle.js';
import { touchTransport } from './service-lifecycle.js';

const SYNC_TIMEOUT_MS = 90_000;

export function syncAttachListeners(
  state: LifecycleState,
  emit: (event: string, ...args: unknown[]) => void,
): void {
  if (!state.socket) {
    return;
  }

  cleanupSyncListeners(state);

  const checkStoreAndEmit = () => {
    if (!state.store) {
      return;
    }
    const chats = state.store.getChats();
    state.syncProgress = {
      chatsProcessed: chats.length,
      messagesProcessed: 0,
    };
    emit('syncProgress', { ...state.syncProgress, syncState: state.syncState });
  };

  const markSyncComplete = () => {
    if (state.syncState !== 'syncing') {
      return;
    }
    state.syncState = 'complete';
    checkStoreAndEmit();
    cleanupSyncListeners(state);
  };

  state.syncState = 'syncing';
  state.syncProgress = { chatsProcessed: 0, messagesProcessed: 0 };
  emit('syncProgress', { ...state.syncProgress, syncState: 'syncing' });

  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  let markedComplete = false;

  const onHistorySet = (data: unknown) => {
    touchTransport(state);
    const { isLatest } = data as { isLatest?: boolean };
    checkStoreAndEmit();
    if (isLatest && !markedComplete) {
      markedComplete = true;
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
      }
      markSyncComplete();
    }
  };

  const onMessagesUpsert = () => {
    touchTransport(state);
    checkStoreAndEmit();
  };

  state.socket.ev.on('messaging-history.set', onHistorySet);
  state.socket.ev.on('messages.upsert', onMessagesUpsert);

  timeoutTimer = setTimeout(() => {
    if (!markedComplete) {
      markedComplete = true;
      markSyncComplete();
    }
  }, SYNC_TIMEOUT_MS);

  state.syncListeners = { onHistorySet, onMessagesUpsert, timeoutTimer };
}

export function cleanupSyncListeners(state: LifecycleState): void {
  const listeners = state.syncListeners;
  if (!listeners) {
    return;
  }
  if (listeners.timeoutTimer) {
    clearTimeout(listeners.timeoutTimer);
  }
  if (state.socket) {
    state.socket.ev.off('messaging-history.set', listeners.onHistorySet);
    state.socket.ev.off('messages.upsert', listeners.onMessagesUpsert);
  }
  state.syncListeners = null;
}
