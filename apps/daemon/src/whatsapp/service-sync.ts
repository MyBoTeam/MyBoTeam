import type { LifecycleState } from './service-lifecycle.js';
import { touchTransport } from './service-lifecycle.js';

const SYNC_COMPLETE_DEBOUNCE_MS = 15_000;

export function syncAttachListeners(
  state: LifecycleState,
  emit: (event: string, ...args: unknown[]) => void,
): void {
  if (!state.socket) return;

  cleanupSyncListeners(state);

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

  const markSyncComplete = () => {
    if (state.syncState !== 'syncing') return;
    state.syncState = 'complete';
    checkStoreAndEmit();
    cleanupSyncListeners(state);
  };

  state.syncState = 'syncing';
  state.syncProgress = { chatsProcessed: 0, messagesProcessed: 0 };
  emit('syncProgress', { ...state.syncProgress, syncState: 'syncing' });

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const resetDebounce = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(markSyncComplete, SYNC_COMPLETE_DEBOUNCE_MS);
    if (state.syncListeners) {
      state.syncListeners.debounceTimer = debounceTimer;
    }
  };

  const onHistorySet = (raw: unknown) => {
    touchTransport(state);
    checkStoreAndEmit();
    resetDebounce();
  };

  const onMessagesUpsert = () => {
    touchTransport(state);
    checkStoreAndEmit();
    resetDebounce();
  };

  state.socket.ev.on('messaging-history.set', onHistorySet);
  state.socket.ev.on('messages.upsert', onMessagesUpsert);
  state.syncListeners = { onHistorySet, onMessagesUpsert, debounceTimer: null };
  resetDebounce();
}

export function cleanupSyncListeners(state: LifecycleState): void {
  if (!state.socket || !state.syncListeners) return;
  state.socket.ev.off('messaging-history.set', state.syncListeners.onHistorySet);
  state.socket.ev.off('messages.upsert', state.syncListeners.onMessagesUpsert);
  if (state.syncListeners.debounceTimer) {
    clearTimeout(state.syncListeners.debounceTimer);
  }
  state.syncListeners = null;
}
