import type { ProviderError } from '@myboteam/types';

export function toProviderError(error: unknown, provider: string): ProviderError {
  if (isSdkError(error)) {
    return mapSdkError(error, provider);
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    category: 'provider',
    code: 'UNKNOWN_ERROR',
    message,
    retryable: false,
    providerMessage: message,
  };
}

const SDK_ERROR_NAMES = new Set([
  'AuthenticationError',
  'PermissionDeniedError',
  'RateLimitError',
  'BadRequestError',
  'NotFoundError',
  'UnprocessableEntityError',
  'APIConnectionError',
  'APIConnectionTimeoutError',
  'InternalServerError',
  'OverloadedError',
]);

function isSdkError(error: unknown): error is {
  status?: number;
  code?: string;
  type?: string;
  message: string;
  error?: unknown;
  name: string;
} {
  return (
    error instanceof Error &&
    (SDK_ERROR_NAMES.has(error.name) ||
      ('status' in error && typeof (error as Record<string, unknown>).status === 'number'))
  );
}

function mapSdkError(
  error: {
    status?: number;
    code?: string;
    type?: string;
    message: string;
    error?: unknown;
    name: string;
  },
  _provider: string,
): ProviderError {
  const status = error.status;
  const message = error.message;

  if (isAuthError(error)) {
    return {
      category: 'auth',
      code: 'AUTHENTICATION_ERROR',
      message,
      statusCode: status,
      retryable: false,
      providerMessage: message,
    };
  }

  if (isRateLimitError(error)) {
    return {
      category: 'rate_limit',
      code: 'RATE_LIMIT_ERROR',
      message,
      statusCode: status,
      retryable: true,
      providerMessage: message,
    };
  }

  if (isConnectionError(error)) {
    return {
      category: 'network',
      code: 'CONNECTION_ERROR',
      message,
      retryable: true,
      providerMessage: message,
    };
  }

  if (isTimeoutError(error)) {
    return {
      category: 'network',
      code: 'TIMEOUT_ERROR',
      message,
      retryable: true,
      providerMessage: message,
    };
  }

  if (isServerError(error)) {
    return {
      category: 'provider',
      code: 'SERVER_ERROR',
      message,
      statusCode: status,
      retryable: true,
      providerMessage: message,
    };
  }

  if (status === 404) {
    return {
      category: 'provider',
      code: 'NOT_FOUND',
      message,
      statusCode: status,
      retryable: false,
      providerMessage: message,
    };
  }

  return {
    category: 'provider',
    code: 'API_ERROR',
    message,
    statusCode: status,
    retryable: false,
    providerMessage: message,
    details: error.error,
  };
}

function isAuthError(error: { name: string; status?: number }): boolean {
  return error.name === 'AuthenticationError' || error.status === 401 || error.status === 403;
}

function isRateLimitError(error: { name: string; status?: number }): boolean {
  return error.name === 'RateLimitError' || error.status === 429;
}

function isConnectionError(error: { name: string }): boolean {
  return error.name === 'APIConnectionError';
}

function isTimeoutError(error: { name: string }): boolean {
  return error.name === 'APIConnectionTimeoutError';
}

function isServerError(error: { status?: number }): boolean {
  const status = error.status;
  return status !== undefined && status >= 500;
}
