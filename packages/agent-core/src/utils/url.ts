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
  if (PRIVATE_IP_PATTERNS.some((p) => p.test(hostname))) return true;
  // Handle hex-normalized IPv4-mapped IPv6 (::ffff:7f00:1 for ::ffff:127.0.0.1)
  // URL parser normalizes: 127.0.0.1 → 7f00:1, 10.0.0.1 → a00:1, etc.
  const hexMatch = hostname.match(/^\[?::ffff:([0-9a-f]+):([0-9a-f]+)\]?$/i);
  if (hexMatch) {
    const high = parseInt(hexMatch[1], 16);
    const low = parseInt(hexMatch[2], 16);
    // 127.0.0.0/8 → high=0x7f00 (127*256), low any
    if (high >= 0x7f00 && high <= 0x7fff) return true;
    // 10.0.0.0/8 → high=0x0a00 (10*256), low any
    if (high >= 0x0a00 && high <= 0x0aff) return true;
    // 172.16.0.0/12 → high=0xac00+ (172*256), low 0x1000-0x1fff
    if (high >= 0xac00 && high <= 0xacff && low >= 0x1000 && low <= 0x1fff) return true;
    // 192.168.0.0/16 → high=0xc0a8 (192*256+168), low any
    if (high === 0xc0a8) return true;
    // 0.0.0.0/8 → high=0
    if (high === 0) return true;
    // 169.254.0.0/16 → high=0xa9fe
    if (high === 0xa9fe) return true;
  }
  return false;
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
