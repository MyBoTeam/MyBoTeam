import { EventEmitter } from 'node:events';
import { Logger } from './logger';

/**
 * Restart Manager configuration
 */
export interface RestartManagerConfig {
  /** Base delay for exponential backoff in milliseconds */
  baseRestartDelayMs: number;

  /** Maximum delay for exponential backoff in milliseconds */
  maxRestartDelayMs: number;

  /** Maximum restart attempts before requiring manual intervention */
  maxRestartAttempts: number;

  /** Stability period in milliseconds before resetting backoff */
  stabilityPeriodMs: number;

  /** Function to restart the daemon */
  restartFn: () => Promise<void>;
}

/**
 * Restart Manager statistics
 */
export interface RestartManagerStats {
  attempts: number;
  currentDelay: number;
  lastRestartTime: number;
}

/**
 * Restart Manager
 *
 * Manages daemon restart with exponential backoff.
 * Resets backoff after stability period.
 */
export class RestartManager extends EventEmitter {
  private config: RestartManagerConfig;
  private attempts: number = 0;
  private currentDelay: number = 0;
  private lastRestartTime: number = 0;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private stabilityTimer: ReturnType<typeof setTimeout> | null = null;
  private logger: Logger;

  constructor(config: RestartManagerConfig) {
    super();
    this.config = config;
    this.logger = new Logger('RestartManager');
  }

  /**
   * Schedule a restart with exponential backoff
   */
  scheduleRestart(): void {
    if (this.attempts >= this.config.maxRestartAttempts) {
      this.logger.error('Max restart attempts reached', { attempts: this.attempts });
      this.emit('maxAttemptsReached', this.attempts);
      return;
    }

    // Calculate delay with exponential backoff
    this.currentDelay = Math.min(
      this.config.baseRestartDelayMs * 2 ** this.attempts,
      this.config.maxRestartDelayMs,
    );

    this.attempts++;
    this.logger.info('Scheduling restart', {
      delay: this.currentDelay,
      attempt: this.attempts,
    });

    this.emit('restartScheduled', {
      delay: this.currentDelay,
      attempt: this.attempts,
    });

    // Clear any existing restart timer
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
    }

    // Schedule restart
    this.restartTimer = setTimeout(async () => {
      try {
        this.logger.info('Attempting restart');
        await this.config.restartFn();
        this.lastRestartTime = Date.now();
        this.logger.info('Restart successful');
        this.emit('restart', { attempt: this.attempts });

        // Start stability timer
        this.startStabilityTimer();
      } catch (error) {
        this.logger.error('Restart failed', { error: (error as Error).message });
        this.emit('restartFailed', error);
      }
    }, this.currentDelay);
  }

  /**
   * Reset backoff after stability period
   */
  resetBackoff(): void {
    this.logger.info('Resetting backoff');
    this.attempts = 0;
    this.currentDelay = 0;
    this.emit('backoffReset');
  }

  /**
   * Stop restart manager
   */
  stop(): void {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (this.stabilityTimer) {
      clearTimeout(this.stabilityTimer);
      this.stabilityTimer = null;
    }
  }

  /**
   * Get restart statistics
   */
  getStats(): RestartManagerStats {
    return {
      attempts: this.attempts,
      currentDelay: this.currentDelay,
      lastRestartTime: this.lastRestartTime,
    };
  }

  /**
   * Start stability timer
   */
  private startStabilityTimer(): void {
    if (this.stabilityTimer) {
      clearTimeout(this.stabilityTimer);
    }

    this.stabilityTimer = setTimeout(() => {
      this.resetBackoff();
    }, this.config.stabilityPeriodMs);
  }
}
