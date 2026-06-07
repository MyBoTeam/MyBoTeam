import type { InboundMessage, MessageTransport } from './task-bridge-rate-limit.js';

export const MAX_MESSAGE_LENGTH = 4096;

export type { InboundMessage, MessageTransport };

export function isLidUser(jid: string): boolean {
  return jid.endsWith('@lid');
}
