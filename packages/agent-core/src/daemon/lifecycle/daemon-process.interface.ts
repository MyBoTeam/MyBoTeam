import type { DaemonState } from './daemon-state';

/**
 * Configuration for daemon process
 *
 * @interface DaemonConfig
 * @description Configuration options for the daemon process manager
 */
export interface DaemonConfig {
  /** Path to the Unix domain socket */
  socketPath: string;

  /** Path to the PID file (default: /var/run/myboteam-daemon.pid) */
  pidFilePath?: string;

  /** Graceful shutdown timeout in milliseconds (default: 30000) */
  shutdownTimeoutMs?: number;

  /** Maximum restart attempts before requiring manual intervention */
  maxRestartAttempts?: number;

  /** Base delay for exponential backoff in milliseconds */
  baseRestartDelayMs?: number;

  /** Maximum delay for exponential backoff in milliseconds */
  maxRestartDelayMs?: number;

  /** Stability period in milliseconds before resetting backoff */
  stabilityPeriodMs?: number;
}

/**
 * Daemon process lifecycle manager interface
 *
 * @interface DaemonProcess
 * @description Interface for managing the lifecycle of an independent daemon process
 */
export interface DaemonProcess {
  /**
   * Start the daemon as an independent process
   *
   * @returns Promise that resolves when daemon is started
   * @throws Error if daemon fails to start
   * @example
   * ```typescript
   * const daemon = new DaemonProcessManager(config);
   * await daemon.start();
   * console.log('Daemon started with PID:', daemon.getPid());
   * ```
   */
  start(): Promise<void>;

  /**
   * Initiate graceful shutdown
   * @returns Promise that resolves when daemon has stopped
   */
  stop(): Promise<void>;

  /**
   * Force kill the daemon immediately
   * @returns Promise that resolves when daemon is killed
   */
  kill(): Promise<void>;

  /**
   * Restart the daemon
   * @returns Promise that resolves when daemon is restarted
   */
  restart(): Promise<void>;

  /**
   * Check if the daemon is running
   * @returns True if daemon is running
   */
  isRunning(): boolean;

  /**
   * Get the current daemon state
   * @returns Current daemon state
   */
  getState(): DaemonState;

  /**
   * Get the daemon process ID
   * @returns Process ID or null if not running
   */
  getPid(): number | null;

  /**
   * Get the daemon uptime in milliseconds
   * @returns Uptime in milliseconds or 0 if not running
   */
  getUptime(): number;

  /**
   * Register event listener for daemon lifecycle events
   * @param event Event name
   * @param listener Event handler
   */
  on(event: string, listener: (...args: unknown[]) => void): void;

  /**
   * Remove event listener
   * @param event Event name
   * @param listener Event handler
   */
  off(event: string, listener: (...args: unknown[]) => void): void;
}
