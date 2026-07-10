import type { ProviderError } from '@myboteam/types';

export type FailureClassification = 'transient' | 'permanent';

const PERMANENT_ERROR_PATTERNS = [
  'ENOTFOUND',
  'ECONNREFUSED',
  'ERR_SSL',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'CERT_HAS_EXPIRED',
  'AUTHENTICATION_ERROR',
  'VALIDATION_ERROR',
  'NOT_FOUND',
];

const PERMANENT_STATUS_CODES = new Set([400, 401, 403, 404, 422]);

/**
 * Classifies a provider error as transient or permanent.
 *
 * **Transient** (no dead-host cooldown, retry within-provider):
 * - HTTP 429 (rate limit)
 * - HTTP 5xx (server errors)
 * - Request timeouts
 *
 * **Permanent** (trigger fallback, may enter dead-host cooldown):
 * - HTTP 400/401/403/404 (invalid request, auth, not found)
 * - DNS resolution failures (ENOTFOUND)
 * - SSL/TLS errors (ERR_SSL, CERT_HAS_EXPIRED)
 * - Connection refused (ECONNREFUSED)
 *
 * @see FR-009 in spec.md for full classification rules
 */
export function classifyFailure(error: ProviderError): FailureClassification {
  const code = error.code;
  const status = error.statusCode;
  const message = error.providerMessage ?? error.message;

  if (PERMANENT_ERROR_PATTERNS.some((p) => code.includes(p) || message.includes(p))) {
    return 'permanent';
  }

  if (status !== undefined && PERMANENT_STATUS_CODES.has(status)) {
    return 'permanent';
  }

  return 'transient';
}

/**
 * Convenience wrapper: returns true if the error is transient (safe to retry within-provider).
 *
 * @see classifyFailure for classification details
 */
export function classifyTransient(error: ProviderError): boolean {
  return classifyFailure(error) === 'transient';
}

/**
 * Convenience wrapper: returns true if the error is permanent (should trigger fallback).
 *
 * @see classifyFailure for classification details
 */
export function classifyPermanent(error: ProviderError): boolean {
  return classifyFailure(error) === 'permanent';
}

/**
 * Determines if a provider error is retryable for routing decisions.
 * Equivalent to `classifyTransient()` — transient errors are safe to retry.
 */
export function isRetryableForRouting(error: ProviderError): boolean {
  return classifyTransient(error);
}
