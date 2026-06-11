import { describe, expect, it, vi } from 'vitest';
import { PiTaskRuntimeAdapter } from '../../src/adapter/pi-task-runtime-adapter.js';

describe('PiTaskRuntimeAdapter', () => {
  it('runs a Pi prompt and emits completion without OpenCode fallback', async () => {
    const prompt = vi.fn(async () => {});
    const adapter = new PiTaskRuntimeAdapter({
      taskId: 'task-pi',
      createAgent: () => ({ prompt }),
    });
    const completed: unknown[] = [];
    adapter.on('complete', (result) => completed.push(result));

    const task = await adapter.startTask({
      prompt: 'hello',
      provider: 'openai',
      modelId: 'openai/gpt-5',
    });

    expect(prompt).toHaveBeenCalledWith('hello');
    expect(task.status).toBe('completed');
    expect(completed).toEqual([{ status: 'success', sessionId: 'task-pi' }]);
  });

  it('emits startup failure instead of falling back to the current harness', async () => {
    const adapter = new PiTaskRuntimeAdapter({
      taskId: 'task-pi',
      createAgent: () => {
        throw new Error('Pi boot failed');
      },
    });
    const errors: string[] = [];
    adapter.on('error', (error) => errors.push(error.message));

    const task = await adapter.startTask({
      prompt: 'hello',
      provider: 'openai',
      modelId: 'openai/gpt-5',
    });

    expect(task.status).toBe('failed');
    expect(task.result?.error).toBe('Pi boot failed');
    expect(errors).toEqual(['Pi boot failed']);
  });
});
