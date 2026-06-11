import { taskConfigSchema, validate, validateTaskConfig } from '@myboteam/agent-core';
import { describe, expect, it } from 'vitest';
import { getTaskSourceFromMap } from '../../src/task-service-actions.js';

describe('task source routing contract', () => {
  it.each([
    'ui',
    'scheduler',
    'whatsapp',
    'daemon',
    'background',
    'connector',
  ] as const)('accepts %s as a task source at runtime boundaries', (source) => {
    expect(validateTaskConfig({ prompt: 'Run task', source }).source).toBe(source);
    expect(validate(taskConfigSchema, { prompt: 'Run task', source }).source).toBe(source);
  });

  it('falls back to ui only when no source was recorded', () => {
    expect(getTaskSourceFromMap(new Map(), 'task_missing')).toBe('ui');
  });
});
