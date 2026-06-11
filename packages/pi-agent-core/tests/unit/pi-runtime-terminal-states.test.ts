import { describe, expect, it } from 'vitest';
import { resolvePiTerminalState } from '../../src/adapter/pi-terminal-state.js';

describe('Pi runtime terminal states', () => {
  it.each([
    ['success', 'completed', 'success'],
    ['failure', 'failed', 'error'],
    ['cancelled', 'cancelled', 'interrupted'],
    ['interrupted', 'interrupted', 'interrupted'],
    ['startup-failure', 'failed', 'error'],
    ['pre-result-failure', 'failed', 'error'],
  ] as const)('maps %s to task status %s and result status %s', (reason, taskStatus, resultStatus) => {
    const state = resolvePiTerminalState({
      reason,
      sessionId: 'sess-terminal',
      durationMs: 25,
      error: reason === 'success' ? undefined : `${reason} message`,
    });

    expect(state.taskStatus).toBe(taskStatus);
    expect(state.result).toMatchObject({
      status: resultStatus,
      sessionId: 'sess-terminal',
      durationMs: 25,
    });
  });

  it('surfaces startup failures as clear errors without requiring a Pi result', () => {
    const state = resolvePiTerminalState({ reason: 'startup-failure' });

    expect(state.taskStatus).toBe('failed');
    expect(state.result.error).toBe('Pi runtime failed before producing a result');
    expect(state.error?.message).toBe('Pi runtime failed before producing a result');
  });
});
