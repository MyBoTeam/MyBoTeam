import { z } from 'zod';

// =============================================================================
// JSON-RPC 2.0 Base Types
// =============================================================================

export interface JsonRpcRequest<TParams = unknown> {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: TParams;
}

export interface JsonRpcResponse<TResult = unknown> {
  jsonrpc: '2.0';
  id: string | number | null;
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

/** Union of all JSON-RPC message types. */
export type JsonRpcMessage = JsonRpcRequest | JsonRpcResponse | JsonRpcNotification;

// =============================================================================
// Standard JSON-RPC Error Codes
// =============================================================================

export const JSON_RPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

// =============================================================================
// Daemon Event Types (existing)
// =============================================================================

export const DaemonEventTypeSchema = z.enum([
  'agent.started',
  'agent.stopped',
  'agent.error',
  'task.created',
  'task.updated',
  'task.completed',
  'task.failed',
  'mcp.started',
  'mcp.stopped',
  'mcp.error',
  'system.ready',
  'system.shutdown',
]);

export type DaemonEventType = z.infer<typeof DaemonEventTypeSchema>;

export const DaemonEventSchema = z.object({
  id: z.string().uuid(),
  type: DaemonEventTypeSchema,
  source: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).default({}),
  timestamp: z.string().datetime(),
});

export type DaemonEvent = z.infer<typeof DaemonEventSchema>;
