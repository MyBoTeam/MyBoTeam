import {
  isExpectedOperationalError,
  isOperationalErrorMessage,
  scrubBreadcrumb,
  scrubEvent,
  scrubString,
} from '@main/sentry-scrub';
import { describe, expect, it } from 'vitest';

describe('sentry-scrub', () => {
  describe('isOperationalErrorMessage', () => {
    it('should return true for quota errors', () => {
      expect(isOperationalErrorMessage('Quota exceeded')).toBe(true);
    });

    it('should return true for billing errors', () => {
      expect(isOperationalErrorMessage('Billing issue')).toBe(true);
    });

    it('should return true for rate limit errors', () => {
      expect(isOperationalErrorMessage('rate_limit_exceeded')).toBe(true);
      expect(isOperationalErrorMessage('Rate limit')).toBe(true);
      expect(isOperationalErrorMessage('too many requests')).toBe(true);
      expect(isOperationalErrorMessage('HTTP 429')).toBe(true);
    });

    it('should return true for invalid API key errors', () => {
      expect(isOperationalErrorMessage('invalid api key')).toBe(true);
    });

    it('should return true for context overflow errors', () => {
      expect(isOperationalErrorMessage('context window is too small')).toBe(true);
      expect(isOperationalErrorMessage('context size has been exceeded')).toBe(true);
    });

    it('should return true for network errors', () => {
      expect(isOperationalErrorMessage('ECONNREFUSED')).toBe(true);
      expect(isOperationalErrorMessage('ECONNRESET')).toBe(true);
      expect(isOperationalErrorMessage('ETIMEDOUT')).toBe(true);
      expect(isOperationalErrorMessage('ENOTFOUND')).toBe(true);
      expect(isOperationalErrorMessage('fetch failed')).toBe(true);
      expect(isOperationalErrorMessage('network error')).toBe(true);
    });

    it('should return true for skill fetch errors', () => {
      expect(isOperationalErrorMessage('skill not found at url')).toBe(true);
      expect(isOperationalErrorMessage('invalid github url')).toBe(true);
    });

    it('should return false for unknown errors', () => {
      expect(isOperationalErrorMessage('Something went wrong')).toBe(false);
    });
  });

  describe('isExpectedOperationalError', () => {
    it('should return true when event message matches', () => {
      const event = {
        message: 'rate_limit_exceeded',
      } as import('@sentry/electron/main').ErrorEvent;
      expect(isExpectedOperationalError(event)).toBe(true);
    });

    it('should return true when exception value matches', () => {
      const event = {
        exception: { values: [{ value: 'quota exceeded' }] },
      } as import('@sentry/electron/main').ErrorEvent;
      expect(isExpectedOperationalError(event)).toBe(true);
    });

    it('should return true when exception type matches', () => {
      const event = {
        exception: { values: [{ type: 'RateLimitError' }] },
      } as import('@sentry/electron/main').ErrorEvent;
      expect(isExpectedOperationalError(event)).toBe(true);
    });

    it('should return false when no exception data', () => {
      const event = {} as import('@sentry/electron/main').ErrorEvent;
      expect(isExpectedOperationalError(event)).toBe(false);
    });

    it('should return false for unknown errors', () => {
      const event = {
        message: 'Some random internal error',
      } as import('@sentry/electron/main').ErrorEvent;
      expect(isExpectedOperationalError(event)).toBe(false);
    });
  });

  describe('scrubString', () => {
    it('should redact OpenAI-style API keys', () => {
      const result = scrubString('sk-proj-abcdefghijklmnopqrstuvwxyz');
      expect(result).toBe('[REDACTED]');
    });

    it('should redact Google AI keys', () => {
      const result = scrubString('AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890');
      expect(result).toBe('[REDACTED]');
    });

    it('should redact Bearer tokens', () => {
      const result = scrubString('Authorization: Bearer abcdefghijklmnopqrstuvwxyz123');
      expect(result).toBe('Authorization: [REDACTED]');
    });

    it('should redact JWK private key fields', () => {
      const result = scrubString('"d": "abc123def456ghi789jkl012mno345pqr678stu901"');
      expect(result).toBe('[REDACTED]');
    });

    it('should redact DPoP nonce values', () => {
      const result = scrubString('dpop_nonce=abcdefghij12345');
      expect(result).toBe('[REDACTED]');
    });

    it('should leave normal text unchanged', () => {
      const input = 'Hello, this is a normal error message without secrets.';
      expect(scrubString(input)).toBe(input);
    });

    it('should handle empty string', () => {
      expect(scrubString('')).toBe('');
    });
  });

  describe('scrubEvent', () => {
    it('should set level to warning for operational errors', () => {
      const event = {
        message: 'rate_limit_exceeded',
      } as import('@sentry/electron/main').ErrorEvent;
      const result = scrubEvent(event);
      expect(result?.level).toBe('warning');
      expect(result?.tags).toEqual({ operational: 'true' });
    });

    it('should scrub sensitive data in message', () => {
      const event = {
        message: 'Error with key sk-proj-abcdefghijklmnopqrstuvwxyz',
      } as import('@sentry/electron/main').ErrorEvent;
      const result = scrubEvent(event);
      expect(result?.message).toContain('[REDACTED]');
      expect(result?.message).not.toContain('sk-proj-');
    });

    it('should scrub exception values', () => {
      const event = {
        exception: {
          values: [{ value: 'Invalid key: sk-proj-abcdefghijklmnopqrstuvwxyz' }],
        },
      } as import('@sentry/electron/main').ErrorEvent;
      const result = scrubEvent(event);
      expect(result?.exception?.values[0].value).toContain('[REDACTED]');
    });

    it('should handle events with no message or exception', () => {
      const event = {} as import('@sentry/electron/main').ErrorEvent;
      const result = scrubEvent(event);
      expect(result).toBe(event);
    });

    it('should scrub breadcrumb data', () => {
      const event = {
        breadcrumbs: [
          {
            message: 'API key: sk-proj-abcdefghijklmnopqrstuvwxyz',
            data: { key: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
          },
        ],
      } as import('@sentry/electron/main').ErrorEvent;
      const result = scrubEvent(event);
      expect(result?.breadcrumbs[0].message).toContain('[REDACTED]');
      expect((result?.breadcrumbs[0].data as Record<string, unknown>).key).toBe('[REDACTED]');
    });
  });

  describe('scrubBreadcrumb', () => {
    it('should return null for console category', () => {
      const breadcrumb = {
        category: 'console',
        message: 'test',
      } as import('@sentry/electron/main').Breadcrumb;
      expect(scrubBreadcrumb(breadcrumb)).toBeNull();
    });

    it('should scrub message for non-console breadcrumbs', () => {
      const breadcrumb = {
        category: 'http',
        message: 'Bearer abcdefghijklmnopqrstuvwxyz123',
      } as import('@sentry/electron/main').Breadcrumb;
      const result = scrubBreadcrumb(breadcrumb);
      expect(result?.message).toContain('[REDACTED]');
    });

    it('should scrub breadcrumb data', () => {
      const breadcrumb = {
        category: 'http',
        data: { authorization: 'Bearer abcdefghijklmnopqrstuvwxyz' },
      } as import('@sentry/electron/main').Breadcrumb;
      const result = scrubBreadcrumb(breadcrumb);
      expect((result?.data as Record<string, unknown>).authorization).toContain('[REDACTED]');
    });

    it('should return the breadcrumb unchanged for non-console without sensitive data', () => {
      const breadcrumb = {
        category: 'http',
        message: 'GET /api/endpoint',
      } as import('@sentry/electron/main').Breadcrumb;
      const result = scrubBreadcrumb(breadcrumb);
      expect(result?.message).toBe('GET /api/endpoint');
    });
  });
});
