export interface InboundMessage {
  messageId: string;
  senderId: string;
  senderName?: string;
  text: string;
  timestamp: number;
  isGroup: boolean;
  isFromMe: boolean;
}

export interface MessageTransport {
  on(event: 'message', listener: (msg: InboundMessage) => void): this;
  off(event: 'message', listener: (msg: InboundMessage) => void): this;
  sendMessage(recipientId: string, text: string): Promise<void>;
}

export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_MESSAGES = 10;
export const GLOBAL_RATE_LIMIT_MAX = 30;
export const MAX_TRACKED_SENDERS = 100;
export const SESSION_IDLE_TIMEOUT_MS = 10 * 60_000;

export interface SenderSession {
  sessionId: string;
  lastActivity: number;
}

export interface RateLimitState {
  senderTimestamps: Map<string, number[]>;
  globalTimestamps: number[];
}
