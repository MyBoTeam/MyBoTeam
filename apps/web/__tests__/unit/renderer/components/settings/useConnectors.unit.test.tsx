import { act, renderHook, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';
import { describe, expect, it, vi } from 'vitest';

const mockGetConnectors = vi.fn().mockResolvedValue([]);
const mockGetSlackMcpOauthStatus = vi
  .fn()
  .mockResolvedValue({ connected: false, pendingAuthorization: false });
const mockLoginSlackMcp = vi.fn().mockResolvedValue({ ok: true });
const mockLogoutSlackMcp = vi.fn().mockResolvedValue(undefined);
const mockAddConnector = vi.fn();
const mockDeleteConnector = vi.fn();
const mockSetConnectorEnabled = vi.fn();
const mockStartConnectorOAuth = vi.fn();
const mockDisconnectConnector = vi.fn();
const mockGetBuiltInConnectorAuthStatus = vi.fn().mockResolvedValue([]);
const mockLoginBuiltInConnector = vi.fn().mockRejectedValue(new Error('Auth failed'));
const mockLogoutBuiltInConnector = vi.fn().mockResolvedValue(undefined);
const mockCompleteConnectorOAuth = vi.fn();

vi.mock('@/config/myboteam', () => ({
  getMyBoTeam: () => ({
    getConnectors: mockGetConnectors,
    getSlackMcpOauthStatus: mockGetSlackMcpOauthStatus,
    loginSlackMcp: mockLoginSlackMcp,
    logoutSlackMcp: mockLogoutSlackMcp,
    addConnector: mockAddConnector,
    deleteConnector: mockDeleteConnector,
    setConnectorEnabled: mockSetConnectorEnabled,
    startConnectorOAuth: mockStartConnectorOAuth,
    disconnectConnector: mockDisconnectConnector,
    getBuiltInConnectorAuthStatus: mockGetBuiltInConnectorAuthStatus,
    loginBuiltInConnector: mockLoginBuiltInConnector,
    logoutBuiltInConnector: mockLogoutBuiltInConnector,
    completeConnectorOAuth: mockCompleteConnectorOAuth,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock('@/utils/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { useConnectors } from '@/pages/settings/connectors/components/useConnectors';
import { useConnectorsPanel } from '@/pages/settings/connectors/components/useConnectorsPanel';

describe('useConnectors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConnectors.mockResolvedValue([]);
    mockAddConnector.mockReset();
    mockDeleteConnector.mockReset();
    mockDisconnectConnector.mockReset();
    mockLogoutSlackMcp.mockReset().mockResolvedValue(undefined);
    mockLogoutBuiltInConnector.mockReset().mockResolvedValue(undefined);
    mockCompleteConnectorOAuth.mockReset();
  });

  it('loads connectors on mount', async () => {
    const { result } = renderHook(() => useConnectors());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(mockGetConnectors).toHaveBeenCalled();
    expect(result.current.connectors).toEqual([]);
  });

  it('addConnector calls API and prepends connector', async () => {
    const newConnector = { id: 'c1', name: 'Test', url: 'http://test.com', isEnabled: true };
    mockAddConnector.mockResolvedValue(newConnector);

    const { result } = renderHook(() => useConnectors());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let returned: unknown;
    await act(async () => {
      returned = await result.current.addConnector('Test', 'http://test.com');
    });

    expect(mockAddConnector).toHaveBeenCalledWith('Test', 'http://test.com');
    expect(returned).toEqual(newConnector);
    expect(result.current.connectors).toContainEqual(newConnector);
  });

  it('deleteConnector calls API and removes connector', async () => {
    mockGetConnectors.mockResolvedValue([
      { id: 'c1', name: 'Test', url: 'http://test.com', isEnabled: true },
    ]);
    mockDeleteConnector.mockResolvedValue(undefined);

    const { result } = renderHook(() => useConnectors());
    await waitFor(() => expect(result.current.connectors).toHaveLength(1));

    await act(async () => {
      await result.current.deleteConnector('c1');
    });

    expect(mockDeleteConnector).toHaveBeenCalledWith('c1');
    expect(result.current.connectors).toHaveLength(0);
  });

  it('disconnect calls API and updates status', async () => {
    mockGetConnectors.mockResolvedValue([
      {
        id: 'c1',
        name: 'Test',
        url: 'http://test.com',
        isEnabled: true,
        status: 'connected' as const,
      },
    ]);
    mockDisconnectConnector.mockResolvedValue(undefined);

    const { result } = renderHook(() => useConnectors());
    await waitFor(() => expect(result.current.connectors).toHaveLength(1));

    await act(async () => {
      await result.current.disconnect('c1');
    });

    expect(mockDisconnectConnector).toHaveBeenCalledWith('c1');
    expect(result.current.connectors[0].status).toBe('disconnected');
  });

  it('completeOAuth updates connector when result is returned', async () => {
    const existing = { id: 'c1', name: 'Test', url: 'http://test.com', isEnabled: true };
    const updated = { ...existing, status: 'connected' as const };
    mockGetConnectors.mockResolvedValue([existing]);
    mockCompleteConnectorOAuth.mockResolvedValue(updated);

    const { result } = renderHook(() => useConnectors());
    await waitFor(() => expect(result.current.connectors).toHaveLength(1));

    const resp = await act(async () => result.current.completeOAuth('state123', 'code456'));
    expect(mockCompleteConnectorOAuth).toHaveBeenCalledWith('state123', 'code456');
    expect(resp).toEqual(updated);
    expect(result.current.connectors[0].status).toBe('connected');
  });
});

describe('useConnectorsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConnectors.mockResolvedValue([]);
  });

  it('handleUrlChange updates URL and clears addError', async () => {
    const { result } = renderHook(() => useConnectorsPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleUrlChange('http://example.com');
    });

    expect(result.current.url).toBe('http://example.com');
  });

  it('dismissTabError clears tabError', async () => {
    const { result } = renderHook(() => useConnectorsPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.dismissTabError());
    expect(result.current.tabError).toBeNull();
  });

  it('handleConnect sets tabError when startOAuth fails', async () => {
    mockStartConnectorOAuth.mockRejectedValue(new Error('OAuth failed'));
    const { result } = renderHook(() => useConnectorsPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleConnect('c1');
    });

    expect(mockStartConnectorOAuth).toHaveBeenCalledWith('c1');
    expect(result.current.tabError).toBeTruthy();
  });

  it('handleUrlChange clears addError', async () => {
    const { result } = renderHook(() => useConnectorsPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleUrlChange('http://example.com');
    });

    expect(result.current.addError).toBeNull();
  });

  it('returns required properties', async () => {
    const { result } = renderHook(() => useConnectorsPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current).toHaveProperty('connectors');
    expect(result.current).toHaveProperty('tabError');
    expect(result.current).toHaveProperty('handleAdd');
    expect(result.current).toHaveProperty('refetch');
  });
});
