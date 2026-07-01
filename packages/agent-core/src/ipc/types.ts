export interface JsonRpcRequest<TParams = unknown> {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: TParams;
}

export interface JsonRpcResponse<TResult = unknown> {
  jsonrpc: '2.0';
  id: string | number;
  result?: TResult;
  error?: JsonRpcError;
}

export interface JsonRpcNotification<TParams = unknown> {
  jsonrpc: '2.0';
  method: string;
  params?: TParams;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export type JsonRpcMessage = JsonRpcRequest | JsonRpcResponse | JsonRpcNotification;

export const JSON_RPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  RENDER_NOT_FOUND: -32000,
  PLUGIN_ERROR: -32001,
  SHUTDOWN_IN_PROGRESS: -32002,
  REQUEST_TOO_LARGE: -32003,
} as const;

export type MethodHandler<TParams = unknown, TResult = unknown> = (
  params: TParams,
  clientId: string,
) => Promise<TResult> | TResult;

export interface DaemonTransport {
  send(message: JsonRpcMessage): void;
  onMessage(handler: (message: JsonRpcMessage) => void): void;
  onDisconnect(handler: () => void): void;
  close(): void;
}

export interface IpcBusServerOptions {
  socketPath?: string;
  onConnection?: (clientId: string) => void;
  onDisconnection?: (clientId: string) => void;
}

export interface IpcBusClientOptions {
  socketPath?: string;
  connectTimeout?: number;
}
