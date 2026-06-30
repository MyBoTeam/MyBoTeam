/**
 * Shutdown statistics
 */
export interface ShutdownStats {
  /** When shutdown was initiated */
  initiatedAt: number;

  /** When shutdown completed */
  completedAt?: number;

  /** Number of tasks drained */
  tasksDrained: number;

  /** Number of tasks aborted */
  tasksAborted: number;

  /** Number of tasks discarded */
  tasksDiscarded: number;

  /** Whether shutdown was forced (timeout exceeded) */
  wasForced: boolean;

  /** Exit code */
  exitCode: number;
}

/**
 * Shutdown manager interface for coordinating graceful shutdown
 */
export interface ShutdownManager {
  /**
   * Initiate graceful shutdown
   * @returns Promise that resolves when shutdown is complete
   */
  initiateShutdown(): Promise<void>;

  /**
   * Force immediate shutdown (SIGKILL)
   * @returns Promise that resolves when daemon is killed
   */
  forceShutdown(): Promise<void>;

  /**
   * Check if shutdown is in progress
   * @returns True if shutdown is in progress
   */
  isShuttingDown(): boolean;

  /**
   * Get shutdown statistics
   * @returns Shutdown statistics
   */
  getStats(): ShutdownStats;

  /**
   * Register callback for shutdown events
   * @param event Event name ('start', 'complete', 'timeout')
   * @param callback Event handler
   */
  on(event: string, callback: (stats: ShutdownStats) => void): void;

  /**
   * Remove callback for shutdown events
   * @param event Event name
   * @param callback Event handler
   */
  off(event: string, callback: (stats: ShutdownStats) => void): void;
}

/**
 * Resource cleanup handler interface
 */
export interface ResourceCleanupHandler {
  /**
   * Clean up all IPC-related resources
   * @returns Promise that resolves when cleanup is complete
   */
  cleanup(): Promise<void>;

  /**
   * Destroy all sockets immediately
   * Uses socket.destroy() pattern for immediate cleanup
   */
  destroySockets(): void;

  /**
   * Close all file handles
   * @returns Promise that resolves when all handles are closed
   */
  closeFileHandles(): Promise<void>;

  /**
   * Remove temporary files
   * @returns Promise that resolves when temp files are removed
   */
  removeTempFiles(): Promise<void>;

  /**
   * Get list of tracked resources
   * @returns Object with counts of each resource type
   */
  getResourceCounts(): {
    sockets: number;
    fileHandles: number;
    tempFiles: number;
  };
}
