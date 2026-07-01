export interface DaemonStatus {
  isShuttingDown: boolean;
  uptime: number;
  connectedClients: number;
  startedAt: number;
}

export function createDaemonStatus(): DaemonStatus {
  return {
    isShuttingDown: false,
    uptime: 0,
    connectedClients: 0,
    startedAt: Date.now(),
  };
}

export function updateDaemonStatus(
  status: DaemonStatus,
  updates: Partial<Pick<DaemonStatus, 'isShuttingDown' | 'connectedClients'>>,
): DaemonStatus {
  return {
    ...status,
    ...updates,
    uptime: Date.now() - status.startedAt,
  };
}
