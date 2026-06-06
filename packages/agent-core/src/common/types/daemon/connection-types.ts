import type { JsonRpcMessage } from './daemon-types.js';

export interface DaemonTransport {
  send(message: JsonRpcMessage): void;
  onMessage(handler: (message: JsonRpcMessage) => void): void;
  close(): void;
}

export type DaemonConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
