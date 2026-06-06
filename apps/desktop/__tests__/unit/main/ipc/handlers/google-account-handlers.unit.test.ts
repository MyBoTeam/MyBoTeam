import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDaemonClient = vi.hoisted(() => ({ call: vi.fn() }));
const mockGetDaemonClient = vi.hoisted(() => vi.fn(() => mockDaemonClient));

const handlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: mockGetDaemonClient,
}));

vi.mock('@main/logging', () => ({
  getLogCollector: vi.fn(() => ({ log: vi.fn() })),
}));

vi.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
    fromWebContents: vi.fn(() => ({ id: 1 })),
  },
}));

const mockStartOAuth = vi.hoisted(() => vi.fn());
const mockCancelOAuth = vi.hoisted(() => vi.fn());

vi.mock('@main/ipc/handlers/utils', () => ({
  handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
    handlers[channel as string] = handler;
  }),
}));

import { registerGoogleAccountHandlers } from '@main/ipc/handlers/google-account-handlers';
import { BrowserWindow } from 'electron';

describe('google-account-handlers', () => {
  beforeEach(() => {
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    vi.clearAllMocks();
    mockGetDaemonClient.mockReturnValue(mockDaemonClient);
    registerGoogleAccountHandlers(mockStartOAuth, mockCancelOAuth);
  });

  describe('gws:accounts:list', () => {
    it('should list accounts from daemon', async () => {
      mockDaemonClient.call.mockResolvedValue([{ email: 'test@example.com' }]);
      const result = await handlers['gws:accounts:list']();
      expect(mockDaemonClient.call).toHaveBeenCalledWith('gwsAccount.list');
      expect(result).toEqual([{ email: 'test@example.com' }]);
    });
  });

  describe('gws:accounts:start-auth', () => {
    it('should start OAuth and dispatch background waitForCallback', async () => {
      const waitForCallback = vi.fn().mockResolvedValue({
        googleAccountId: 'acc-123',
        email: 'test@example.com',
        displayName: 'Test User',
        pictureUrl: null,
        token: { accessToken: 'tok' },
      });
      mockStartOAuth.mockResolvedValue({
        state: 'state-123',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?state=state-123',
        waitForCallback,
      });
      mockDaemonClient.call.mockResolvedValue(undefined);

      const result = await handlers['gws:accounts:start-auth']({} as unknown, 'My Account');
      expect(result).toEqual({ state: 'state-123', authUrl: expect.any(String) });
      expect(mockDaemonClient.call).toHaveBeenCalledWith('gwsAccount.add', {
        input: {
          googleAccountId: 'acc-123',
          email: 'test@example.com',
          displayName: 'Test User',
          pictureUrl: null,
          label: 'My Account',
          connectedAt: expect.any(String),
          token: { accessToken: 'tok' },
        },
      });
    });

    it('should handle account already connected by updating token', async () => {
      const waitForCallback = vi.fn().mockResolvedValue({
        googleAccountId: 'acc-123',
        email: 'test@example.com',
        displayName: 'Test User',
        pictureUrl: null,
        token: { accessToken: 'new-tok' },
      });
      mockStartOAuth.mockResolvedValue({
        state: 'state-123',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?state=state-123',
        waitForCallback,
      });
      mockDaemonClient.call
        .mockRejectedValueOnce(new Error('Account already connected'))
        .mockResolvedValueOnce(undefined);

      await handlers['gws:accounts:start-auth']({} as unknown, 'My Account');

      // Wait for all Promise microtasks to flush
      await vi.waitFor(() => {
        expect(mockDaemonClient.call).toHaveBeenCalledTimes(2);
      });
      expect(mockDaemonClient.call).toHaveBeenNthCalledWith(2, 'gwsAccount.updateToken', {
        googleAccountId: 'acc-123',
        token: { accessToken: 'new-tok' },
        connectedAt: expect.any(String),
      });
    });

    it('should broadcast auth error on waitForCallback rejection', async () => {
      const waitForCallback = vi.fn().mockRejectedValue(new Error('OAuth failed'));
      mockStartOAuth.mockResolvedValue({
        state: 'state-123',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        waitForCallback,
      });

      await handlers['gws:accounts:start-auth']({} as unknown, 'My Account');
      await vi.waitFor(() => {
        expect(BrowserWindow.getAllWindows).toHaveBeenCalled();
      });
    });

    it('should silently handle timeout errors', async () => {
      const waitForCallback = vi.fn().mockRejectedValue(new Error('Google OAuth timed out'));
      mockStartOAuth.mockResolvedValue({
        state: 'state-123',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        waitForCallback,
      });

      await handlers['gws:accounts:start-auth']({} as unknown, 'My Account');
    });
  });

  describe('gws:accounts:complete-auth', () => {
    it('should throw because flow is handled automatically', async () => {
      await expect(
        handlers['gws:accounts:complete-auth']({} as unknown, 'state', 'code'),
      ).rejects.toThrow('This flow is handled automatically');
    });
  });

  describe('gws:accounts:remove', () => {
    it('should remove account via daemon', async () => {
      await handlers['gws:accounts:remove']({} as unknown, 'acc-123');
      expect(mockDaemonClient.call).toHaveBeenCalledWith('gwsAccount.remove', {
        googleAccountId: 'acc-123',
      });
    });
  });

  describe('gws:accounts:update-label', () => {
    it('should update label via daemon', async () => {
      await handlers['gws:accounts:update-label']({} as unknown, 'acc-123', 'New Label');
      expect(mockDaemonClient.call).toHaveBeenCalledWith('gwsAccount.updateLabel', {
        googleAccountId: 'acc-123',
        label: 'New Label',
      });
    });
  });

  describe('gws:accounts:cancel-auth', () => {
    it('should cancel OAuth flow', async () => {
      await handlers['gws:accounts:cancel-auth']({} as unknown, 'state-123');
      expect(mockCancelOAuth).toHaveBeenCalledWith('state-123');
    });
  });
});
