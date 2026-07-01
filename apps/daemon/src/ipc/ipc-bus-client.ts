import { connect, type Socket } from 'node:net';
import type {
  DaemonTransport,
  IpcBusClientOptions,
  JsonRpcMessage,
  JsonRpcRequest,
  JsonRpcResponse,
} from '@myboteam/agent-core/ipc/types.js';
import type { DisconnectHandler, MessageHandler, PendingCall } from './ipc-bus-client-types.js';
import { getDefaultSocketPath } from './socket-path.js';

const MAX_BUFFER_BYTES = 1 * 1024 * 1024;

function connectToSocket(socketPath: string, timeoutMs: number): Promise<Socket> {
  return new Promise<Socket>((resolve, reject) => {
    const socket = connect({ path: socketPath }, () => {
      clearTimeout(timer);
      resolve(socket);
    });

    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Socket connection timeout after ${timeoutMs}ms: ${socketPath}`));
    }, timeoutMs);

    socket.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export class IpcBusClient implements DaemonTransport {
  private readonly socketPath: string;
  private readonly connectTimeout: number;

  private socket: Socket | null = null;
  private buffer = '';
  private closed = false;
  private messageHandlers: MessageHandler[] = [];
  private disconnectHandlers: DisconnectHandler[] = [];
  private pendingCalls = new Map<string | number, PendingCall>();
  private idCounter = 0;

  constructor(options: IpcBusClientOptions = {}) {
    this.socketPath = options.socketPath ?? getDefaultSocketPath();
    this.connectTimeout = options.connectTimeout ?? 5000;
  }

  async connect(): Promise<void> {
    this.socket = await connectToSocket(this.socketPath, this.connectTimeout);
    this.setupSocketHandlers();
  }

  send(message: JsonRpcMessage): void {
    if (this.closed || !this.socket || this.socket.destroyed) {
      return;
    }
    const data = `${JSON.stringify(message)}\n`;
    this.socket.write(data);
  }

  async call<TResult = unknown>(
    method: string,
    params?: unknown,
    timeoutMs = 5000,
  ): Promise<TResult> {
    const id = ++this.idCounter;
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise<TResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingCalls.delete(id);
        reject(new Error(`RPC call timeout after ${timeoutMs}ms: ${method}`));
      }, timeoutMs);

      this.pendingCalls.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timer,
      });

      this.send(request);
    });
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  onDisconnect(handler: DisconnectHandler): void {
    this.disconnectHandlers.push(handler);
  }

  close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.messageHandlers.length = 0;
    this.disconnectHandlers.length = 0;

    for (const pending of this.pendingCalls.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Connection closed'));
    }
    this.pendingCalls.clear();

    if (this.socket && !this.socket.destroyed) {
      this.socket.destroy();
    }
  }

  get isConnected(): boolean {
    return !this.closed && this.socket !== null && !this.socket.destroyed;
  }

  private setupSocketHandlers(): void {
    if (!this.socket) {
      return;
    }

    this.socket.setEncoding('utf8');

    this.socket.on('data', (chunk: string) => {
      if (this.closed) {
        return;
      }

      this.buffer += chunk;

      if (this.buffer.length > MAX_BUFFER_BYTES) {
        this.socket?.destroy();
        return;
      }

      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }
        try {
          const message = JSON.parse(trimmed) as JsonRpcMessage;
          this.handleMessage(message);
        } catch {
          // Ignore parse errors for notifications
        }
      }
    });

    this.socket.on('close', () => {
      if (!this.closed) {
        this.closed = true;
        for (const handler of this.disconnectHandlers) {
          handler();
        }
      }
    });

    this.socket.on('error', () => {
      if (!this.closed) {
        this.closed = true;
        this.socket?.destroy();
        for (const handler of this.disconnectHandlers) {
          handler();
        }
      }
    });
  }

  private handleMessage(message: JsonRpcMessage): void {
    if (this.isResponse(message)) {
      const pending = this.pendingCalls.get(message.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingCalls.delete(message.id);
        if (message.error) {
          pending.reject(new Error(message.error.message));
        } else {
          pending.resolve(message.result);
        }
      }
    } else {
      for (const handler of this.messageHandlers) {
        handler(message);
      }
    }
  }

  private isResponse(message: JsonRpcMessage): message is JsonRpcResponse {
    return 'id' in message && ('result' in message || 'error' in message);
  }
}
