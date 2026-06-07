import type { useDaemonStore } from '@/stores/daemonStore';

export function formatUptime(ms: number): string {
  if (ms <= 0) {
    return '\u2014';
  }
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export function getDisplayStatus(
  storeStatus: ReturnType<typeof useDaemonStore.getState>['status'],
): string {
  switch (storeStatus) {
    case 'connected':
      return 'running';
    case 'starting':
      return 'starting';
    case 'stopping':
      return 'stopping';
    case 'stopped':
      return 'stopped';
    case 'disconnected':
    case 'reconnecting':
      return 'reconnecting';
    case 'reconnect-failed':
      return 'failed';
    default:
      return 'unknown';
  }
}

export function getStatusDotClass(displayStatus: string): string {
  switch (displayStatus) {
    case 'running':
      return 'bg-green-500';
    case 'starting':
      return 'bg-green-500 animate-pulse';
    case 'stopping':
      return 'bg-red-500 animate-pulse';
    case 'reconnecting':
      return 'bg-yellow-500 animate-pulse';
    case 'failed':
    case 'stopped':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export const TRANSITIONAL_STATES = new Set(['starting', 'stopping', 'reconnecting']);
