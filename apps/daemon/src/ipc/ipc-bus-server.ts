import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { createServer, type Server, type Socket } from 'node:net';
import {
  type IpcBusServerOptions,
  JSON_RPC_ERRORS,
  type JsonRpcMessage,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type MethodHandler,
} from '@myboteam/agent-core/ipc/types.js';
import { getDefaultSocketPath } from './socket-path.js';

interface ConnectedClient {
  id: string;
  socket: Socket;
  buffer: string;
}

export class IpcBusServer {
  private readonly socketPath: string;
  private readonly onConnection?: (clientId: string) => void;
  private readonly onDisconnection?: (clientId: string) => void;

  private server: Server | null = null;
  private clients = new Map<string, ConnectedClient>();
  private handlers = new Map<string, MethodHandler>();
  private startTime = Date.now();

  constructor(options: IpcBusServerOptions = {}) {
    this.socketPath = options.socketPath ?? getDefaultSocketPath();
    this.onConnection = options.onConnection;
    this.onDisconnection = options.onDisconnection;

    this.registerMethod('daemon.ping', () => ({
      status: 'ok' as const,
      uptime: Date.now() - this.startTime,
      buildId: process.env.MYBOTEAM_BUILD_ID,
    }));
  }

  registerMethod(method: string, handler: MethodHandler): void {
    this.handlers.set(method, handler);
  }

  hasConnectedClients(): boolean {
    for (const client of this.clients.values()) {
      if (!client.socket.destroyed) {
        return true;
      }
    }
    return false;
  }

  notify(method: string, params: unknown): void {
    const notification: JsonRpcMessage = { jsonrpc: '2.0', method, params };
    const data = `${JSON.stringify(notification)}\n`;
    for (const client of this.clients.values()) {
      if (!client.socket.destroyed) {
        client.socket.write(data);
      }
    }
  }

  async start(): Promise<void> {
    await this.removeStaleSocket();

    return new Promise<void>((resolve, reject) => {
      this.server = createServer((socket) => {
        const clientId = randomUUID();
        const client: ConnectedClient = { id: clientId, socket, buffer: '' };
        this.clients.set(clientId, client);
        this.onConnection?.(clientId);

        socket.setEncoding('utf8');

        socket.on('data', (chunk: string) => {
          client.buffer += chunk;
          const lines = client.buffer.split('\n');
          client.buffer = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed) {
              void this.handleLine(client, trimmed);
            }
          }
        });

        socket.on('close', () => {
          this.clients.delete(clientId);
          this.onDisconnection?.(clientId);
        });

        socket.on('error', () => {
          this.clients.delete(clientId);
        });
      });

      this.server.on('error', reject);

      this.server.listen(this.socketPath, () => {
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    // CDR-2026-061: Use socket.destroy() for immediate cleanup on shutdown
    for (const client of this.clients.values()) {
      client.socket.destroy();
    }
    this.clients.clear();

    return new Promise<void>((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close(() => resolve());
      this.server = null;
    });
  }

  private async handleLine(client: ConnectedClient, line: string): Promise<void> {
    let request: JsonRpcRequest;
    try {
      const parsed = JSON.parse(line) as JsonRpcMessage;
      if (!this.isRequest(parsed)) {
        return;
      }
      request = parsed;
    } catch {
      this.sendError(client, '', JSON_RPC_ERRORS.PARSE_ERROR, 'Parse error');
      return;
    }

    const handler = this.handlers.get(request.method);
    if (!handler) {
      this.sendError(
        client,
        request.id,
        JSON_RPC_ERRORS.METHOD_NOT_FOUND,
        `Method not found: ${request.method}`,
      );
      return;
    }

    try {
      const result = await handler(request.params ?? {}, client.id);
      const response: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: request.id,
        result,
      };
      client.socket.write(`${JSON.stringify(response)}\n`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal error';
      this.sendError(client, request.id, JSON_RPC_ERRORS.INTERNAL_ERROR, message);
    }
  }

  private sendError(
    client: ConnectedClient,
    id: string | number,
    code: number,
    message: string,
  ): void {
    const response: JsonRpcResponse = {
      jsonrpc: '2.0',
      id,
      error: { code, message },
    };
    client.socket.write(`${JSON.stringify(response)}\n`);
  }

  private isRequest(message: JsonRpcMessage): message is JsonRpcRequest {
    return 'method' in message && 'id' in message;
  }

  private async removeStaleSocket(): Promise<void> {
    try {
      await unlink(this.socketPath);
    } catch {
      // Socket doesn't exist, which is fine
    }
  }
}
