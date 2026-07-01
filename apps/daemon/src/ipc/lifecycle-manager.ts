import type { DaemonStatus } from '@myboteam/agent-core/ipc/models/daemon-status.js';
import {
  createDaemonStatus,
  updateDaemonStatus,
} from '@myboteam/agent-core/ipc/models/daemon-status.js';
import type { IpcBusServer } from './ipc-bus-server.js';
import { createChildLogger } from './logger.js';

const log = createChildLogger('lifecycle-manager');

export class LifecycleManager {
  private server: IpcBusServer;
  private status: DaemonStatus;
  private shutdownPromise: Promise<void> | null = null;

  constructor(server: IpcBusServer) {
    this.server = server;
    this.status = createDaemonStatus();
  }

  getStatus(): DaemonStatus {
    return updateDaemonStatus(this.status, {
      connectedClients: this.server.hasConnectedClients() ? 1 : 0,
    });
  }

  async shutdown(timeoutMs = 5000): Promise<void> {
    if (this.status.isShuttingDown) {
      log.warn('Shutdown already in progress');
      return;
    }

    if (this.shutdownPromise) {
      return this.shutdownPromise;
    }

    this.status = updateDaemonStatus(this.status, { isShuttingDown: true });
    log.info('Shutdown initiated', { timeoutMs });

    this.shutdownPromise = this.performShutdown(timeoutMs);
    return this.shutdownPromise;
  }

  private async performShutdown(timeoutMs: number): Promise<void> {
    const startTime = Date.now();

    try {
      // Wait for pending operations with timeout
      await this.drainWithTimeout(timeoutMs);
    } catch (error) {
      log.error('Error during drain', { error: String(error) });
    }

    // CDR-2026-061: Use socket.destroy() for immediate cleanup
    await this.server.stop();

    const durationMs = Date.now() - startTime;
    log.info('Shutdown complete', { durationMs });
  }

  private drainWithTimeout(timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
      const deadline = Date.now() + timeoutMs;

      const check = () => {
        if (!this.server.hasConnectedClients() || Date.now() >= deadline) {
          resolve();
          return;
        }

        setTimeout(check, 100);
      };

      check();
    });
  }
}

export function createLifecycleManager(server: IpcBusServer): LifecycleManager {
  return new LifecycleManager(server);
}
