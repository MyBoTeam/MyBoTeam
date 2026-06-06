import { describe, expect, it } from 'vitest';
import type { TaskResult } from '../../../src/common/types/task.js';
import { mapResultToStatus } from '../../../src/utils/task-status.js';

describe('mapResultToStatus', () => {
  it('maps success result to completed', () => {
    const result: TaskResult = { status: 'success' };
    expect(mapResultToStatus(result)).toBe('completed');
  });

  it('maps interrupted result to interrupted', () => {
    const result: TaskResult = { status: 'interrupted' };
    expect(mapResultToStatus(result)).toBe('interrupted');
  });

  it('maps error result to failed', () => {
    const result: TaskResult = { status: 'error' };
    expect(mapResultToStatus(result)).toBe('failed');
  });
});
