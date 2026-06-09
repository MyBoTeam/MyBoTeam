import type { LifecycleState } from './service-lifecycle.js';

export function syncAttachListeners(
  state: LifecycleState,
  emit: (event: string, ...args: unknown[]) => void,
): void {
  if (!state.socket) return;

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
    return;
  }

  state.syncState = 'syncing';
  state.syncProgress = { chatsProcessed: 0, messagesProcessed: 0 };
  emit('syncProgress', { ...state.syncProgress, syncState: 'syncing' });

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
    const data = raw as { chats?: unknown[]; messages?: unknown[]; isLatest?: boolean } | undefined;
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
}
