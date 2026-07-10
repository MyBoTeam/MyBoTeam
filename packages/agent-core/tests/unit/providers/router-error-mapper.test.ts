import type { ProviderError } from '@myboteam/types';
import { describe, expect, it } from 'vitest';
import {
  classifyFailure,
  isRetryableForRouting,
} from '../../../src/providers/tools/router-error-mapper.js';

function makeError(overrides: Partial<ProviderError>): ProviderError {
  return {
    category: 'provider',
    code: 'UNKNOWN',
    message: 'test',
    retryable: false,
    ...overrides,
  };
}

describe('classifyFailure', () => {
  it('should classify DNS errors as permanent', () => {
    const error = makeError({
      code: 'CONNECTION_ERROR',
      providerMessage: 'ENOTFOUND api.example.com',
    });
    expect(classifyFailure(error)).toBe('permanent');
  });

  it('should classify connection refused as permanent', () => {
    const error = makeError({
      code: 'CONNECTION_ERROR',
      providerMessage: 'ECONNREFUSED',
    });
    expect(classifyFailure(error)).toBe('permanent');
  });

  it('should classify SSL errors as permanent', () => {
    const error = makeError({
      code: 'SSL_ERROR',
      providerMessage: 'ERR_SSL',
    });
    expect(classifyFailure(error)).toBe('permanent');
  });

  it('should classify auth errors as permanent', () => {
    const error = makeError({
      category: 'auth',
      code: 'AUTHENTICATION_ERROR',
    });
    expect(classifyFailure(error)).toBe('permanent');
  });

  it('should classify 400 as permanent', () => {
    const error = makeError({
      statusCode: 400,
      code: 'API_ERROR',
    });
    expect(classifyFailure(error)).toBe('permanent');
  });

  it('should classify 401 as permanent', () => {
    const error = makeError({ statusCode: 401, code: 'AUTH_ERROR' });
    expect(classifyFailure(error)).toBe('permanent');
  });

  it('should classify 404 as permanent', () => {
    const error = makeError({ statusCode: 404, code: 'NOT_FOUND' });
    expect(classifyFailure(error)).toBe('permanent');
  });

  it('should classify timeouts as transient', () => {
    const error = makeError({
      code: 'TIMEOUT_ERROR',
      statusCode: 408,
    });
    expect(classifyFailure(error)).toBe('transient');
  });

  it('should classify rate limits as transient', () => {
    const error = makeError({
      code: 'RATE_LIMIT_ERROR',
      statusCode: 429,
    });
    expect(classifyFailure(error)).toBe('transient');
  });

  it('should classify 5xx as transient', () => {
    const error = makeError({
      code: 'SERVER_ERROR',
      statusCode: 500,
    });
    expect(classifyFailure(error)).toBe('transient');
  });

  it('should classify unknown errors as transient', () => {
    const error = makeError({
      code: 'UNKNOWN_ERROR',
    });
    expect(classifyFailure(error)).toBe('transient');
  });
});

describe('isRetryableForRouting', () => {
  it('should return true for transient errors', () => {
    const error = makeError({ code: 'TIMEOUT_ERROR', statusCode: 408 });
    expect(isRetryableForRouting(error)).toBe(true);
  });

  it('should return false for permanent errors', () => {
    const error = makeError({ code: 'AUTHENTICATION_ERROR', statusCode: 401 });
    expect(isRetryableForRouting(error)).toBe(false);
  });
});
