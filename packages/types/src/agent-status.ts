/**
 * AgentStatus - 6-state lifecycle aligned with ADR-002 (Eve Agent Harness)
 * States: idle → materialized → starting → running → stopped/error → idle
 */

import { z } from 'zod';

export const AgentStatusSchema = z.enum([
  'idle',
  'materialized',
  'starting',
  'running',
  'stopped',
  'error',
]);

export type AgentStatus = z.infer<typeof AgentStatusSchema>;

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
 * VALID_STATUSES - All valid status values (derived from schema)
 */
export const VALID_STATUSES: AgentStatus[] = AgentStatusSchema.options;

/**
 * Check if a status value is valid
 */
export function isValidStatus(status: string): status is AgentStatus {
  return VALID_STATUSES.includes(status as AgentStatus);
}
