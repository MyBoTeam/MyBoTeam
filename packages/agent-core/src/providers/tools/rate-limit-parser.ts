export interface RateLimitInfo {
  remaining?: string;
  reset?: string;
  limit?: string;
}

export function parseRateLimitHeaders(headers: Headers): RateLimitInfo | undefined {
  const remaining = headers.get('x-ratelimit-remaining');
  const reset = headers.get('x-ratelimit-reset');
  const limit = headers.get('x-ratelimit-limit');

  if (remaining === null && reset === null && limit === null) {
    return undefined;
  }

  return {
    remaining: remaining ?? undefined,
    reset: reset ?? undefined,
    limit: limit ?? undefined,
  };
}
