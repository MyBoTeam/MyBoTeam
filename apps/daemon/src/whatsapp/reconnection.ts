import { log } from '../logger.js';

export const MAX_RECONNECT_ATTEMPTS = 12;
export const INITIAL_RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const JITTER_FACTOR = 0.25;

export interface ReconnectState {
  attempts: number;
  scheduled: boolean;
  timer: ReturnType<typeof setTimeout> | null;
}

export function createReconnectState(): ReconnectState {
  return { attempts: 0, scheduled: false, timer: null };
}

export function clearReconnectTimer(state: ReconnectState): void {
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
}

export function scheduleReconnect(
  state: ReconnectState,
  onConnect: () => Promise<void>,
  onMaxReached: () => void,
): void {
  if (state.scheduled) {
    return;
  }

  if (state.attempts >= MAX_RECONNECT_ATTEMPTS) {
    log.warn('[WhatsApp] Max reconnect attempts reached');
    onMaxReached();
    return;
  }

  state.attempts++;
  state.scheduled = true;

  const baseDelay = Math.min(
    INITIAL_RECONNECT_DELAY_MS * 2 ** (state.attempts - 1),
    MAX_RECONNECT_DELAY_MS,
  );
  const jitter = baseDelay * JITTER_FACTOR * (Math.random() * 2 - 1);
  const delay = Math.max(INITIAL_RECONNECT_DELAY_MS, baseDelay + jitter);

  log.warn(
    `[WhatsApp] Reconnecting in ${Math.round(delay)}ms (attempt ${state.attempts}/${MAX_RECONNECT_ATTEMPTS})`,
  );

  clearReconnectTimer(state);
  state.timer = setTimeout(() => {
    state.scheduled = false;
    onConnect().catch((err) => log.error('[WhatsApp] Reconnect failed:', err));
  }, delay);
}
