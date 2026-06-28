/**
 * DaemonTransport interface for JSON-RPC communication.
 * Abstracts socket communication (supports Unix sockets and Windows named pipes).
 *
 * Source: v0.2.0 socket-transport.ts lines 3-8
 */

export interface DaemonTransport {
  /** Send a message to the remote end. */
  send(message: string): void;

  /** Register a handler for incoming messages. */
  onMessage(handler: (data: string) => void): void;

  /** Register a handler for disconnection events. */
  onDisconnect(handler: () => void): void;

  /** Register a handler for transport errors. */
  onError(handler: (error: Error) => void): void;

  /** Close the transport connection. */
  close(): void;
}
