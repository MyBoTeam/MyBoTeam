const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^localhost$/i,
  /^\[?::1\]?$/,
  /^\[?fc00:/i,
  /^\[?fd00:/i,
  /^\[?fe80:/i,
  /^\[?::ffff:127\./i,
  /^\[?::ffff:10\./i,
  /^\[?::ffff:172\.(1[6-9]|2\d|3[01])\./i,
  /^\[?::ffff:192\.168\./i,
  /^169\.254\./,
];

function isPrivateHost(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some((p) => p.test(hostname));
}

export class ProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProtocolError';
  }
}

export function validateHttpUrl(urlString: string, fieldName = 'URL'): URL {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new ProtocolError(`${fieldName} must use http or https protocol`);
    }
    if (isPrivateHost(parsed.hostname)) {
      throw new Error(`${fieldName} must not target private or loopback addresses`);
    }
    return parsed;
  } catch (error) {
    if (error instanceof ProtocolError) {
      throw error;
    }
    throw new Error(`${fieldName} is not a valid URL`);
  }
}

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}
