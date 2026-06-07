import type { DaemonNotification, DaemonNotificationMap } from './event-types.js';
import type { JsonRpcNotification, JsonRpcRequest, JsonRpcResponse } from './json-rpc-types.js';
import type { DaemonMethod, DaemonMethodMap } from './method-map.js';

export type {
  HealthCheckResult,
  JsonRpcError,
  JsonRpcMessage,
  JsonRpcNotification,
  JsonRpcRequest,
  JsonRpcResponse,
  WhatsAppDaemonConfig,
} from './json-rpc-types.js';
export { JSON_RPC_ERRORS } from './json-rpc-types.js';

export type { DaemonMethod, DaemonMethodMap } from './method-map.js';

export type TypedJsonRpcRequest<M extends DaemonMethod> = JsonRpcRequest<
  DaemonMethodMap[M]['params']
>;

export type TypedJsonRpcResponse<M extends DaemonMethod> = JsonRpcResponse<
  DaemonMethodMap[M]['result']
>;

export type TypedJsonRpcNotification<N extends DaemonNotification> = JsonRpcNotification<
  DaemonNotificationMap[N]
>;
