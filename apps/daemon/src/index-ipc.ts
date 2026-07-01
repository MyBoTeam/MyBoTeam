import { IpcBusServer } from './ipc/ipc-bus-server.js';
import { LifecycleManager } from './ipc/lifecycle-manager.js';
import { createChildLogger } from './ipc/logger.js';

const log = createChildLogger('daemon-index');

export async function startDaemon(): Promise<void> {
  log.info('Starting daemon...');

  const server = new IpcBusServer();
  const lifecycle = new LifecycleManager(server);

  // Register lifecycle methods
  server.registerMethod('daemon.ping', () => ({
    status: 'ok',
    uptime: Date.now() - startTime,
  }));

  server.registerMethod('daemon.getStatus', () => lifecycle.getStatus());

  server.registerMethod('daemon.shutdown', async (params: unknown) => {
    const { timeoutMs } = (params || {}) as { timeoutMs?: number };
    await lifecycle.shutdown(timeoutMs);
    return { success: true, message: 'Shutdown complete' };
  });

  const startTime = Date.now();

  // CDR-2026-061: Immediate cleanup on shutdown
  const shutdown = async () => {
    log.info('Received shutdown signal');
    await lifecycle.shutdown();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  await server.start();
  log.info('Daemon started', { socketPath: 'default' });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startDaemon().catch((error) => {
    log.error('Failed to start daemon', { error: String(error) });
    process.exit(1);
  });
}
