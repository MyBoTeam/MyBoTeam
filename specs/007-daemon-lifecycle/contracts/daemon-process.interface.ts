import type { DaemonState } from './daemon-state.enum';

/**
 * DaemonProcess - Background process that runs independently of host application
 */
export interface DaemonProcess {
  /** OS process ID */
  readonly pid: number;

  /** Path to Unix domain socket */
  readonly socketPath: string;

  /** Current lifecycle state */
  state: DaemonState;

  /** When daemon was started (ISO-8601 timestamp) */
  readonly startTime: string;

  /** Graceful shutdown timeout in milliseconds (default: 30000) */
  readonly shutdownTimeout: number;

  /** Process exit code (null if running) */
  exitCode: number | null;
}

/**
 * DaemonProcessManager - Manages daemon process lifecycle
 */
export interface DaemonProcessManager {
  /**
   * Start daemon as independent process
   * @returns PID of started daemon
   * @throws Error if daemon fails to start
   */
  start(): Promise<number>;

  /**
   * Stop daemon gracefully (SIGTERM with timeout)
   * @param timeout Optional override for shutdown timeout
   * @returns true if stopped gracefully, false if force-killed
   */
  stop(timeout?: number): Promise<boolean>;

  /**
   * Force kill daemon immediately (SIGKILL)
   */
  kill(): Promise<void>;

  /**
   * Check if daemon is running
   */
  isRunning(): boolean;

  /**
   * Get current daemon state
   */
  getState(): DaemonState;
}
