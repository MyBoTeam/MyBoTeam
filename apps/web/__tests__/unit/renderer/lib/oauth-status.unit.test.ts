import { describe, expect, it } from 'vitest';
import {
  getOAuthStatusKey,
  oauthStatusDotClass,
  oauthStatusTextClass,
} from '@/components/settings/connectors/oauth-status';

describe('oauthStatus constants', () => {
  it('defines text classes for all statuses', () => {
    expect(oauthStatusTextClass.connected).toBe('text-success');
    expect(oauthStatusTextClass.disconnected).toBe('text-muted-foreground');
    expect(oauthStatusTextClass.pending).toBe('text-warning');
  });

  it('defines dot classes for all statuses', () => {
    expect(oauthStatusDotClass.connected).toBe('bg-success');
    expect(oauthStatusDotClass.disconnected).toBe('bg-muted-foreground');
    expect(oauthStatusDotClass.pending).toBe('bg-warning animate-pulse');
  });
});

describe('getOAuthStatusKey', () => {
  it('returns connected when connected is true', () => {
    expect(getOAuthStatusKey({ connected: true, pendingAuthorization: false })).toBe('connected');
    expect(getOAuthStatusKey({ connected: true, pendingAuthorization: true })).toBe('connected');
  });

  it('returns pending when not connected but pendingAuthorization is true', () => {
    expect(getOAuthStatusKey({ connected: false, pendingAuthorization: true })).toBe('pending');
  });

  it('returns disconnected when not connected and not pending', () => {
    expect(getOAuthStatusKey({ connected: false, pendingAuthorization: false })).toBe(
      'disconnected',
    );
  });
});
