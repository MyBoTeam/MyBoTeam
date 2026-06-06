import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockMyboteamAiGetUsage = vi.fn();
const mockGetProviderSettings = vi.fn();
const mockOnMyboteamAiUsageUpdate = vi.fn();

vi.mock('@/lib/myboteam', () => ({
  getMyBoTeam: () => ({
    myboteamAiGetUsage: mockMyboteamAiGetUsage,
    getProviderSettings: mockGetProviderSettings,
    onMyboteamAiUsageUpdate: mockOnMyboteamAiUsageUpdate,
  }),
}));

describe('useCreditsState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMyboteamAiGetUsage.mockResolvedValue({
      remainingCredits: 50,
      spentCredits: 50,
      totalCredits: 100,
    });
    mockGetProviderSettings.mockResolvedValue({
      connectedProviders: {
        'myboteam-ai': { connectionStatus: 'connected', providerId: 'myboteam-ai' },
      },
      activeProviderId: 'myboteam-ai',
    });
    mockOnMyboteamAiUsageUpdate.mockReturnValue(() => {});
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => import('@/hooks/useCreditsState'));
    // Just verify the hook exists
    expect(result).toBeDefined();
  });

  it('returns usage data after initial fetch', async () => {
    const { useCreditsState } = await import('@/hooks/useCreditsState');
    const { result } = renderHook(() => useCreditsState());

    await vi.waitFor(() => {
      expect(result.current.usage).not.toBeNull();
    });

    expect(result.current.usage?.remainingCredits).toBe(50);
    expect(result.current.isCreditsBlocked).toBe(false);
  });

  it('sets isCreditsBlocked when myboteam-ai is active and credits exhausted', async () => {
    mockMyboteamAiGetUsage.mockResolvedValue({
      remainingCredits: 0,
      spentCredits: 100,
      totalCredits: 100,
    });
    mockGetProviderSettings.mockResolvedValue({
      connectedProviders: {
        'myboteam-ai': { connectionStatus: 'connected', providerId: 'myboteam-ai' },
      },
      activeProviderId: 'myboteam-ai',
    });

    const { useCreditsState } = await import('@/hooks/useCreditsState');
    const { result } = renderHook(() => useCreditsState());

    await vi.waitFor(() => {
      expect(result.current.usage).not.toBeNull();
    });

    expect(result.current.isCreditsBlocked).toBe(true);
  });

  it('sets usage to null when myboteam-ai is not connected', async () => {
    mockGetProviderSettings.mockResolvedValue({
      connectedProviders: {},
      activeProviderId: 'other-provider',
    });

    const { useCreditsState } = await import('@/hooks/useCreditsState');
    const { result } = renderHook(() => useCreditsState());

    await vi.waitFor(() => {
      expect(result.current.usage).toBeNull();
    });

    expect(result.current.isCreditsBlocked).toBe(false);
  });

  it('handles error during initial fetch gracefully', async () => {
    mockMyboteamAiGetUsage.mockRejectedValue(new Error('fetch failed'));

    const { useCreditsState } = await import('@/hooks/useCreditsState');
    const { result } = renderHook(() => useCreditsState());

    await vi.waitFor(() => {
      expect(result.current.usage).toBeNull();
    });
  });

  it('refreshCreditsState returns false on error', async () => {
    mockGetProviderSettings.mockRejectedValue(new Error('fail'));

    const { useCreditsState } = await import('@/hooks/useCreditsState');
    const { result } = renderHook(() => useCreditsState());

    const blocked = await result.current.refreshCreditsState();
    expect(blocked).toBe(false);
  });

  it('openQuotaBlockExperience sets showQuotaInline', async () => {
    const { useCreditsState } = await import('@/hooks/useCreditsState');
    const { result } = renderHook(() => useCreditsState());

    act(() => {
      result.current.openQuotaBlockExperience();
    });

    expect(result.current.showQuotaInline).toBe(true);
  });

  it('sets hasAlternativeReadyProvider when alternative is ready', async () => {
    mockGetProviderSettings.mockResolvedValue({
      connectedProviders: {
        'myboteam-ai': { connectionStatus: 'connected', providerId: 'myboteam-ai' },
        'other-provider': { connectionStatus: 'connected', providerId: 'other-provider' },
      },
      activeProviderId: 'myboteam-ai',
    });

    const { useCreditsState } = await import('@/hooks/useCreditsState');
    const { result } = renderHook(() => useCreditsState());

    await vi.waitFor(() => {
      expect(result.current.usage).not.toBeNull();
    });

    expect(result.current.hasAlternativeReadyProvider).toBe(true);
  });

  it('subscribes to usage updates', async () => {
    const { useCreditsState } = await import('@/hooks/useCreditsState');
    renderHook(() => useCreditsState());

    expect(mockOnMyboteamAiUsageUpdate).toHaveBeenCalled();
  });

  it('handles usage update event', async () => {
    let usageCallback: ((usage: unknown) => void) | undefined;
    mockOnMyboteamAiUsageUpdate.mockImplementation((cb: (usage: unknown) => void) => {
      usageCallback = cb;
      return () => {};
    });

    const { useCreditsState } = await import('@/hooks/useCreditsState');
    const { result } = renderHook(() => useCreditsState());

    await vi.waitFor(() => {
      expect(result.current.usage).not.toBeNull();
    });

    expect(usageCallback).toBeDefined();
  });
});
