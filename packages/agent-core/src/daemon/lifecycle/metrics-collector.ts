/**
 * Metrics Collector for daemon lifecycle
 *
 * Collects and tracks metrics for operational monitoring.
 */
export class MetricsCollector {
  private metrics: {
    uptime: number;
    tasks: {
      active: number;
      completed: number;
      failed: number;
    };
    connections: {
      active: number;
    };
    errors: {
      total: number;
    };
  };

  constructor() {
    this.metrics = {
      uptime: 0,
      tasks: {
        active: 0,
        completed: 0,
        failed: 0,
      },
      connections: {
        active: 0,
      },
      errors: {
        total: 0,
      },
    };
  }

  /**
   * Record daemon uptime
   */
  recordUptime(uptimeMs: number): void {
    this.metrics.uptime = uptimeMs;
  }

  /**
   * Record task count
   */
  recordTaskCount(type: 'active' | 'completed' | 'failed', count: number): void {
    this.metrics.tasks[type] = count;
  }

  /**
   * Record connection count
   */
  recordConnectionCount(count: number): void {
    this.metrics.connections.active = count;
  }

  /**
   * Record an error
   */
  recordError(): void {
    this.metrics.errors.total++;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      uptime: 0,
      tasks: {
        active: 0,
        completed: 0,
        failed: 0,
      },
      connections: {
        active: 0,
      },
      errors: {
        total: 0,
      },
    };
  }

  /**
   * Get all metrics
   */
  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }
}
