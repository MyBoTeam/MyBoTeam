/**
 * Utility functions for custom provider configuration.
 *
 * @module custom-utils
 */

/**
 * Masks an API key for safe display in logs and user interfaces.
 *
 * @param apiKey - The API key to mask
 * @returns Masked string in format `****` for short keys, or `xxxx****xxxx` for longer keys
 *
 * @example
 * ```typescript
 * maskApiKey('sk-1234567890abcdef'); // 'sk-1****cdef'
 * maskApiKey('short'); // '****'
 * maskApiKey(undefined); // ''
 * ```
 */
export function maskApiKey(apiKey: string | undefined): string {
  if (!apiKey) return '';
  if (apiKey.length <= 8) return '****';
  return `${apiKey.slice(0, 4)}****${apiKey.slice(-4)}`;
}

/**
 * Classifies network errors into specific error codes with user-facing messages.
 *
 * Handles:
 * - Timeout (AbortError, ABORT_ERR)
 * - DNS resolution failure (ENOTFOUND, getaddrinfo)
 * - Connection refused (ECONNREFUSED)
 * - SSL/TLS errors (ERR_SSL, UNABLE_TO_VERIFY_LEAF_SIGNATURE, CERT_HAS_EXPIRED)
 * - Generic network errors
 *
 * @param error - The error to classify
 * @returns Object with error code and formatted message
 *
 * @example
 * ```typescript
 * const result = classifyNetworkError(new Error('timeout'));
 * // { code: 'NETWORK_TIMEOUT', message: '[NETWORK_TIMEOUT] Connection timed out' }
 * ```
 */
export function classifyNetworkError(error: unknown): { code: string; message: string } {
  const errorObj = error as Error & { code?: string; cause?: Error };
  const errorCode = errorObj.code ?? '';
  const errorMessage = errorObj.message ?? String(error);

  if (errorObj.name === 'AbortError' || errorCode === 'ABORT_ERR') {
    return { code: 'NETWORK_TIMEOUT', message: '[NETWORK_TIMEOUT] Connection timed out' };
  }
  if (errorCode === 'ENOTFOUND' || errorMessage.includes('getaddrinfo')) {
    return {
      code: 'DNS_RESOLUTION_FAILED',
      message: '[DNS_RESOLUTION_FAILED] DNS resolution failed',
    };
  }
  if (errorCode === 'ECONNREFUSED' || errorMessage.includes('ECONNREFUSED')) {
    return {
      code: 'CONNECTION_REFUSED',
      message: '[CONNECTION_REFUSED] Connection refused by server',
    };
  }
  if (
    errorCode === 'ERR_SSL' ||
    errorCode === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
    errorCode === 'CERT_HAS_EXPIRED' ||
    errorMessage.includes('SSL') ||
    errorMessage.includes('TLS')
  ) {
    return { code: 'SSL_ERROR', message: '[SSL_ERROR] SSL/TLS handshake failed' };
  }
  return { code: 'NETWORK_ERROR', message: `[NETWORK_ERROR] ${errorMessage}` };
}

/**
 * Result of response format detection and transformation.
 */
export interface ResponseFormatResult {
  /** The extracted content string */
  content: string;
  /** The detected format type */
  format: 'openai' | 'ai-sdk' | 'generic' | 'unknown';
  /** Optional warning for unrecognized formats */
  warning?: string;
}

/**
 * Detects and transforms response formats from OpenAI-compatible providers.
 *
 * Supports:
 * - OpenAI format: `choices[0].message.content`
 * - Anthropic format: `generations[0].text`
 * - Generic format: `results[0].output`
 *
 * Unrecognized formats are passed through unchanged with a warning.
 *
 * @param data - The response data to detect and transform
 * @returns Object with extracted content, detected format, and optional warning
 *
 * @example
 * ```typescript
 * const openaiResponse = { choices: [{ message: { content: 'Hello' } }] };
 * const result = detectAndTransformResponse(openaiResponse);
 * // { content: 'Hello', format: 'openai' }
 * ```
 */
export function detectAndTransformResponse(data: unknown): ResponseFormatResult {
  if (typeof data !== 'object' || data === null) {
    return { content: String(data), format: 'unknown', warning: 'Unrecognized response format' };
  }

  const obj = data as Record<string, unknown>;

  if (Array.isArray(obj.choices) && obj.choices.length > 0) {
    const choice = obj.choices[0] as Record<string, unknown>;
    if (choice.message && typeof choice.message === 'object') {
      const message = choice.message as Record<string, unknown>;
      if (typeof message.content === 'string') {
        return { content: message.content, format: 'openai' };
      }
    }
  }

  if (Array.isArray(obj.generations) && obj.generations.length > 0) {
    const gen = obj.generations[0] as Record<string, unknown>;
    if (typeof gen.text === 'string') {
      return { content: gen.text, format: 'ai-sdk' };
    }
  }

  if (Array.isArray(obj.results) && obj.results.length > 0) {
    const result = obj.results[0] as Record<string, unknown>;
    if (typeof result.output === 'string') {
      return { content: result.output, format: 'generic' };
    }
  }

  return {
    content: JSON.stringify(data),
    format: 'unknown',
    warning: 'Unrecognized response format, passed through unchanged',
  };
}
