import { describe, expect, it, vi } from 'vitest';

vi.mock('@myboteam/agent-core', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    createMessageId: vi.fn(() => 'msg-1'),
    createTaskId: vi.fn(() => 'tsk_test'),
    validateTaskConfig: (config: Record<string, unknown>) => config,
  };
});

const { buildStartTaskConfig } = await import('../../src/task-service-execution.js');

function storageWithModel(model: { provider?: string; model?: string } | null) {
  return {
    getActiveProviderModel: vi.fn(() => model),
    getSelectedModel: vi.fn(() => null),
  };
}

function storageWithSelectedModel(model: { provider?: string; model?: string } | null) {
  return {
    getActiveProviderModel: vi.fn(() => null),
    getSelectedModel: vi.fn(() => model),
  };
}

describe('buildStartTaskConfig', () => {
  it('sets modelId and provider from activeProviderModel when neither is in params', () => {
    const result = buildStartTaskConfig(
      { prompt: 'hello' },
      storageWithModel({
        provider: 'anthropic',
        model: 'anthropic/claude-sonnet-4-20250514',
      }) as never,
    );
    expect(result.validatedConfig.modelId).toBe('anthropic/claude-sonnet-4-20250514');
    expect(result.validatedConfig.provider).toBe('anthropic');
  });

  it('does not override modelId when already set in params, but still sets provider', () => {
    const result = buildStartTaskConfig(
      { prompt: 'hello', modelId: 'gpt-4' },
      storageWithModel({ provider: 'openai', model: 'gpt-4o' }) as never,
    );
    expect(result.validatedConfig.modelId).toBe('gpt-4');
    expect(result.validatedConfig.provider).toBe('openai');
  });

  it('sets modelId but not provider when selected model lacks provider', () => {
    const result = buildStartTaskConfig(
      { prompt: 'hello' },
      storageWithSelectedModel({ model: 'gpt-4' }) as never,
    );
    expect(result.validatedConfig.modelId).toBe('gpt-4');
    expect(result.validatedConfig.provider).toBeUndefined();
  });

  it('sets modelId and provider from getSelectedModel when getActiveProviderModel is null', () => {
    const result = buildStartTaskConfig(
      { prompt: 'hello' },
      storageWithSelectedModel({ provider: 'openai', model: 'openai/gpt-4o' }) as never,
    );
    expect(result.validatedConfig.modelId).toBe('openai/gpt-4o');
    expect(result.validatedConfig.provider).toBe('openai');
  });

  it('does not set modelId or provider when no model is available', () => {
    const result = buildStartTaskConfig({ prompt: 'hello' }, storageWithModel(null) as never);
    expect(result.validatedConfig.modelId).toBeUndefined();
    expect(result.validatedConfig.provider).toBeUndefined();
  });

  it('generates a new taskId when none is provided', () => {
    const result = buildStartTaskConfig({ prompt: 'hello' }, storageWithModel(null) as never);
    expect(result.taskId).toBe('tsk_test');
  });

  it('preserves provided taskId', () => {
    const result = buildStartTaskConfig(
      { prompt: 'hello', taskId: 'my-custom-id' },
      storageWithModel(null) as never,
    );
    expect(result.taskId).toBe('my-custom-id');
  });
});
