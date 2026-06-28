/**
 * DaemonRpcServer - JSON-RPC 2.0 server over Unix domain socket / Windows named pipe.
 * Handles concurrent client connections with request/response correlation.
 *
 * Source: v0.2.0 rpc-server.ts lines 27-60, Accomplish rpc-server.ts lines 33-54
 * Note: Authentication and rate limiting removed (local trust model)
 */

import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { createServer, type Server, type Socket } from 'node:net';
import { createChildLogger } from './logger.js';
import { NdjsonBuffer } from './ndjson-buffer.js';
import { type AnyMethodHandler, handleRpcLine } from './rpc-message-handler.js';
import { getSocketPath } from './socket-path.js';

export interface DaemonRpcServerOptions {
  /** Override the default Unix socket / named pipe path. */
  socketPath?: string;
  /** Callback when a client connects. */
  onConnection?: (clientId: string) => void;
  /** Callback when a client disconnects. */
  onDisconnection?: (clientId: string) => void;
}

interface ConnectedClient {
  id: string;
  socket: Socket;
  buffer: NdjsonBuffer;
}

export class DaemonRpcServer {
  private readonly socketPath: string;
  private readonly onConnection?: (clientId: string) => void;
  private readonly onDisconnection?: (clientId: string) => void;
  private readonly log = createChildLogger('DaemonRpcServer');

  private server: Server | null = null;
  private clients = new Map<string, ConnectedClient>();
  private handlers = new Map<string, AnyMethodHandler>();
  private startTime = Date.now();

  constructor(options: DaemonRpcServerOptions = {}) {
    this.socketPath = options.socketPath ?? getSocketPath();
    this.onConnection = options.onConnection;
    this.onDisconnection = options.onDisconnection;

    // Register built-in health check
    this.registerMethod('daemon.ping', () => ({
      status: 'ok' as const,
      uptime: Date.now() - this.startTime,
      services: Array.from(this.handlers.keys()),
    }));
  }

  /**
   * Register a handler for a JSON-RPC method.
   */
  registerMethod(method: string, handler: AnyMethodHandler): void {
    this.handlers.set(method, handler);
  }

  /**
   * Whether any clients are currently connected.
   * Used to fast-fail permission requests when no UI can respond.
   */
  hasConnectedClients(): boolean {
    for (const client of this.clients.values()) {
      if (!client.socket.destroyed) {
        return true;
      }
    }
    return false;
  }

  /**
   * Push a notification to all connected clients.
   */
  notify(method: string, params: unknown): void {
    const notification = { jsonrpc: '2.0' as const, method, params };
    const data = `${JSON.stringify(notification)}\n`;
    for (const client of this.clients.values()) {
      if (!client.socket.destroyed) {
        client.socket.write(data);
      }
    }
  }

  /**
   * Start listening on the socket path.
   * Removes any stale socket file before binding.
   */
  async start(): Promise<void> {
    // Remove stale socket
    await this.removeStaleSocket();

    return new Promise<void>((resolve, reject) => {
      this.server = createServer((socket) => {
        const clientId = randomUUID();
        const client: ConnectedClient = { id: clientId, socket, buffer: new NdjsonBuffer() };
        this.clients.set(clientId, client);
        this.onConnection?.(clientId);

        socket.setEncoding('utf8');

        socket.on('data', (chunk: string) => {
          const lines = client.buffer.append(chunk);
          if (lines === null) {
            socket.destroy(new Error('Buffer overflow: message exceeds maximum size'));
            return;
          }
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed) {
              handleRpcLine(client, trimmed, this.handlers).catch((err) => {
                this.log.error({ clientId, error: err.message }, 'Unhandled error in RPC handler');
              });
            }
          }
        });

        socket.on('close', () => {
          this.clients.delete(clientId);
          this.onDisconnection?.(clientId);
        });

        socket.on('error', (err) => {
          this.log.error({ clientId, error: err.message }, 'Socket error');
          this.clients.delete(clientId);
        });
      });

      this.server.on('error', reject);

      this.server.listen(this.socketPath, () => {
        resolve();
      });
    });
  }

  /**
   * Stop the server and disconnect all clients.
   * Immediate close: destroy sockets without waiting for pending writes.
   */
  async stop(): Promise<void> {
    // Immediate close - destroy all sockets
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

  private async removeStaleSocket(): Promise<void> {
    try {
      await unlink(this.socketPath);
    } catch {
      // File doesn't exist — that's fine
    }
  }
}
