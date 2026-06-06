import { classifyErrorCategory } from '@main/analytics/error-classifier';
import { describe, expect, it } from 'vitest';

describe('classifyErrorCategory', () => {
  describe('auth errors', () => {
    it('should classify AuthenticationError as auth_error', () => {
      expect(classifyErrorCategory('AuthenticationError')).toBe('auth_error');
    });

    it('should classify OAuth errors as auth_error', () => {
      expect(classifyErrorCategory('OAuthError')).toBe('auth_error');
    });

    it('should classify Unauthorized as auth_error', () => {
      expect(classifyErrorCategory('Unauthorized')).toBe('auth_error');
    });

    it('should classify AccessDenied as auth_error', () => {
      expect(classifyErrorCategory('AccessDenied')).toBe('auth_error');
    });

    it('should classify InvalidSignature as auth_error', () => {
      expect(classifyErrorCategory('InvalidSignature')).toBe('auth_error');
    });
  });

  describe('rate limit errors', () => {
    it('should classify ThrottlingException as rate_limit', () => {
      expect(classifyErrorCategory('ThrottlingException')).toBe('rate_limit');
    });

    it('should classify rate_limit strings as rate_limit', () => {
      expect(classifyErrorCategory('rate_limit_exceeded')).toBe('rate_limit');
    });

    it('should classify 429 as rate_limit', () => {
      expect(classifyErrorCategory('HTTP 429')).toBe('rate_limit');
    });
  });

  describe('timeout errors', () => {
    it('should classify TimeoutError as timeout', () => {
      expect(classifyErrorCategory('TimeoutError')).toBe('timeout');
    });

    it('should classify AbortError as timeout', () => {
      expect(classifyErrorCategory('AbortError')).toBe('timeout');
    });
  });

  describe('network errors', () => {
    it('should classify NetworkError as network_error', () => {
      expect(classifyErrorCategory('NetworkError')).toBe('network_error');
    });

    it('should classify ECONNREFUSED as network_error', () => {
      expect(classifyErrorCategory('ECONNREFUSED')).toBe('network_error');
    });

    it('should classify ENOTFOUND as network_error', () => {
      expect(classifyErrorCategory('ENOTFOUND')).toBe('network_error');
    });

    it('should classify 503 as network_error', () => {
      expect(classifyErrorCategory('HTTP 503')).toBe('network_error');
    });
  });

  describe('context overflow errors', () => {
    it('should classify ContextOverflowError as context_overflow', () => {
      expect(classifyErrorCategory('ContextOverflowError')).toBe('context_overflow');
    });

    it('should classify n_keep as context_overflow', () => {
      expect(classifyErrorCategory('n_keep')).toBe('context_overflow');
    });

    it('should classify n_ctx as context_overflow', () => {
      expect(classifyErrorCategory('n_ctx')).toBe('context_overflow');
    });

    it('should classify context window too small as context_overflow', () => {
      expect(classifyErrorCategory('context window is too small')).toBe('context_overflow');
    });

    it('should classify context size exceeded as context_overflow', () => {
      expect(classifyErrorCategory('context size has been exceeded')).toBe('context_overflow');
    });

    it('should classify exceeds available context as context_overflow', () => {
      expect(classifyErrorCategory('exceeds the available context size')).toBe('context_overflow');
    });
  });

  describe('user interruption errors', () => {
    it('should classify Interrupt as user_interrupted', () => {
      expect(classifyErrorCategory('Interrupt')).toBe('user_interrupted');
    });

    it('should classify Cancel as user_interrupted', () => {
      expect(classifyErrorCategory('Cancel')).toBe('user_interrupted');
    });

    it('should classify Abort as user_interrupted', () => {
      expect(classifyErrorCategory('Abort')).toBe('user_interrupted');
    });
  });

  describe('tool errors', () => {
    it('should classify tool_error as tool_error', () => {
      expect(classifyErrorCategory('tool_error')).toBe('tool_error');
    });

    it('should classify ValidationError as tool_error', () => {
      expect(classifyErrorCategory('ValidationError')).toBe('tool_error');
    });
  });

  describe('unknown errors', () => {
    it('should return unknown for unrecognized error names', () => {
      expect(classifyErrorCategory('SomeRandomError')).toBe('unknown');
    });

    it('should return unknown for empty string', () => {
      expect(classifyErrorCategory('')).toBe('unknown');
    });
  });

  describe('non-string inputs', () => {
    it('should handle null', () => {
      expect(classifyErrorCategory(null)).toBe('unknown');
    });

    it('should handle undefined', () => {
      expect(classifyErrorCategory(undefined)).toBe('unknown');
    });

    it('should handle numbers', () => {
      expect(classifyErrorCategory(123)).toBe('unknown');
    });

    it('should handle objects', () => {
      expect(classifyErrorCategory({})).toBe('unknown');
    });
  });
});
