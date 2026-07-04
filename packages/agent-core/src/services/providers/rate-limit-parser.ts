export interface RateLimitInfo {
  remaining?: number;
  reset?: number;
  limit?: number;
}

export function parseRateLimitHeaders(
  headers: Headers,
): RateLimitInfo | null {
  const remaining = headers.get('x-ratelimit-remaining');
  const reset = headers.get('x-ratelimit-reset');
  const limit = headers.get('x-ratelimit-limit');

  if (remaining === null && reset === null && limit === null) {
    return null;
  }

  return {
    remaining: remaining !== null ? Number(remaining) : undefined,
    reset: reset !== null ? Number(reset) : undefined,
    limit: limit !== null ? Number(limit) : undefined,
  };
}
