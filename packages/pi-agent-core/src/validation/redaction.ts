const SECRET_KEY_PATTERNS = [/api[-_]?key/i, /authorization/i, /credential/i, /secret/i, /token/i];

const SECRET_VALUE_PATTERNS = [
  /\b(sk-[A-Za-z0-9_-]{12,})\b/g,
  /\b(xox[baprs]-[A-Za-z0-9-]{12,})\b/g,
  /\b(ya29\.[A-Za-z0-9_-]{12,})\b/g,
  /\b(Bearer\s+)[A-Za-z0-9._~+/-]+=*/gi,
];

export function redactPiDiagnosticText(value: string): string {
  return SECRET_VALUE_PATTERNS.reduce(
    (redacted, pattern) =>
      redacted.replace(pattern, (_match, prefix) =>
        typeof prefix === 'string' && prefix.toLowerCase().startsWith('bearer')
          ? `${prefix}[REDACTED]`
          : '[REDACTED]',
      ),
    value,
  );
}

export function redactPiDiagnosticValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactPiDiagnosticText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactPiDiagnosticValue(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SECRET_KEY_PATTERNS.some((pattern) => pattern.test(key))
        ? '[REDACTED]'
        : redactPiDiagnosticValue(item),
    ]),
  );
}
