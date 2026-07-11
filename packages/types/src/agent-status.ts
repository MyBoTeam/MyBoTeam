/**
 * AgentStatus - 6-state lifecycle aligned with ADR-002 (Eve Agent Harness)
 * States: idle → materialized → starting → running → stopped/error → idle
 */

export type AgentStatus = 'idle' | 'materialized' | 'starting' | 'running' | 'stopped' | 'error';

/**
 * VALID_TRANSITIONS - Map of allowed status transitions
 * Aligned with ADR-002 state machine
 */
export const VALID_TRANSITIONS: Record<AgentStatus, AgentStatus[]> = {
  idle: ['materialized'],
  materialized: ['starting'],
  starting: ['running'],
  running: ['stopped', 'error'],
  stopped: [],
  error: ['idle'],
};

/**
 * Check if a status transition is valid
 */
export function isValidTransition(from: AgentStatus, to: AgentStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * VALID_STATUSES - All valid status values
 */
export const VALID_STATUSES: AgentStatus[] = [
  'idle',
  'materialized',
  'starting',
  'running',
  'stopped',
  'error',
];

/**
 * Check if a status value is valid
 */
export function isValidStatus(status: string): status is AgentStatus {
  return VALID_STATUSES.includes(status as AgentStatus);
}
