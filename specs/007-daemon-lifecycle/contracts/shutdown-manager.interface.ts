/**
 * ShutdownManager - Coordinates graceful shutdown, draining tasks, cleaning resources
 */
export interface ShutdownManager {
  /** Whether shutdown has been initiated */
  readonly shutdownInitiated: boolean;
  
  /** When shutdown was initiated (ISO-8601 timestamp, null if not initiated) */
  readonly shutdownTimestamp: string | null;
  
  /** Count of tasks drained during shutdown */
  readonly activeTasksDrained: number;
  
  /** Count of tasks aborted due to timeout */
  readonly tasksAborted: number;
  
  /** Whether all resources were cleaned up */
  readonly resourcesCleanedUp: boolean;
  
  /**
   * Initiate graceful shutdown
   * @param timeout Timeout in milliseconds (default: 30000)
   * @returns true if shutdown completed gracefully, false if timeout occurred
   */
  initiate(timeout?: number): Promise<boolean>;
  
  /**
   * Force immediate shutdown (skip graceful drain)
   */
  force(): Promise<void>;
  
  /**
   * Check if shutdown is in progress
   */
  isInProgress(): boolean;
  
  /**
   * Get shutdown statistics
   */
  getStats(): ShutdownStats;
}

/**
 * Shutdown statistics
 */
export interface ShutdownStats {
  /** Whether shutdown has been initiated */
  initiated: boolean;
  
  /** When shutdown was initiated (ISO-8601 timestamp) */
  timestamp: string | null;
  
  /** Count of tasks drained during shutdown */
  tasksDrained: number;
  
  /** Count of tasks aborted due to timeout */
  tasksAborted: number;
  
  /** Whether all resources were cleaned up */
  resourcesCleanedUp: boolean;
  
  /** Duration of shutdown in milliseconds (null if not completed) */
  durationMs: number | null;
}

/**
 * Resource cleanup handler
 */
export interface ResourceCleanupHandler {
  /**
   * Destroy all connected sockets immediately
   */
  destroyAllSockets(): void;
  
  /**
   * Close all file handles
   */
  closeAllFileHandles(): Promise<void>;
  
  /**
   * Remove temp files
   */
  removeTempFiles(): Promise<void>;
  
  /**
   * Clean up all IPC-related resources
   */
  cleanupAll(): Promise<void>;
}
