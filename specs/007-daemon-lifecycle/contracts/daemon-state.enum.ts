/**
 * Daemon lifecycle state machine
 * 
 * Valid transitions:
 * - Starting → Running (initialization complete)
 * - Running → Draining (SIGTERM received)
 * - Draining →Stopped (tasks complete OR timeout)
 * - Any → Stopped (fatal error OR SIGKILL)
 */
export enum DaemonState {
  Starting = 'Starting',
  Running = 'Running',
  Draining = 'Draining',
  Stopped = 'Stopped'
}
