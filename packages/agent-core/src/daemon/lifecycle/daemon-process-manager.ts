import { type ChildProcess, spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import type { DaemonConfig, DaemonProcess } from './daemon-process.interface';
import { DaemonState, isValidTransition } from './daemon-state';
import { DaemonExitCode } from './exit-codes';
import { Logger } from './logger';
import { PidManager } from './pid-manager';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<Omit<DaemonConfig, 'socketPath'>> = {
  pidFilePath: '/var/run/myboteam-daemon.pid',
  shutdownTimeoutMs: 30000,
  maxRestartAttempts: 5,
  baseRestartDelayMs: 1000,
  maxRestartDelayMs: 30000,
  stabilityPeriodMs: 60000,
};

/**
 * Daemon Process Manager
 *
 * Manages the lifecycle of an independent daemon process.
 * Handles starting, stopping, and killing the daemon.
 */
export class DaemonProcessManager extends EventEmitter implements DaemonProcess {
  private config: Required<DaemonConfig>;
  private state: DaemonState = DaemonState.Stopped;
  private process: ChildProcess | null = null;
  private pidManager: PidManager;
  private logger: Logger;
  private startTime: number = 0;
  private restartCount: number = 0;

  constructor(config: DaemonConfig) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.pidManager = new PidManager(this.config.pidFilePath);
    this.logger = new Logger('DaemonProcessManager');
  }

  /**
   * Start the daemon as an independent process
   */
  async start(): Promise<void> {
    this.logger.info('Starting daemon');

    // Check if already running
    if (this.state === DaemonState.Running || this.state === DaemonState.Starting) {
      this.logger.warn('Daemon is already running');
      throw new Error('Daemon is already running');
    }

    // Check if daemon is already running via PID file
    const isRunning = await this.pidManager.isDaemonRunning();
    if (isRunning) {
      this.logger.warn('Daemon is already running (PID file exists)');
      throw new Error('Daemon is already running (PID file exists)');
    }

    // Clean up stale PID file
    const cleanedStale = await this.pidManager.cleanupStalePid();
    if (cleanedStale) {
      this.logger.info('Cleaned up stale PID file');
    }

    this.setState(DaemonState.Starting);

    try {
      // Spawn daemon as independent process
      this.process = spawn(process.execPath, ['--daemon', this.config.socketPath], {
        detached: true,
        stdio: 'ignore',
      });

      if (!this.process.pid) {
        throw new Error('Failed to get daemon process ID');
      }

      this.logger.info('Daemon process spawned', { pid: this.process.pid });

      // Write PID file
      await this.pidManager.writePid(this.process.pid);
      this.startTime = Date.now();

      // Handle process exit
      this.process.on('exit', (code, signal) => {
        this.handleProcessExit(code, signal);
      });

      // Handle process error
      this.process.on('error', (error) => {
        this.logger.error('Daemon process error', { error: error.message });
        this.emit('error', error);
      });

      // Unref the process so parent can exit independently
      this.process.unref();

      this.setState(DaemonState.Running);
      this.logger.info('Daemon started successfully', { pid: this.process.pid });
      this.emit('start', this.process.pid);
    } catch (error) {
      this.logger.error('Failed to start daemon', { error: (error as Error).message });
      this.setState(DaemonState.Stopped);
      await this.pidManager.removePid();
      throw error;
    }
  }

  /**
   * Initiate graceful shutdown
   */
  async stop(): Promise<void> {
    this.logger.info('Initiating graceful shutdown');

    if (this.state === DaemonState.Stopped) {
      this.logger.debug('Daemon already stopped');
      return;
    }

    if (this.state === DaemonState.Draining) {
      // Already shutting down, ignore
      this.logger.debug('Shutdown already in progress, ignoring');
      return;
    }

    this.setState(DaemonState.Draining);
    this.emit('shutdownStart');

    try {
      // Send SIGTERM to daemon
      if (this.process?.pid) {
        this.logger.info('Sending SIGTERM to daemon', { pid: this.process.pid });
        process.kill(this.process.pid, 'SIGTERM');
      }

      // Wait for process to exit with timeout
      await this.waitForExit(this.config.shutdownTimeoutMs);
      this.logger.info('Daemon shutdown completed');
    } catch {
      this.logger.warn('Shutdown timeout reached, forcing kill');
      // Force kill on timeout
      await this.kill();
    } finally {
      this.process = null;
      await this.pidManager.removePid();
      try {
        this.setState(DaemonState.Stopped);
      } catch {
        // State may already be Stopped (e.g., from kill() in catch block)
      }
      this.emit('stop');
    }
  }

  /**
   * Force kill the daemon immediately
   */
  async kill(): Promise<void> {
    this.logger.info('Force killing daemon');

    if (this.state === DaemonState.Stopped && !this.process) {
      this.logger.debug('Daemon already stopped');
      return;
    }

    try {
      if (this.process?.pid) {
        this.logger.info('Sending SIGKILL to daemon', { pid: this.process.pid });
        process.kill(this.process.pid, 'SIGKILL');
      }
    } catch {
      this.logger.debug('Process may already be dead');
    }

    this.process = null;
    await this.pidManager.removePid();
    this.startTime = 0;
    if (this.state !== DaemonState.Stopped) {
      this.setState(DaemonState.Stopped);
    }
    this.emit('kill');
  }

  /**
   * Restart the daemon
   */
  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  /**
   * Check if the daemon is running
   */
  isRunning(): boolean {
    return (
      (this.state === DaemonState.Running || this.state === DaemonState.Starting) &&
      this.process !== null
    );
  }

  /**
   * Get the current daemon state
   */
  getState(): DaemonState {
    return this.state;
  }

  /**
   * Get the daemon process ID
   */
  getPid(): number | null {
    if (this.process?.pid) {
      return this.process.pid;
    }
    return null;
  }

  /**
   * Get the daemon uptime in milliseconds
   */
  getUptime(): number {
    if (!this.isRunning() || this.startTime === 0) {
      return 0;
    }
    return Date.now() - this.startTime;
  }

  /**
   * Handle process exit
   */
  private handleProcessExit(code: number | null, signal: NodeJS.Signals | null): void {
    const wasRunning = this.state === DaemonState.Running;
    this.process = null;

    const exitCode = code ?? DaemonExitCode.Crash;
    const exitSignal = signal ?? 'unknown';

    this.logger.info('Daemon process exited', { code: exitCode, signal: exitSignal });
    this.emit('exit', { code: exitCode, signal: exitSignal });

    if (wasRunning) {
      this.setState(DaemonState.Stopped);
      this.logger.warn('Daemon crashed, scheduling restart');
      this.handleCrashRestart(exitCode);
    }
  }

  /**
   * Handle crash restart with exponential backoff
   */
  private handleCrashRestart(exitCode: number): void {
    // Don't restart on certain exit codes
    if (exitCode === DaemonExitCode.Success) {
      this.logger.info('Daemon exited successfully, not restarting');
      return;
    }

    // Check if we've exceeded max restart attempts
    if (this.restartCount >= this.config.maxRestartAttempts) {
      this.logger.error('Max restart attempts reached', { attempts: this.restartCount });
      this.emit('maxRestartsReached', this.restartCount);
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.config.baseRestartDelayMs * 2 ** this.restartCount,
      this.config.maxRestartDelayMs,
    );

    this.restartCount++;
    this.logger.info('Scheduling restart', { delay, attempt: this.restartCount });
    this.emit('restartScheduled', { delay, attempt: this.restartCount });

    // Schedule restart
    setTimeout(async () => {
      try {
        this.logger.info('Attempting restart');
        await this.start();
        this.logger.info('Restart successful');
        this.emit('restartComplete');
      } catch (error) {
        this.logger.error('Restart failed', { error: (error as Error).message });
        this.emit('restartFailed', error);
      }
    }, delay);
  }

  /**
   * Wait for process to exit
   */
  private waitForExit(timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.process) {
        resolve();
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error('Timeout waiting for process to exit'));
      }, timeoutMs);

      this.process.on('exit', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  /**
   * Set daemon state
   */
  private setState(newState: DaemonState): void {
    if (!isValidTransition(this.state, newState)) {
      throw new Error(`Invalid state transition: ${this.state} → ${newState}`);
    }

    const oldState = this.state;
    this.state = newState;
    this.emit('stateChange', newState, oldState);
  }

  /**
   * Reset restart count (called after stability period)
   */
  resetRestartCount(): void {
    this.restartCount = 0;
  }

  /**
   * Get restart count
   */
  getRestartCount(): number {
    return this.restartCount;
  }
}
