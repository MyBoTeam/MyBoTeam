import type { TaskResult } from './task-runtime-types.js';

export type PiTerminalReason =
  | 'success'
  | 'failure'
  | 'cancelled'
  | 'interrupted'
  | 'startup-failure'
  | 'pre-result-failure';

export interface PiTerminalStateInput {
  reason: PiTerminalReason;
  sessionId?: string;
  durationMs?: number;
  error?: string;
}

export interface PiTerminalState {
  taskStatus: 'completed' | 'failed' | 'cancelled' | 'interrupted';
  result: TaskResult;
  error?: Error;
}

export function resolvePiTerminalState(input: PiTerminalStateInput): PiTerminalState {
  switch (input.reason) {
    case 'success':
      return {
        taskStatus: 'completed',
        result: createResult('success', input),
      };
    case 'cancelled':
      return {
        taskStatus: 'cancelled',
        result: createResult('interrupted', input),
      };
    case 'interrupted':
      return {
        taskStatus: 'interrupted',
        result: createResult('interrupted', input),
      };
    case 'startup-failure':
    case 'pre-result-failure':
    case 'failure': {
      const message = input.error ?? 'Pi runtime failed before producing a result';
      return {
        taskStatus: 'failed',
        result: createResult('error', { ...input, error: message }),
        error: new Error(message),
      };
    }
  }
}

function createResult(status: TaskResult['status'], input: PiTerminalStateInput): TaskResult {
  return {
    status,
    sessionId: input.sessionId,
    durationMs: input.durationMs,
    error: input.error,
  };
}
