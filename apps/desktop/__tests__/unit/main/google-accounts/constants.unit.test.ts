import { describe, expect, it } from 'vitest';

describe('Google Accounts Constants', () => {
  it('should export all expected constants', async () => {
    const mod = await import('@main/google-accounts/constants');
    expect(mod.GOOGLE_AUTH_ENDPOINT).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(mod.GOOGLE_TOKEN_ENDPOINT).toBe('https://oauth2.googleapis.com/token');
    expect(mod.GOOGLE_REVOKE_ENDPOINT).toBe('https://oauth2.googleapis.com/revoke');
    expect(mod.GOOGLE_USERINFO_EP).toBe('https://www.googleapis.com/oauth2/v3/userinfo');
  });

  it('should export OAuth scopes', async () => {
    const mod = await import('@main/google-accounts/constants');
    expect(mod.GOOGLE_OAUTH_SCOPES).toContain('openid');
    expect(mod.GOOGLE_OAUTH_SCOPES).toContain('email');
    expect(mod.GOOGLE_OAUTH_SCOPES).toContain('profile');
    expect(mod.GOOGLE_OAUTH_SCOPES).toContain('https://www.googleapis.com/auth/drive.file');
  });

  it('should export callback ports', async () => {
    const mod = await import('@main/google-accounts/constants');
    expect(mod.OAUTH_CALLBACK_PORT_PRIMARY).toBe(4567);
    expect(mod.OAUTH_CALLBACK_PORT_FALLBACK).toBe(4568);
  });

  it('should export token refresh margin constant', async () => {
    const mod = await import('@main/google-accounts/constants');
    expect(mod.TOKEN_REFRESH_MARGIN_MS).toBe(10 * 60 * 1000);
  });

  it('should export gwsTokenKey function', async () => {
    const mod = await import('@main/google-accounts/constants');
    expect(mod.gwsTokenKey('acc-123')).toBe('gws:token:acc-123');
  });
});
