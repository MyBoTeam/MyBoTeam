import { describe, expect, it } from 'vitest';
import type { AdapterOptions } from '../../src/internal/classes/adapter-types.js';
import {
  createTaskRuntimeAdapter,
  selectTaskRuntime,
} from '../../src/internal/classes/task-runtime-adapter-factory.js';
import { OpenCodeAdapter } from '../../src/internal/classes/open-code-adapter.js';

const adapterOptions: AdapterOptions = {
  platform: process.platform,
  isPackaged: false,
  tempPath: '/tmp',
};

describe('task runtime adapter factory', () => {
  it('selects Pi as the default runtime for normal task starts', () => {
    expect(selectTaskRuntime({ source: 'ui' })).toBe('pi');
  });

  it('creates the current OpenCode adapter through the maintainer override path', () => {
    const adapter = createTaskRuntimeAdapter({
      adapterOptions,
      taskId: 'task_factory_test',
      taskConfig: { source: 'ui' },
      runtimeOverride: 'opencode',
    });

    try {
      expect(adapter).toBeInstanceOf(OpenCodeAdapter);
      expect(adapter.getTaskId()).toBe('task_factory_test');
    } finally {
      adapter.dispose();
    }
  });
});
