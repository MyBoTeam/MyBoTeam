import { beforeEach, describe, expect, it, vi } from 'vitest';

const handlers: Record<string, (...args: unknown[]) => unknown> = {};

const mockConnectorAuthStore = vi.hoisted(() => ({
  getServerUrl: vi.fn(),
  setServerUrl: vi.fn(),
  getOAuthStatus: vi.fn(),
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
}));

vi.mock('@main/connectors/connector-auth-registry', () => ({
  getConnectorAuthStore: vi.fn(() => mockConnectorAuthStore),
}));

vi.mock('@main/connectors/connector-token-resolver', () => ({
  connectBuiltInConnector: vi.fn(),
}));

vi.mock('@main/connectors/desktop-connector-state', () => ({
  buildGhAugmentedPath: vi.fn(() => '/augmented/path'),
  GH_BINARY_CANDIDATES: ['gh'],
  isDesktopConnectorConnected: vi.fn(() => false),
  setDesktopConnectorConnected: vi.fn(),
}));

vi.mock('@myboteam/agent-core/common', () => ({
  getConnectorDefinitions: vi.fn(() => [
    { id: 'github', name: 'GitHub' },
    { id: 'lightdash', name: 'Lightdash' },
    { id: 'datadog', name: 'Datadog' },
  ]),
  isOAuthProviderId: vi.fn((id: string) => ['github', 'lightdash', 'datadog'].includes(id)),
  OAuthProviderId: { GitHub: 'github', Lightdash: 'lightdash', Datadog: 'datadog' },
}));

vi.mock('@main/ipc/handlers/utils', () => ({
  handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
    handlers[channel as string] = handler;
  }),
}));

import { registerBuiltInConnectorHandlers } from '@main/ipc/handlers/built-in-connector-handlers';

describe('built-in-connector-handlers', () => {
  beforeEach(() => {
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    vi.clearAllMocks();
    registerBuiltInConnectorHandlers();
  });

  describe('lightdash:get-server-url', () => {
    it('should return stored server URL', async () => {
      mockConnectorAuthStore.getServerUrl.mockResolvedValue('https://lightdash.example.com');
      const result = await handlers['lightdash:get-server-url']();
      expect(result).toBe('https://lightdash.example.com');
    });

    it('should return null when no URL stored', async () => {
      mockConnectorAuthStore.getServerUrl.mockResolvedValue(null);
      const result = await handlers['lightdash:get-server-url']();
      expect(result).toBeNull();
    });
  });

  describe('lightdash:set-server-url', () => {
    it('should validate and store URL', async () => {
      await handlers['lightdash:set-server-url']({} as unknown, 'https://lightdash.example.com');
      expect(mockConnectorAuthStore.setServerUrl).toHaveBeenCalledWith(
        'https://lightdash.example.com',
      );
    });

    it('should throw for invalid URL', async () => {
      await expect(
        handlers['lightdash:set-server-url']({} as unknown, 'not-a-url'),
      ).rejects.toThrow('Invalid Lightdash server URL');
    });

    it('should throw for empty URL', async () => {
      await expect(handlers['lightdash:set-server-url']({} as unknown, '')).rejects.toThrow(
        'Invalid Lightdash server URL',
      );
    });
  });

  describe('datadog:get-server-url', () => {
    it('should return stored Datadog URL', async () => {
      mockConnectorAuthStore.getServerUrl.mockResolvedValue('https://datadoghq.com');
      const result = await handlers['datadog:get-server-url']();
      expect(result).toBe('https://datadoghq.com');
    });
  });

  describe('datadog:set-server-url', () => {
    it('should validate and store Datadog URL', async () => {
      await handlers['datadog:set-server-url']({} as unknown, 'https://datadoghq.com');
      expect(mockConnectorAuthStore.setServerUrl).toHaveBeenCalledWith('https://datadoghq.com');
    });

    it('should throw for invalid Datadog URL', async () => {
      await expect(
        handlers['datadog:set-server-url']({} as unknown, 'ftp://invalid.com'),
      ).rejects.toThrow('Invalid Datadog server URL');
    });
  });

  describe('connectors:get-built-in-auth-status', () => {
    it('should return auth statuses for all connectors', async () => {
      mockConnectorAuthStore.getOAuthStatus.mockResolvedValue({
        connected: true,
        pendingAuthorization: false,
        lastValidatedAt: '2024-01-01',
      });
      const result = await handlers['connectors:get-built-in-auth-status']();
      expect(result).toHaveLength(3);
    });
  });

  describe('connectors:built-in-login', () => {
    it('should call connectBuiltInConnector', async () => {
      const { connectBuiltInConnector } = await import('@main/connectors/connector-token-resolver');
      vi.mocked(connectBuiltInConnector).mockResolvedValue({ ok: true });
      const result = await handlers['connectors:built-in-login']({} as unknown, 'github');
      expect(result).toEqual({ ok: true });
    });

    it('should throw for unknown provider', async () => {
      await expect(handlers['connectors:built-in-login']({} as unknown, 'unknown')).rejects.toThrow(
        'Unknown provider ID',
      );
    });
  });

  describe('connectors:built-in-logout', () => {
    it('should clear tokens for known provider', async () => {
      await handlers['connectors:built-in-logout']({} as unknown, 'lightdash');
      expect(mockConnectorAuthStore.clearTokens).toHaveBeenCalled();
    });

    it('should throw for unknown provider', async () => {
      await expect(
        handlers['connectors:built-in-logout']({} as unknown, 'unknown'),
      ).rejects.toThrow('Unknown provider ID');
    });
  });
});
