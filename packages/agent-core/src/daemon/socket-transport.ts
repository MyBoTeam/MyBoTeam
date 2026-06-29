/**
 * SocketTransport - Client-side transport for JSON-RPC communication.
 * Connects to a Unix domain socket or Windows named pipe.
 *
 * Source: v0.2.0 socket-transport.ts lines 10-89
 * Note: Authentication removed (local trust model for v0.5.0)
 */

import { connect } from 'node:net';
import { createChildLogger } from './logger.js';
import { NdjsonBuffer } from './ndjson-buffer.js';
import type { DaemonTransport } from './transport.js';

const log = createChildLogger('SocketTransport');

const MAX_MESSAGE_SIZE = 1_048_576; // 1MB
const CONNECTION_TIMEOUT_MS = 10_000;

export function createSocketTransport(socketPath: string): Promise<DaemonTransport> {
  return new Promise((resolve, reject) => {
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    let resolved = false;

    const cleanup = () => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }
    };

    const socket = connect(socketPath);

    const onConnect = () => {
      if (resolved) return;

      resolved = true;
      cleanup();
      socket.removeListener('error', onError);

      // Set encoding for consistent string handling (matches server-side)
      socket.setEncoding('utf8');

      let currentMessageHandler: ((data: string) => void) | null = null;
      const buffer = new NdjsonBuffer(MAX_MESSAGE_SIZE);

      // Keep a persistent internal error handler for socket failures
      socket.on('error', (err) => {
        log.error({ error: err.message }, 'Socket error after connect');
      });

      socket.on('data', (chunk: string) => {
        const lines = buffer.append(chunk);
        if (lines === null) {
          socket.destroy(new Error('Buffer overflow: message exceeds maximum size'));
          return;
        }
        for (const line of lines) {
          if (line.trim() && currentMessageHandler) {
            currentMessageHandler(line);
          }
        }
      });

      const transport: DaemonTransport = {
        send(message: string) {
          if (Buffer.byteLength(message, 'utf8') > MAX_MESSAGE_SIZE) {
            socket.destroy(new Error('Message exceeds maximum size limit'));
            return;
          }
          socket.write(`${message}\n`);
        },
        onMessage(handler: (data: string) => void) {
          currentMessageHandler = handler;
        },
        onDisconnect(handler: () => void) {
          socket.once('close', handler);
          socket.once('error', handler);
        },
        onError(handler: (error: Error) => void) {
          socket.on('error', handler);
        },
        close() {
          socket.end();
        },
      };
      resolve(transport);
    };

    const onError = (err: Error) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      socket.removeListener('connect', onConnect);
      socket.destroy();
      reject(err);
    };

    const onTimeout = () => {
      if (resolved) return;
      resolved = true;
      timeoutHandle = null;
      socket.removeListener('connect', onConnect);
      socket.removeListener('error', onError);
      socket.destroy();
      reject(new Error('Connection timeout'));
    };

    socket.once('connect', onConnect);
    socket.once('error', onError);
    timeoutHandle = setTimeout(onTimeout, CONNECTION_TIMEOUT_MS);
  });
}
