import type { MessagingConnectionStatus } from '@myboteam/agent-core/common';
import type { LifecycleState } from './service-lifecycle.js';

export function startWatchdog(
  state: LifecycleState,
  setStatus: (s: MessagingConnectionStatus) => void,
  emit: (event: string, ...args: unknown[]) => void,
): void {
  stopWatchdog(state);
  state.watchdogTimer = setInterval(() => {
    if (!state.socket) return;
    if (Date.now() - state.lastTransportActivity > 120_000) {
      setStatus('disconnected');
    }
  }, 60_000);
}

export function stopWatchdog(state: LifecycleState): void {
  if (state.watchdogTimer) {
    clearInterval(state.watchdogTimer);
    state.watchdogTimer = null;
  }
}
