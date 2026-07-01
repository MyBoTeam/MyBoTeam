import { EventEmitter } from 'node:events';
import { Logger } from './logger';
import type {
  ShutdownManager as IShutdownManager,
  ShutdownStats,
} from './shutdown-manager.interface';

/**
 * Shutdown Manager configuration
 */
export interface ShutdownManagerConfig {
  /** Shutdown timeout in milliseconds (default: 30000) */
  shutdownTimeoutMs: number;

  /** Function to force kill the daemon */
  forceKillFn: () => Promise<void>;

  /** Function to drain active tasks */
  drainTasksFn: () => Promise<number>;

  /** Function to cleanup resources */
  cleanupResourcesFn: () => Promise<void>;
}

/**
 * Shutdown Manager
 *
 * Coordinates graceful shutdown with 30s timeout.
 * Handles task draining, resource cleanup, and force kill on timeout.
 */
export class ShutdownManager extends EventEmitter implements IShutdownManager {
  private config: ShutdownManagerConfig;
  private shuttingDown: boolean = false;
  private stats: ShutdownStats;
  private logger: Logger;

  constructor(config: ShutdownManagerConfig) {
    super();
    this.config = config;
    this.logger = new Logger('ShutdownManager');
    this.stats = this.createInitialStats();
  }

  /**
   * Initiate graceful shutdown
   */
  async initiateShutdown(): Promise<void> {
    if (this.shuttingDown) {
      this.logger.debug('Shutdown already in progress, ignoring subsequent signal');
      return;
    }

    this.shuttingDown = true;
    this.stats.initiatedAt = Date.now();
    this.logger.info('Initiating graceful shutdown');
    this.emit('start');

    try {
      // Drain active tasks
      const tasksDrained = await this.drainTasksWithTimeout();
      this.stats.tasksDrained = tasksDrained;

      // Only complete graceful path if not already forced by timeout
      if (!this.stats.wasForced) {
        // Cleanup resources
        await this.config.cleanupResourcesFn();

        // Complete shutdown
        this.stats.completedAt = Date.now();
        this.logger.info('Graceful shutdown completed', { tasksDrained });
        this.emit('complete', this.stats);
      }
    } catch (error) {
      this.logger.error('Error during shutdown', { error: (error as Error).message });
      await this.forceShutdown();
    } finally {
      this.shuttingDown = false;
    }
  }

  /**
   * Force immediate shutdown
   */
  async forceShutdown(): Promise<void> {
    this.logger.info('Force shutdown initiated');
    this.stats.wasForced = true;
    this.stats.completedAt = Date.now();

    try {
      await this.config.forceKillFn();
    } catch (error) {
      this.logger.error('Error during force shutdown', { error: (error as Error).message });
    }

    this.emit('force', this.stats);
    this.shuttingDown = false;
  }

  /**
   * Check if shutdown is in progress
   */
  isShuttingDown(): boolean {
    return this.shuttingDown;
  }

  /**
   * Get shutdown statistics
   */
  getStats(): ShutdownStats {
    return { ...this.stats };
  }

  /**
   * Drain tasks with timeout
   */
  private async drainTasksWithTimeout(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.logger.warn('Task drain timeout reached, forcing shutdown');
        this.forceShutdown()
          .then(() => resolve(0))
          .catch(reject);
      }, this.config.shutdownTimeoutMs);

      this.config
        .drainTasksFn()
        .then((tasksDrained) => {
          clearTimeout(timer);
          resolve(tasksDrained);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Create initial shutdown stats
   */
  private createInitialStats(): ShutdownStats {
    return {
      initiatedAt: 0,
      completedAt: undefined,
      tasksDrained: 0,
      tasksAborted: 0,
      tasksDiscarded: 0,
      wasForced: false,
      exitCode: 0,
    };
  }
}
