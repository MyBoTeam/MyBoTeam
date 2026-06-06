import { describe, expect, it, vi } from 'vitest';

// --- parseElevenLabsErrorMessage tests (no mocking needed) ---

describe('ELEVENLABS_API_TIMEOUT_MS', () => {
  it('is 30000', async () => {
    const { ELEVENLABS_API_TIMEOUT_MS } = await import(
      '../../../src/services/speech-validation.js'
    );
    expect(ELEVENLABS_API_TIMEOUT_MS).toBe(30000);
  });
});

describe('parseElevenLabsErrorMessage', () => {
  it('returns string detail from errorData', async () => {
    const { parseElevenLabsErrorMessage } = await import(
      '../../../src/services/speech-validation.js'
    );
    expect(parseElevenLabsErrorMessage({ detail: 'Invalid voice' }, '', '')).toBe('Invalid voice');
  });

  it('returns message from detail object', async () => {
    const { parseElevenLabsErrorMessage } = await import(
      '../../../src/services/speech-validation.js'
    );
    expect(parseElevenLabsErrorMessage({ detail: { message: 'Rate limited' } }, '', '')).toBe(
      'Rate limited',
    );
  });

  it('returns status from detail object when message is absent', async () => {
    const { parseElevenLabsErrorMessage } = await import(
      '../../../src/services/speech-validation.js'
    );
    expect(parseElevenLabsErrorMessage({ detail: { status: 'error' } }, '', '')).toBe('error');
  });

  it('stringifies non-string detail message', async () => {
    const { parseElevenLabsErrorMessage } = await import(
      '../../../src/services/speech-validation.js'
    );
    expect(parseElevenLabsErrorMessage({ detail: { message: 123 } }, '', '')).toBe('123');
  });

  it('returns JSON stringified detail when message is undefined in detail', async () => {
    const { parseElevenLabsErrorMessage } = await import(
      '../../../src/services/speech-validation.js'
    );
    expect(parseElevenLabsErrorMessage({ detail: { foo: 'bar' } }, '', '')).toBe('{"foo":"bar"}');
  });

  it('returns nested error.message', async () => {
    const { parseElevenLabsErrorMessage } = await import(
      '../../../src/services/speech-validation.js'
    );
    expect(parseElevenLabsErrorMessage({ error: { message: 'Nested error' } }, '', '')).toBe(
      'Nested error',
    );
  });

  it('stringifies nested non-string error.message', async () => {
    const { parseElevenLabsErrorMessage } = await import(
      '../../../src/services/speech-validation.js'
    );
    expect(parseElevenLabsErrorMessage({ error: { message: { code: 500 } } }, '', '')).toBe(
      '{"code":500}',
    );
  });

  it('returns root message', async () => {
    const { parseElevenLabsErrorMessage } = await import(
      '../../../src/services/speech-validation.js'
    );
    expect(parseElevenLabsErrorMessage({ message: 'Root error' }, '', '')).toBe('Root error');
  });

  it('stringifies non-string root message', async () => {
    const { parseElevenLabsErrorMessage } = await import(
      '../../../src/services/speech-validation.js'
    );
    expect(parseElevenLabsErrorMessage({ message: { code: 500 } }, '', '')).toBe('{"code":500}');
  });

  it('falls back to errorText substring (200 chars)', async () => {
    const { parseElevenLabsErrorMessage } = await import(
      '../../../src/services/speech-validation.js'
    );
    expect(parseElevenLabsErrorMessage({}, 'Some raw error text', '')).toBe('Some raw error text');
  });

  it('truncates errorText to 200 chars', async () => {
    const { parseElevenLabsErrorMessage } = await import(
      '../../../src/services/speech-validation.js'
    );
    const longText = 'x'.repeat(500);
    expect(parseElevenLabsErrorMessage({}, longText, '')).toBe('x'.repeat(200));
  });

  it('falls back to statusText', async () => {
    const { parseElevenLabsErrorMessage } = await import(
      '../../../src/services/speech-validation.js'
    );
    expect(parseElevenLabsErrorMessage({}, '', 'Internal Server Error')).toBe(
      'Internal Server Error',
    );
  });

  it('falls back to default message when all empty', async () => {
    const { parseElevenLabsErrorMessage } = await import(
      '../../../src/services/speech-validation.js'
    );
    expect(parseElevenLabsErrorMessage({}, '', '')).toBe('Unknown API error');
  });
});

// --- validateElevenLabsApiKey tests (need fetchWithTimeout mock) ---

const mockFetchWithTimeout = vi.hoisted(() => vi.fn());

vi.mock('../../../src/utils/fetch.js', () => ({
  fetchWithTimeout: mockFetchWithTimeout,
}));

describe('validateElevenLabsApiKey', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns invalid for null key', async () => {
    const { validateElevenLabsApiKey } = await import('../../../src/services/speech-validation.js');
    const result = await validateElevenLabsApiKey(null);
    expect(result).toEqual({ valid: false, error: 'API key is required' });
  });

  it('returns invalid for empty key', async () => {
    const { validateElevenLabsApiKey } = await import('../../../src/services/speech-validation.js');
    const result = await validateElevenLabsApiKey('');
    expect(result).toEqual({ valid: false, error: 'API key is required' });
  });

  it('returns valid for a successful response', async () => {
    mockFetchWithTimeout.mockResolvedValue({ ok: true });
    const { validateElevenLabsApiKey } = await import('../../../src/services/speech-validation.js');
    const result = await validateElevenLabsApiKey('valid-key');
    expect(result).toEqual({ valid: true });
  });

  it('returns invalid for 401', async () => {
    mockFetchWithTimeout.mockResolvedValue({ ok: false, status: 401 });
    const { validateElevenLabsApiKey } = await import('../../../src/services/speech-validation.js');
    const result = await validateElevenLabsApiKey('bad-key');
    expect(result).toEqual({
      valid: false,
      error: 'Invalid API key. Please check your ElevenLabs API key.',
    });
  });

  it('returns invalid for 403', async () => {
    mockFetchWithTimeout.mockResolvedValue({ ok: false, status: 403 });
    const { validateElevenLabsApiKey } = await import('../../../src/services/speech-validation.js');
    const result = await validateElevenLabsApiKey('forbidden-key');
    expect(result).toEqual({
      valid: false,
      error: 'Invalid API key. Please check your ElevenLabs API key.',
    });
  });

  it('returns API error for other status codes', async () => {
    mockFetchWithTimeout.mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue('Server error'),
    });
    const { validateElevenLabsApiKey } = await import('../../../src/services/speech-validation.js');
    const result = await validateElevenLabsApiKey('key');
    expect(result).toEqual({ valid: false, error: 'API error: Server error' });
  });

  it('handles AbortError as timeout', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetchWithTimeout.mockRejectedValue(abortError);
    const { validateElevenLabsApiKey } = await import('../../../src/services/speech-validation.js');
    const result = await validateElevenLabsApiKey('key');
    expect(result).toEqual({
      valid: false,
      error: 'Request timed out. Please check your internet connection.',
    });
  });

  it('handles network errors', async () => {
    mockFetchWithTimeout.mockRejectedValue(new Error('connect ECONNREFUSED'));
    const { validateElevenLabsApiKey } = await import('../../../src/services/speech-validation.js');
    const result = await validateElevenLabsApiKey('key');
    expect(result).toEqual({ valid: false, error: 'Network error: connect ECONNREFUSED' });
  });
});
