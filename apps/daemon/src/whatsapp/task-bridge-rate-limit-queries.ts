import {
  GLOBAL_RATE_LIMIT_MAX,
  RATE_LIMIT_MAX_MESSAGES,
  RATE_LIMIT_WINDOW_MS,
  type RateLimitState,
} from './task-bridge-rate-limit-config.js';

export function createRateLimitState(): RateLimitState {
  return {
    senderTimestamps: new Map(),
    globalTimestamps: [],
  };
}

export function isRateLimited(state: RateLimitState, senderId: string): boolean {
  const now = Date.now();
  const timestamps = state.senderTimestamps.get(senderId) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  state.senderTimestamps.set(senderId, recent);
  return recent.length >= RATE_LIMIT_MAX_MESSAGES;
}

export function isGlobalRateLimited(state: RateLimitState): boolean {
  const now = Date.now();
  state.globalTimestamps = state.globalTimestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  return state.globalTimestamps.length >= GLOBAL_RATE_LIMIT_MAX;
}
