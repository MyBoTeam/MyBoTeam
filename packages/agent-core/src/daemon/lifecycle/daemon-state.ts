/**
 * Daemon lifecycle state machine
 *
 * Valid transitions:
 * - Starting → Running (initialization complete)
 * - Running → Draining (SIGTERM received)
 * - Draining → Stopped (tasks complete OR timeout)
 * - Any → Stopped (fatal error OR SIGKILL)
 */
export enum DaemonState {
  Starting = 'Starting',
  Running = 'Running',
  Draining = 'Draining',
  Stopped = 'Stopped',
}

/**
 * Valid state transitions for the daemon lifecycle
 */
export const VALID_TRANSITIONS: Record<DaemonState, DaemonState[]> = {
  [DaemonState.Starting]: [DaemonState.Running, DaemonState.Stopped],
  [DaemonState.Running]: [DaemonState.Draining, DaemonState.Stopped],
  [DaemonState.Draining]: [DaemonState.Stopped],
  [DaemonState.Stopped]: [DaemonState.Starting],
};

/**
 * Check if a state transition is valid
 */
export function isValidTransition(from: DaemonState, to: DaemonState): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}
