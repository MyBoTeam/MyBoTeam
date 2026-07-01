import { createChildLogger } from './logger.js';

const log = createChildLogger('metrics');

interface MetricsData {
  requestsTotal: number;
  requestsSuccess: number;
  requestsFailed: number;
  requestLatencies: number[];
  activeConnections: number;
  startTime: number;
}

const metrics: MetricsData = {
  requestsTotal: 0,
  requestsSuccess: 0,
  requestsFailed: 0,
  requestLatencies: [],
  activeConnections: 0,
  startTime: Date.now(),
};

export function recordRequest(durationMs: number, success: boolean): void {
  metrics.requestsTotal++;
  if (success) {
    metrics.requestsSuccess++;
  } else {
    metrics.requestsFailed++;
  }
  metrics.requestLatencies.push(durationMs);

  // Keep only last 1000 latencies
  if (metrics.requestLatencies.length > 1000) {
    metrics.requestLatencies.shift();
  }
}

export function recordConnection(connected: boolean): void {
  if (connected) {
    metrics.activeConnections++;
  } else {
    metrics.activeConnections = Math.max(0, metrics.activeConnections - 1);
  }
}

export function getMetrics(): {
  requestsTotal: number;
  requestsSuccess: number;
  requestsFailed: number;
  averageLatencyMs: number;
  p99LatencyMs: number;
  activeConnections: number;
  uptimeMs: number;
} {
  const latencies = [...metrics.requestLatencies].sort((a, b) => a - b);
  const averageLatencyMs = latencies.length > 0
    ? latencies.reduce((a, b) => a + b, 0) / latencies.length
    : 0;
  const p99Index = Math.floor(latencies.length * 0.99);
  const p99LatencyMs = latencies.length > 0 ? latencies[p99Index] ?? 0 : 0;

  return {
    requestsTotal: metrics.requestsTotal,
    requestsSuccess: metrics.requestsSuccess,
    requestsFailed: metrics.requestsFailed,
    averageLatencyMs,
    p99LatencyMs,
    activeConnections: metrics.activeConnections,
    uptimeMs: Date.now() - metrics.startTime,
  };
}

export function resetMetrics(): void {
  metrics.requestsTotal = 0;
  metrics.requestsSuccess = 0;
  metrics.requestsFailed = 0;
  metrics.requestLatencies = [];
  metrics.activeConnections = 0;
  metrics.startTime = Date.now();
}

export function logMetrics(): void {
  const data = getMetrics();
  log.info('Metrics snapshot', data);
}
