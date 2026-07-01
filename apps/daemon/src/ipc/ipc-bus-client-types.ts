import type { JsonRpcMessage } from '@myboteam/agent-core/ipc/types.js';

export type MessageHandler = (message: JsonRpcMessage) => void;
export type DisconnectHandler = () => void;

export interface PendingCall {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}
