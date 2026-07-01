import { beforeEach, describe, expect, it } from 'vitest';
import { MetricsCollector } from '../../../src/daemon/lifecycle/metrics-collector';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  describe('recordUptime()', () => {
    it('should record daemon uptime', () => {
      collector.recordUptime(1000);

      const metrics = collector.getMetrics();
      expect(metrics.uptime).toBe(1000);
    });
  });

  describe('recordTaskCount()', () => {
    it('should record active tasks', () => {
      collector.recordTaskCount('active', 5);

      const metrics = collector.getMetrics();
      expect(metrics.tasks.active).toBe(5);
    });

    it('should record completed tasks', () => {
      collector.recordTaskCount('completed', 10);

      const metrics = collector.getMetrics();
      expect(metrics.tasks.completed).toBe(10);
    });

    it('should record failed tasks', () => {
      collector.recordTaskCount('failed', 2);

      const metrics = collector.getMetrics();
      expect(metrics.tasks.failed).toBe(2);
    });
  });

  describe('recordConnectionCount()', () => {
    it('should record active connections', () => {
      collector.recordConnectionCount(3);

      const metrics = collector.getMetrics();
      expect(metrics.connections.active).toBe(3);
    });
  });

  describe('recordError()', () => {
    it('should record error count', () => {
      collector.recordError();
      collector.recordError();

      const metrics = collector.getMetrics();
      expect(metrics.errors.total).toBe(2);
    });
  });

  describe('reset()', () => {
    it('should reset all metrics', () => {
      collector.recordUptime(1000);
      collector.recordTaskCount('active', 5);
      collector.recordConnectionCount(3);
      collector.recordError();

      collector.reset();

      const metrics = collector.getMetrics();
      expect(metrics.uptime).toBe(0);
      expect(metrics.tasks.active).toBe(0);
      expect(metrics.connections.active).toBe(0);
      expect(metrics.errors.total).toBe(0);
    });
  });

  describe('getMetrics()', () => {
    it('should return all metrics', () => {
      const metrics = collector.getMetrics();

      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('tasks');
      expect(metrics).toHaveProperty('connections');
      expect(metrics).toHaveProperty('errors');
    });
  });
});
