import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RefreshService, type TokenProvider } from '../../../src/vault/vault-refresh';

describe('vault-refresh', () => {
  let refreshService: RefreshService;

  beforeEach(() => {
    refreshService = new RefreshService();
  });

  describe('registerProvider', () => {
    it('should register a provider successfully', () => {
      const mockProvider: TokenProvider = {
        refresh: vi.fn(),
        supports: vi.fn().mockReturnValue(true),
      };

      refreshService.registerProvider('github', mockProvider);

      expect(refreshService.hasProvider('github')).toBe(true);
    });

    it('should throw error when registering duplicate provider', () => {
      const mockProvider: TokenProvider = {
        refresh: vi.fn(),
        supports: vi.fn().mockReturnValue(true),
      };

      refreshService.registerProvider('github', mockProvider);

      expect(() => refreshService.registerProvider('github', mockProvider)).toThrow(
        'Provider "github" already registered',
      );
    });
  });

  describe('hasProvider', () => {
    it('should return false for unregistered provider', () => {
      expect(refreshService.hasProvider('github')).toBe(false);
    });

    it('should return true for registered provider', () => {
      const mockProvider: TokenProvider = {
        refresh: vi.fn(),
        supports: vi.fn().mockReturnValue(true),
      };

      refreshService.registerProvider('github', mockProvider);

      expect(refreshService.hasProvider('github')).toBe(true);
    });
  });

  describe('refresh', () => {
    it('should throw error for unregistered provider', async () => {
      await expect(refreshService.refresh('github', 'refresh-token', ['email'])).rejects.toThrow(
        'No provider registered for "github"',
      );
    });

    it('should call provider refresh method', async () => {
      const mockProvider: TokenProvider = {
        refresh: vi.fn().mockResolvedValue({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
        }),
        supports: vi.fn().mockReturnValue(true),
      };

      refreshService.registerProvider('github', mockProvider);

      const result = await refreshService.refresh('github', 'refresh-token', ['email']);

      expect(mockProvider.refresh).toHaveBeenCalledWith('refresh-token', ['email']);
      expect(result.accessToken).toBe('new-access-token');
    });
  });
});
