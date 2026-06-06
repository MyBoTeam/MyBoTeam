import { describe, expect, it } from 'vitest';
import {
  getOAuthProviderDisplayName,
  isOAuthProviderId,
  OAuthProviderId,
} from '../../../../src/common/types/connector.js';

describe('connector types', () => {
  describe('isOAuthProviderId', () => {
    it('should return true for valid provider IDs', () => {
      expect(isOAuthProviderId('slack')).toBe(true);
      expect(isOAuthProviderId('google')).toBe(true);
      expect(isOAuthProviderId('jira')).toBe(true);
      expect(isOAuthProviderId('github')).toBe(true);
      expect(isOAuthProviderId('monday')).toBe(true);
      expect(isOAuthProviderId('notion')).toBe(true);
      expect(isOAuthProviderId('lightdash')).toBe(true);
      expect(isOAuthProviderId('datadog')).toBe(true);
    });

    it('should return false for invalid provider IDs', () => {
      expect(isOAuthProviderId('')).toBe(false);
      expect(isOAuthProviderId('invalid')).toBe(false);
      expect(isOAuthProviderId('slack ')).toBe(false);
      expect(isOAuthProviderId('SLACK')).toBe(false);
      expect(isOAuthProviderId('')).toBe(false);
    });

    it('should work as a type guard', () => {
      const value: string = 'slack';
      if (isOAuthProviderId(value)) {
        const providerId: OAuthProviderId = value;
        expect(providerId).toBe(OAuthProviderId.Slack);
      }
    });
  });

  describe('getOAuthProviderDisplayName', () => {
    it('should return correct display names', () => {
      expect(getOAuthProviderDisplayName(OAuthProviderId.Slack)).toBe('Slack');
      expect(getOAuthProviderDisplayName(OAuthProviderId.Google)).toBe('Google Drive');
      expect(getOAuthProviderDisplayName(OAuthProviderId.Jira)).toBe('Jira');
      expect(getOAuthProviderDisplayName(OAuthProviderId.GitHub)).toBe('GitHub');
      expect(getOAuthProviderDisplayName(OAuthProviderId.Monday)).toBe('monday.com');
      expect(getOAuthProviderDisplayName(OAuthProviderId.Notion)).toBe('Notion');
      expect(getOAuthProviderDisplayName(OAuthProviderId.Lightdash)).toBe('Lightdash');
      expect(getOAuthProviderDisplayName(OAuthProviderId.Datadog)).toBe('Datadog');
    });

    it('should return undefined or fail gracefully for unknown values', () => {
      // @ts-expect-error testing runtime behavior
      const result = getOAuthProviderDisplayName('unknown');
      expect(result).toBeUndefined();
    });
  });
});
