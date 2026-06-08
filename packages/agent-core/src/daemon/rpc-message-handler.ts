import type { JsonRpcMessage, JsonRpcRequest, JsonRpcResponse } from '../common/types/daemon.js';
import { JSON_RPC_ERRORS } from '../common/types/daemon.js';

export type AnyMethodHandler = (params: unknown) => Promise<unknown> | unknown;

export interface RpcClient {
  id: string;

  socket: { destroyed: boolean; write: (data: string) => boolean };
  buffer: string;
}

function sendResult(client: RpcClient, id: string | number, result: unknown): void {
  const response: JsonRpcResponse = { jsonrpc: '2.0', id, result };
  if (!client.socket.destroyed) {
    client.socket.write(`${JSON.stringify(response)}\n`);
  }
}

function sendError(
  client: RpcClient,
  id: string | number,
  error: { code: number; message: string },
): void {
  const response: JsonRpcResponse = { jsonrpc: '2.0', id, error };
  if (!client.socket.destroyed) {
    client.socket.write(`${JSON.stringify(response)}\n`);
  }
}

export async function handleRpcLine(
  client: RpcClient,
  line: string,
  handlers: Map<string, AnyMethodHandler>,
): Promise<void> {
  let message: JsonRpcMessage;
  try {
    message = JSON.parse(line) as JsonRpcMessage;
  } catch {
    return;
  }

  if (!('id' in message) || !('method' in message)) {
    return;
  }

  const request = message as JsonRpcRequest;
  const handler = handlers.get(request.method);

  if (!handler) {
    sendError(client, request.id as string | number, {
      code: JSON_RPC_ERRORS.METHOD_NOT_FOUND,
      message: `Method not found: ${request.method}`,
    });
    return;
  }

  try {
    const result = await handler(request.params);
    sendResult(client, request.id as string | number, result);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    if (errorMessage.includes('myboteam_runtime_unavailable')) {
    } else {
    }
    sendError(client, request.id as string | number, {
      code: JSON_RPC_ERRORS.INTERNAL_ERROR,
      message: errorMessage,
    });
  }
}
