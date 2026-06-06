import { describe, expect, it, vi } from 'vitest';
import type { TaskConfigBuilderOptions } from '../../src/task-config-builder.js';
import {
  createOnBeforeTaskStart,
  getBrowserServerConfig,
  runTaskSummaryGeneration,
} from '../../src/task-service-helpers.js';

const mocks = vi.hoisted(() => ({
  ensureDevBrowserServer: vi.fn(async () => {}),
  generateTaskSummary: vi.fn((_p: string, _k: (p: string) => string | null) =>
    Promise.resolve('Test summary'),
  ),
  loggerWarn: vi.fn(),
}));

vi.mock('@myboteam/agent-core', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Record<string, unknown>),
    DEV_BROWSER_PORT: 9229,
    ensureDevBrowserServer: mocks.ensureDevBrowserServer,
    generateTaskSummary: mocks.generateTaskSummary,
    logger: { warn: mocks.loggerWarn },
  };
});

describe('getBrowserServerConfig', () => {
  it('should return config with mcpToolsPath and devBrowserPort', () => {
    const opts = { mcpToolsPath: '/tools' } as TaskConfigBuilderOptions;
    const config = getBrowserServerConfig(opts);
    expect(config.mcpToolsPath).toBe('/tools');
    expect(config.devBrowserPort).toBe(9229);
  });
});

describe('createOnBeforeTaskStart', () => {
  it('should return early when mcpToolsPath is falsy', async () => {
    const fn = createOnBeforeTaskStart({ mcpToolsPath: '' } as TaskConfigBuilderOptions);
    const onProgress = vi.fn();
    await fn({ onProgress } as never, true);
    expect(onProgress).not.toHaveBeenCalled();
    expect(mocks.ensureDevBrowserServer).not.toHaveBeenCalled();
  });

  it('should emit progress and start browser when isFirst is true', async () => {
    const fn = createOnBeforeTaskStart({ mcpToolsPath: '/tools' } as TaskConfigBuilderOptions);
    const onProgress = vi.fn();
    await fn({ onProgress } as never, true);
    expect(onProgress).toHaveBeenCalledWith({
      stage: 'browser',
      message: 'Preparing browser...',
      isFirstTask: true,
    });
    expect(mocks.ensureDevBrowserServer).toHaveBeenCalled();
  });

  it('should start browser without progress when isFirst is false', async () => {
    const fn = createOnBeforeTaskStart({ mcpToolsPath: '/tools' } as TaskConfigBuilderOptions);
    const onProgress = vi.fn();
    await fn({ onProgress } as never, false);
    expect(onProgress).not.toHaveBeenCalled();
    expect(mocks.ensureDevBrowserServer).toHaveBeenCalled();
  });
});

describe('runTaskSummaryGeneration', () => {
  it('should call generateTaskSummary and emit summary on success', async () => {
    const storage = { getApiKey: vi.fn(), updateTaskSummary: vi.fn() } as never;
    const emitSummary = vi.fn();
    runTaskSummaryGeneration('task-1', 'test prompt', storage, emitSummary);
    await vi.waitFor(() => {
      expect(emitSummary).toHaveBeenCalledWith('Test summary');
    });
    expect(mocks.generateTaskSummary).toHaveBeenCalledWith('test prompt', expect.any(Function));
  });

  it('should not throw on generateTaskSummary failure', async () => {
    mocks.generateTaskSummary.mockRejectedValueOnce(new Error('fail'));
    const storage = { getApiKey: vi.fn(), updateTaskSummary: vi.fn() } as never;
    const emitSummary = vi.fn();
    expect(() =>
      runTaskSummaryGeneration('task-1', 'test prompt', storage, emitSummary),
    ).not.toThrow();
    await vi.waitFor(() => {
      expect(mocks.loggerWarn).toHaveBeenCalled();
    });
  });
});
