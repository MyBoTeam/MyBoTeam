import type { TranscriptionError } from './speech-api.js';

function parseDetailField(detail: unknown): string {
  if (typeof detail === 'string') {
    return detail;
  }
  if (detail && typeof detail === 'object') {
    const detailObj = detail as Record<string, unknown>;
    const msg = detailObj.message ?? detailObj.status;
    if (typeof msg === 'string') {
      return msg;
    }
    if (msg !== undefined) {
      return JSON.stringify(msg);
    }
    return JSON.stringify(detail);
  }
  return '';
}

function parseErrorMessage(
  errorData: Record<string, unknown>,
  errorText: string,
  statusText: string,
): string {
  const detail = (errorData as { detail?: unknown })?.detail;
  if (detail !== undefined) {
    const msg = parseDetailField(detail);
    if (msg) return msg;
  }
  const nestedMsg = (errorData as { error?: { message?: unknown } })?.error?.message;
  if (nestedMsg !== undefined) {
    return typeof nestedMsg === 'string' ? nestedMsg : JSON.stringify(nestedMsg);
  }
  const rootMsg = (errorData as { message?: unknown })?.message;
  if (rootMsg !== undefined) {
    return typeof rootMsg === 'string' ? rootMsg : JSON.stringify(rootMsg);
  }
  return errorText ? errorText.substring(0, 200) : statusText || 'Unknown API error';
}

export async function handleTranscribeErrorResponse(
  response: Response,
): Promise<{ success: false; error: TranscriptionError }> {
  const errorText = await response.text().catch(() => '');
  let errorData: Record<string, unknown> = {};
  try {
    errorData = JSON.parse(errorText);
  } catch {}
  const log = { error: (m: string, d?: Record<string, unknown>) => console.error(m, d) };
  log.error('[ElevenLabs] API error:', {
    status: response.status,
    statusText: response.statusText,
    errorText: errorText.substring(0, 500),
  });
  if (response.status === 401 || response.status === 403) {
    return {
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid or expired ElevenLabs API key. Please check your settings.',
      },
    };
  }
  if (response.status === 429) {
    return {
      success: false,
      error: {
        code: 'RATE_LIMIT',
        message: 'Rate limit exceeded. Please wait a moment and try again.',
      },
    };
  }
  const msg = parseErrorMessage(errorData, errorText, response.statusText);
  return {
    success: false,
    error: { code: 'TRANSCRIPTION_FAILED', message: `Transcription failed: ${msg}` },
  };
}
