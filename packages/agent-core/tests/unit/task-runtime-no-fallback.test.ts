import { describe, expect, it } from 'vitest';
import { selectTaskRuntime } from '../../src/internal/classes/task-runtime-adapter-factory.js';

describe('task runtime fallback contract', () => {
  it('selects Pi for normal task starts', () => {
    expect(selectTaskRuntime({ source: 'ui' })).toBe('pi');
  });

  it('does not encode automatic Pi-to-OpenCode fallback in the selection result', () => {
    expect(selectTaskRuntime({ source: 'connector' })).toBe('pi');
  });
});
