import type { MessagingConnectionStatus } from '@myboteam/agent-core/common';
import { type LifecycleState, lifecycleConnect } from './service-lifecycle.js';
import { stopWatchdog } from './service-watchdog.js';

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
