import type { ProviderError } from '@myboteam/types';

export function mapHttpError(
  status: number,
  message: string,
  provider: string,
  rateLimitHeaders?: { remaining?: string; reset?: string },
): ProviderError {
  if (status === 401 || status === 403) {
    return {
      category: 'auth',
      code: 'AUTHENTICATION_ERROR',
      message,
      statusCode: status,
      retryable: false,
      provider,
      providerMessage: message,
    };
  }

  if (status === 429) {
    return {
      category: 'rate_limit',
      code: 'RATE_LIMIT_ERROR',
      message,
      statusCode: status,
      retryable: true,
      provider,
      providerMessage: message,
      details: rateLimitHeaders,
    };
  }

  if (status === 408) {
    return {
      category: 'network',
      code: 'TIMEOUT_ERROR',
      message,
      statusCode: status,
      retryable: true,
      provider,
      providerMessage: message,
    };
  }

  if (status >= 500) {
    return {
      category: 'provider',
      code: 'SERVER_ERROR',
      message,
      statusCode: status,
      retryable: true,
      provider,
      providerMessage: message,
    };
  }

  return {
    category: 'provider',
    code: 'API_ERROR',
    message,
    statusCode: status,
    retryable: false,
    provider,
    providerMessage: message,
  };
}

export function mapNetworkError(error: unknown, provider: string): ProviderError {
  const message = error instanceof Error ? error.message : String(error);

  if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
    return {
      category: 'network',
      code: 'TIMEOUT_ERROR',
      message: 'Request timed out',
      retryable: true,
      provider,
      providerMessage: message,
    };
  }

  return {
    category: 'network',
    code: 'CONNECTION_ERROR',
    message: 'Failed to connect to provider',
    retryable: true,
    provider,
    providerMessage: message,
  };
}

export function mapValidationError(
  field: string,
  message: string,
  provider: string,
): ProviderError {
  return {
    category: 'provider',
    code: 'VALIDATION_ERROR',
    message: `Validation failed for ${field}: ${message}`,
    retryable: false,
    provider,
    providerMessage: message,
  };
}
