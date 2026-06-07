import { randomUUID } from 'node:crypto';
import { createServer, type Server, type Socket } from 'node:net';
import { type AnyMethodHandler, handleRpcLine } from './rpc-message-handler.js';
import { getSocketPath } from './socket-path.js';

export interface DaemonRpcServerOptions {
  socketPath?: string;
  onConnection?: (clientId: string) => void;
  onDisconnection?: (clientId: string) => void;
}

interface ConnectedClient {
  id: string;
  socket: Socket;
  buffer: string;
}

export class DaemonRpcServer {
  private readonly socketPath: string;
  private readonly onConnection?: (clientId: string) => void;
  private readonly onDisconnection?: (clientId: string) => void;

  private server: Server | null = null;
  private clients = new Map<string, ConnectedClient>();
  private handlers = new Map<string, AnyMethodHandler>();
  private startTime = Date.now();

  constructor(options: DaemonRpcServerOptions = {}) {
    this.socketPath = options.socketPath ?? getSocketPath();
    this.onConnection = options.onConnection;
    this.onDisconnection = options.onDisconnection;

    this.registerMethod('daemon.ping', () => ({
      status: 'ok' as const,
      uptime: Date.now() - this.startTime,
      buildId: process.env.MYBOTEAM_BUILD_ID,
    }));
  }

  registerMethod(method: string, handler: AnyMethodHandler): void {
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

  notify(method: string, params: any): void {
    const notification = { jsonrpc: '2.0' as const, method, params };
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
              void handleRpcLine(client, trimmed, this.handlers);
            }
          }
        });

        socket.on('close', () => {
          this.clients.delete(clientId);
          this.onDisconnection?.(clientId);
        });

        socket.on('error', (_err) => {
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
    const { unlink } = await import('node:fs/promises');
    try {
      await unlink(this.socketPath);
    } catch {}
  }
}
