import type { ProviderError } from '@myboteam/types';
import type { ConcurrencyLimiter } from './concurrency-limiter.js';
import type { ModelFallback } from './model-fallback.js';
import type { RetryHandler } from './retry-handler.js';

export function isProviderError(error: unknown): error is ProviderError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'category' in error &&
    'code' in error &&
    'retryable' in error
  );
}

export function safeJsonParse(input: string): Record<string, unknown> {
  try {
    return JSON.parse(input) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function isRetryable(error: unknown): boolean {
  return isProviderError(error) && error.retryable;
}

export async function executeWithFallback<T>(
  request: { model: string },
  provider: string,
  limiter: ConcurrencyLimiter,
  fallback: ModelFallback,
  retryHandler: RetryHandler,
  fn: (model: string) => Promise<T>,
): Promise<T> {
  await limiter.acquire();
  try {
    const modelChain = fallback.getModelChain(request.model, provider);
    let lastError: unknown = null;

    for (const model of modelChain) {
      try {
        return await retryHandler.execute(() => fn(model), isRetryable);
      } catch (error) {
        lastError = error;
        if (!isRetryable(lastError)) {
          throw lastError;
        }
      }
    }

    throw lastError ?? new Error('All models in fallback chain failed');
  } finally {
    limiter.release();
  }
}

export async function* executeStreamWithFallback<T>(
  request: { model: string },
  provider: string,
  limiter: ConcurrencyLimiter,
  fallback: ModelFallback,
  fn: (model: string) => AsyncIterable<T>,
): AsyncIterable<T> {
  await limiter.acquire();
  try {
    const modelChain = fallback.getModelChain(request.model, provider);
    let lastError: unknown = null;

    for (const model of modelChain) {
      try {
        yield* fn(model);
        return;
      } catch (error) {
        lastError = error;
        if (!isRetryable(lastError)) {
          throw lastError;
        }
      }
    }

    throw lastError ?? new Error('All models in fallback chain failed');
  } finally {
    limiter.release();
  }
}
