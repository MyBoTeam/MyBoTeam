import type { MessagingConnectionStatus } from '@myboteam/agent-core/common';
import type { LifecycleState } from './service-lifecycle.js';

const WATCHDOG_CHECK_INTERVAL_MS = 60_000;
const WATCHDOG_IDLE_TIMEOUT_MS = 300_000;

export function startWatchdog(
  state: LifecycleState,
  setStatus: (s: MessagingConnectionStatus) => void,
): void {
  stopWatchdog(state);
  state.watchdogTimer = setInterval(() => {
    if (!state.socket) {
      return;
    }
    if (state.syncState === 'syncing') {
      return;
    }
    if (Date.now() - state.lastTransportActivity > WATCHDOG_IDLE_TIMEOUT_MS) {
      setStatus('disconnected');
    }
  }, WATCHDOG_CHECK_INTERVAL_MS);
}

export function stopWatchdog(state: LifecycleState): void {
  if (state.watchdogTimer) {
    clearInterval(state.watchdogTimer);
    state.watchdogTimer = null;
  }
}
