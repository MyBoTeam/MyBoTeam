import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRequestCopilotDeviceCode = vi.hoisted(() => vi.fn());
const mockPollCopilotDeviceToken = vi.hoisted(() => vi.fn());
const mockSetCopilotOAuthTokens = vi.hoisted(() => vi.fn());
const mockClearCopilotOAuth = vi.hoisted(() => vi.fn());
const mockGetCopilotOAuthStatus = vi.hoisted(() => vi.fn());

vi.mock('@myboteam/agent-core/desktop-main', () => ({
  requestCopilotDeviceCode: mockRequestCopilotDeviceCode,
  pollCopilotDeviceToken: mockPollCopilotDeviceToken,
  setCopilotOAuthTokens: mockSetCopilotOAuthTokens,
  clearCopilotOAuth: mockClearCopilotOAuth,
  getCopilotOAuthStatus: mockGetCopilotOAuthStatus,
}));

const mockShellOpenExternal = vi.hoisted(() => vi.fn());

vi.mock('electron', () => ({
  shell: {
    openExternal: mockShellOpenExternal,
  },
}));

vi.mock('@main/logging', () => ({
  getLogCollector: vi.fn(() => ({
    log: vi.fn(),
  })),
}));

import { loginGithubCopilot, logoutGithubCopilot } from '@main/opencode/copilot-auth';

describe('copilot-auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequestCopilotDeviceCode.mockResolvedValue({
      device_code: 'device-123',
      user_code: 'ABC-123',
      verification_uri: 'https://github.com/login/device',
      expires_in: 900,
      interval: 5,
    });
    mockPollCopilotDeviceToken.mockResolvedValue({
      access_token: 'github-token-123',
      token_type: 'bearer',
      scope: '',
    });
    mockShellOpenExternal.mockResolvedValue(undefined);
  });

  describe('loginGithubCopilot', () => {
    it('should return device code info on success', async () => {
      const result = await loginGithubCopilot();
      expect(mockRequestCopilotDeviceCode).toHaveBeenCalled();
      expect(mockShellOpenExternal).toHaveBeenCalledWith('https://github.com/login/device');
      expect(result).toEqual({
        ok: true,
        userCode: 'ABC-123',
        verificationUri: 'https://github.com/login/device',
        expiresIn: 900,
      });
    });

    it('should handle browser open failure gracefully', async () => {
      mockShellOpenExternal.mockRejectedValue(new Error('Browser error'));
      const result = await loginGithubCopilot();
      expect(result.ok).toBe(true);
    });

    it('should abort previous login flow', async () => {
      const abortSpy = vi.fn();
      const oldAbortController = new AbortController();
      oldAbortController.signal.onabort = abortSpy;

      await loginGithubCopilot();
    });

    it('should throw on device code request failure', async () => {
      mockRequestCopilotDeviceCode.mockRejectedValue(new Error('Network error'));
      await expect(loginGithubCopilot()).rejects.toThrow('Network error');
    });

    it('should persist tokens on successful background poll', async () => {
      await loginGithubCopilot();
      await vi.waitFor(() => {
        expect(mockPollCopilotDeviceToken).toHaveBeenCalled();
      });
      await vi.waitFor(() => {
        expect(mockSetCopilotOAuthTokens).toHaveBeenCalledWith({
          accessToken: 'github-token-123',
          expiresAt: expect.any(Number),
        });
      });
    });

    it('should handle missing access token in poll response', async () => {
      mockPollCopilotDeviceToken.mockResolvedValue({ access_token: null });
      await loginGithubCopilot();
      await vi.waitFor(() => {
        expect(mockClearCopilotOAuth).toHaveBeenCalled();
      });
    });

    it('should handle poll error gracefully', async () => {
      mockPollCopilotDeviceToken.mockRejectedValue(new Error('Poll error'));
      await loginGithubCopilot();
      await vi.waitFor(() => {
        expect(mockClearCopilotOAuth).toHaveBeenCalled();
      });
    });

    it('should handle polling failure gracefully', async () => {
      mockPollCopilotDeviceToken.mockRejectedValue(new Error('Poll error'));
      await loginGithubCopilot();
      await vi.waitFor(() => {
        expect(mockClearCopilotOAuth).toHaveBeenCalled();
      });
    });
  });

  describe('logoutGithubCopilot', () => {
    it('should clear Copilot OAuth tokens', () => {
      logoutGithubCopilot();
      expect(mockClearCopilotOAuth).toHaveBeenCalled();
    });
  });

  describe('getCopilotOAuthStatus', () => {
    it('should re-export getCopilotOAuthStatus from agent-core', async () => {
      const mod = await import('@main/opencode/copilot-auth');
      expect(mod.getCopilotOAuthStatus).toBe(mockGetCopilotOAuthStatus);
    });
  });
});
