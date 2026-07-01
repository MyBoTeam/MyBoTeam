import { EventEmitter } from 'node:events';
import type { DaemonProcess } from './daemon-process.interface';
import { Logger } from './logger';

/**
 * Watchdog configuration
 */
export interface WatchdogConfig {
  /** Health check interval in milliseconds */
  healthCheckIntervalMs: number;

  /** Maximum consecutive failures before emitting crash event */
  maxConsecutiveFailures: number;
}

/**
 * Watchdog statistics
 */
export interface WatchdogStats {
  consecutiveFailures: number;
  lastCheckTime: number;
  totalChecks: number;
}

/**
 * Watchdog
 *
 * Monitors daemon health by periodically checking if the daemon is running.
 * Emits crash event when daemon is detected as crashed.
 */
export class Watchdog extends EventEmitter {
  private daemonProcess: DaemonProcess;
  private config: WatchdogConfig;
  private interval: ReturnType<typeof setInterval> | null = null;
  private consecutiveFailures: number = 0;
  private lastCheckTime: number = 0;
  private totalChecks: number = 0;
  private running: boolean = false;
  private logger: Logger;

  constructor(daemonProcess: DaemonProcess, config: WatchdogConfig) {
    super();
    this.daemonProcess = daemonProcess;
    this.config = config;
    this.logger = new Logger('Watchdog');
  }

  /**
   * Start health monitoring
   */
  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.logger.info('Watchdog started', { interval: this.config.healthCheckIntervalMs });
    this.emit('start');

    this.interval = setInterval(() => {
      this.checkHealth();
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.logger.info('Watchdog stopped');
    this.emit('stop');
  }

  /**
   * Check daemon health
   */
  private checkHealth(): void {
    this.lastCheckTime = Date.now();
    this.totalChecks++;

    const isRunning = this.daemonProcess.isRunning();

    if (isRunning) {
      // Daemon is healthy
      if (this.consecutiveFailures > 0) {
        this.logger.info('Daemon recovered from failures');
        this.consecutiveFailures = 0;
        this.emit('recovered');
      }
    } else {
      // Daemon is not running
      this.consecutiveFailures++;
      this.logger.warn('Daemon health check failed', {
        consecutiveFailures: this.consecutiveFailures,
      });

      if (this.consecutiveFailures >= this.config.maxConsecutiveFailures) {
        if (this.consecutiveFailures === this.config.maxConsecutiveFailures) {
          this.logger.error('Daemon crash detected');
          this.emit('crash', { consecutiveFailures: this.consecutiveFailures });
        }
      }
    }
  }

  /**
   * Check if watchdog is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get consecutive failure count
   */
  getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  /**
   * Get watchdog statistics
   */
  getStats(): WatchdogStats {
    return {
      consecutiveFailures: this.consecutiveFailures,
      lastCheckTime: this.lastCheckTime,
      totalChecks: this.totalChecks,
    };
  }
}
