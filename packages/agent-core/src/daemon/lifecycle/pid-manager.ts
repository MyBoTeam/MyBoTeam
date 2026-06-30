import { access, readFile, unlink, writeFile } from 'node:fs/promises';

/**
 * PID Manager for daemon single instance enforcement
 *
 * Manages the PID file to ensure only one instance of the daemon is running.
 */
export class PidManager {
  private pidFilePath: string;
  private currentPid: number | null = null;

  constructor(pidFilePath: string) {
    this.pidFilePath = pidFilePath;
  }

  /**
   * Write PID file with current process ID
   * @param pid Process ID to write
   */
  async writePid(pid: number): Promise<void> {
    this.currentPid = pid;
    await writeFile(this.pidFilePath, pid.toString(), 'utf-8');
  }

  /**
   * Read PID from file
   * @returns Process ID or null if file doesn't exist
   */
  async readPid(): Promise<number | null> {
    try {
      const content = await readFile(this.pidFilePath, 'utf-8');
      const pid = parseInt(content.trim(), 10);
      if (Number.isNaN(pid)) {
        return null;
      }
      return pid;
    } catch {
      return null;
    }
  }

  /**
   * Remove PID file
   */
  async removePid(): Promise<void> {
    try {
      await unlink(this.pidFilePath);
    } catch {
      // Ignore errors if file doesn't exist
    }
    this.currentPid = null;
  }

  /**
   * Check if PID file exists
   * @returns True if PID file exists
   */
  async exists(): Promise<boolean> {
    try {
      await access(this.pidFilePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a process with the given PID is running
   * @param pid Process ID to check
   * @returns True if process is running
   */
  async isProcessRunning(pid: number): Promise<boolean> {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if daemon is already running
   * @returns True if daemon is running (PID file exists and process is alive)
   */
  async isDaemonRunning(): Promise<boolean> {
    const pid = await this.readPid();
    if (pid === null) {
      return false;
    }
    return this.isProcessRunning(pid);
  }

  /**
   * Get the current PID from the file
   * @returns Current PID or null
   */
  getCurrentPid(): number | null {
    return this.currentPid;
  }

  /**
   * Get the PID file path
   * @returns PID file path
   */
  getPidFilePath(): string {
    return this.pidFilePath;
  }

  /**
   * Clean up stale PID file
   * Removes PID file if the process is not running
   * @returns True if stale PID file was removed
   */
  async cleanupStalePid(): Promise<boolean> {
    const pid = await this.readPid();
    if (pid === null) {
      return false;
    }

    const isRunning = await this.isProcessRunning(pid);
    if (!isRunning) {
      await this.removePid();
      return true;
    }

    return false;
  }
}
