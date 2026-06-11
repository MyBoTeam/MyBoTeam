import { describe, expect, it } from 'vitest';
import type { AdapterOptions } from '../../src/internal/classes/adapter-types.js';
import { OpenCodeAdapter } from '../../src/internal/classes/open-code-adapter.js';
import {
  createTaskRuntimeAdapter,
  selectTaskRuntime,
} from '../../src/internal/classes/task-runtime-adapter-factory.js';

const adapterOptions: AdapterOptions = {
  platform: process.platform,
  isPackaged: false,
  tempPath: '/tmp',
};

describe('current harness lifecycle regression', () => {
  it('keeps the current OpenCode harness constructible through the runtime factory', () => {
    const adapter = createTaskRuntimeAdapter({
      adapterOptions,
      taskId: 'task_current_harness_regression',
      taskConfig: { source: 'ui' },
      runtimeOverride: 'opencode',
    });

    try {
      expect(adapter).toBeInstanceOf(OpenCodeAdapter);
      expect(adapter.getTaskId()).toBe('task_current_harness_regression');
      expect(adapter.getSessionId()).toBeNull();
      expect(adapter.running).toBe(false);
    } finally {
      adapter.dispose();
    }
  });

  it('routes all current task sources to Pi by default', () => {
    expect(selectTaskRuntime({ source: 'ui' })).toBe('pi');
    expect(selectTaskRuntime({ source: 'scheduler' })).toBe('pi');
    expect(selectTaskRuntime({ source: 'whatsapp' })).toBe('pi');
    expect(selectTaskRuntime({ source: 'daemon' })).toBe('pi');
    expect(selectTaskRuntime({ source: 'background' })).toBe('pi');
    expect(selectTaskRuntime({ source: 'connector' })).toBe('pi');
  });
});
