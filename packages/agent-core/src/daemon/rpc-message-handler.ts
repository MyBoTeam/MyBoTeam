/**
 * JSON-RPC 2.0 message parsing and dispatch helpers for DaemonRpcServer.
 *
 * Source: Accomplish rpc-message-handler.ts lines 46-86
 */

import type {
  JsonRpcErrorResponse,
  JsonRpcMessage,
  JsonRpcRequest,
  JsonRpcSuccessResponse,
} from '@myboteam/types';
import { JSON_RPC_ERRORS } from '@myboteam/types';
import { createChildLogger } from './logger.js';

const log = createChildLogger('RpcMessageHandler');

export type AnyMethodHandler = (params: unknown) => Promise<unknown> | unknown;

export interface RpcClient {
  id: string;
  socket: { destroyed: boolean; write: (data: string) => void };
}

/**
 * Send a successful result response to a client.
 */
export function sendResult(client: RpcClient, id: string | number | null, result: unknown): void {
  const response: JsonRpcSuccessResponse = { jsonrpc: '2.0', id, result };
  if (!client.socket.destroyed) {
    client.socket.write(`${JSON.stringify(response)}\n`);
  }
}

/**
 * Send an error response to a client.
 */
export function sendError(
  client: RpcClient,
  id: string | number | null,
  error: { code: number; message: string },
): void {
  const response: JsonRpcErrorResponse = { jsonrpc: '2.0', id, error };
  if (!client.socket.destroyed) {
    client.socket.write(`${JSON.stringify(response)}\n`);
  }
}

/**
 * Parse and dispatch a single JSON-RPC line from a client.
 */
export async function handleRpcLine(
  client: RpcClient,
  line: string,
  handlers: Map<string, AnyMethodHandler>,
): Promise<void> {
  let message: JsonRpcMessage;
  try {
    message = JSON.parse(line) as JsonRpcMessage;
  } catch {
    log.warn({ clientId: client.id }, 'Failed to parse message');
    sendError(client, null, {
      code: JSON_RPC_ERRORS.PARSE_ERROR,
      message: 'Parse error',
    });
    return;
  }

  // Guard: JSON.parse can return primitives (null, number, string)
  if (message === null || typeof message !== 'object' || Array.isArray(message)) {
    sendError(client, null, {
      code: JSON_RPC_ERRORS.INVALID_REQUEST,
      message: 'Invalid request: message must be an object',
    });
    return;
  }

  // Only handle requests (messages with id + method)
  if (!('id' in message) || !('method' in message)) {
    log.debug({ clientId: client.id }, 'Dropped non-request message');
    return;
  }

  const request = message as JsonRpcRequest;
  const handler = handlers.get(request.method);

  if (!handler) {
    sendError(client, request.id as string | number | null, {
      code: JSON_RPC_ERRORS.METHOD_NOT_FOUND,
      message: `Method not found: ${request.method}`,
    });
    return;
  }

  try {
    const result = await handler(request.params);
    sendResult(client, request.id as string | number | null, result);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    log.error({ method: request.method, error: errorMessage }, 'Handler error');
    sendError(client, request.id as string | number | null, {
      code: JSON_RPC_ERRORS.INTERNAL_ERROR,
      message: errorMessage,
    });
  }
}
