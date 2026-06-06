/**
 * Daemon module — public exports
 *
 * Provides RPC infrastructure for the standalone daemon architecture:
 * - DaemonServer / DaemonClient: JSON-RPC 2.0 typed server and client
 * - DaemonRpcServer: socket-based server (Unix socket / Windows named pipe)
 * - Transport abstractions: socket, in-process (testing), IPC (alternative)
 * - Socket/PID path resolution, PID lock, crash handlers
 */

export type { DaemonClientOptions } from './client.js';
export { DaemonClient } from './client.js';
export { createChildProcessTransport, createParentProcessTransport } from './ipc-transport.js';
export type { DaemonServerOptions } from './server.js';
export { DaemonServer } from './server.js';
export { createInProcessTransportPair } from './transport.js';

// Scheduler logic lives in apps/daemon/src/scheduler-service.ts (persistence-backed).
// Types in common/types/daemon.ts.

export { installCrashHandlers } from './crash-handlers.js';
export { logger } from './logger.js';
export type { PidLockHandle, PidLockPayload } from './pid-lock.js';
export { acquirePidLock, PidLockError } from './pid-lock.js';
export type { DaemonRpcServerOptions } from './rpc-server.js';
export { DaemonRpcServer } from './rpc-server.js';
export { getDaemonDir, getPidFilePath, getSocketPath } from './socket-path.js';
export type { SocketTransportOptions } from './socket-transport.js';
export { createSocketTransport } from './socket-transport.js';
