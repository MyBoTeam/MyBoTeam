import {
  MAX_TRACKED_SENDERS,
  RATE_LIMIT_WINDOW_MS,
  type RateLimitState,
  SESSION_IDLE_TIMEOUT_MS,
  type SenderSession,
} from './task-bridge-rate-limit-config.js';

export function recordMessage(state: RateLimitState, senderId: string): void {
  const now = Date.now();
  const timestamps = state.senderTimestamps.get(senderId) || [];
  timestamps.push(now);
  state.senderTimestamps.set(senderId, timestamps);
  state.globalTimestamps.push(now);

  if (state.senderTimestamps.size > MAX_TRACKED_SENDERS) {
    for (const [key, ts] of state.senderTimestamps) {
      if (ts.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) {
        state.senderTimestamps.delete(key);
      }
    }
  }
}

export function getSessionForSender(
  sessions: Map<string, SenderSession>,
  senderId: string,
): string | null {
  const session = sessions.get(senderId);
  if (!session) {
    return null;
  }
  if (Date.now() - session.lastActivity > SESSION_IDLE_TIMEOUT_MS) {
    sessions.delete(senderId);
    return null;
  }
  return session.sessionId;
}

export function setSessionForSender(
  sessions: Map<string, SenderSession>,
  senderId: string,
  sessionId: string,
): void {
  sessions.set(senderId, { sessionId, lastActivity: Date.now() });
}
