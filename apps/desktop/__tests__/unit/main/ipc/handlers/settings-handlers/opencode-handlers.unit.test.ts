import { beforeEach, describe, expect, it, vi } from 'vitest';

const handlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('@main/opencode', () => ({
  isOpenCodeCliInstalled: vi.fn(),
  getOpenCodeCliVersion: vi.fn(),
}));

vi.mock('@main/logging', () => ({
  getLogCollector: vi.fn(() => ({ logEnv: vi.fn() })),
}));

vi.mock('@main/ipc/handlers/utils', () => ({
  isE2ESkipAuthEnabled: vi.fn(() => false),
}));

import { registerOpenCodeHandlers } from '@main/ipc/handlers/settings-handlers/opencode-handlers';

describe('opencode-handlers', () => {
  beforeEach(() => {
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    vi.clearAllMocks();
    registerOpenCodeHandlers((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler;
    });
  });

  it('opencode:check should return CLI info when installed', async () => {
    const opencode = await import('@main/opencode');
    vi.mocked(opencode.isOpenCodeCliInstalled).mockResolvedValue(true);
    vi.mocked(opencode.getOpenCodeCliVersion).mockResolvedValue('0.5.0');
    const result = await handlers['opencode:check']({} as never);
    expect(result).toEqual({
      installed: true,
      version: '0.5.0',
      installCommand: 'npm install -g opencode-ai',
    });
  });

  it('opencode:check should return not installed when CLI not found', async () => {
    const opencode = await import('@main/opencode');
    vi.mocked(opencode.isOpenCodeCliInstalled).mockResolvedValue(false);
    const result = await handlers['opencode:check']({} as never);
    expect(result).toEqual({
      installed: false,
      version: null,
      installCommand: 'npm install -g opencode-ai',
    });
  });

  it('opencode:check should handle CLI check error gracefully', async () => {
    const opencode = await import('@main/opencode');
    vi.mocked(opencode.isOpenCodeCliInstalled).mockRejectedValue(new Error('Check failed'));
    const result = await handlers['opencode:check']({} as never);
    expect(result).toEqual({
      installed: false,
      version: null,
      installCommand: 'npm install -g opencode-ai',
    });
  });

  it('opencode:version should return CLI version', async () => {
    const opencode = await import('@main/opencode');
    vi.mocked(opencode.getOpenCodeCliVersion).mockResolvedValue('0.5.0');
    const result = await handlers['opencode:version']({} as never);
    expect(result).toBe('0.5.0');
  });
});
