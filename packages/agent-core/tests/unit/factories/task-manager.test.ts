import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/internal/classes/TaskManager.js', () => ({
  TaskManager: class MockTM {
    constructor(readonly options: unknown) {}
    createTask = vi.fn();
    listTasks = vi.fn();
    getTask = vi.fn();
  },
}));

import { createTaskManager } from '../../../src/factories/task-manager.js';

describe('createTaskManager', () => {
  it('should create a TaskManager with options', () => {
    const options = { storage: {} as never, skills: [], platform: 'darwin' as NodeJS.Platform };
    const result = createTaskManager(options);
    expect(result).toBeDefined();
    expect(typeof result.createTask).toBe('function');
  });
});
