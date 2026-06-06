import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDaemonClient = vi.hoisted(() => ({ call: vi.fn() }));
const mockGetDaemonClient = vi.hoisted(() => vi.fn(() => mockDaemonClient));
const handlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: mockGetDaemonClient,
}));

vi.mock('@main/ipc/handlers/utils', () => ({
  isE2ESkipAuthEnabled: vi.fn(() => false),
}));

import { registerOnboardingHandlers } from '@main/ipc/handlers/settings-handlers/onboarding-handlers';

describe('onboarding-handlers', () => {
  beforeEach(() => {
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    vi.clearAllMocks();
    mockGetDaemonClient.mockReturnValue(mockDaemonClient);
    registerOnboardingHandlers((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler;
    });
  });

  it('onboarding:complete should return true when onboarding already complete', async () => {
    mockDaemonClient.call.mockResolvedValue({ app: { onboardingComplete: true } });
    const result = await handlers['onboarding:complete']({} as never);
    expect(result).toBe(true);
  });

  it('onboarding:complete should return true when tasks exist', async () => {
    mockDaemonClient.call
      .mockResolvedValueOnce({ app: { onboardingComplete: false } })
      .mockResolvedValueOnce([{ id: 'task-1' }]);
    const result = await handlers['onboarding:complete']({} as never);
    expect(result).toBe(true);
    expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.setOnboardingComplete', {
      complete: true,
    });
  });

  it('onboarding:complete should return false when no tasks', async () => {
    mockDaemonClient.call
      .mockResolvedValueOnce({ app: { onboardingComplete: false } })
      .mockResolvedValueOnce([]);
    const result = await handlers['onboarding:complete']({} as never);
    expect(result).toBe(false);
  });

  it('onboarding:complete should skip when E2E skip auth enabled', async () => {
    const { isE2ESkipAuthEnabled } = await import('@main/ipc/handlers/utils');
    vi.mocked(isE2ESkipAuthEnabled).mockReturnValue(true);
    const result = await handlers['onboarding:complete']({} as never);
    expect(result).toBe(true);
  });

  it('onboarding:set-complete should set complete', async () => {
    await handlers['onboarding:set-complete']({} as never, true);
    expect(mockDaemonClient.call).toHaveBeenCalledWith('settings.setOnboardingComplete', {
      complete: true,
    });
  });

  it('onboarding:set-complete should throw for non-boolean', async () => {
    await expect(
      handlers['onboarding:set-complete']({} as never, 'yes' as unknown as boolean),
    ).rejects.toThrow('complete must be a boolean');
  });
});
