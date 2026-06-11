import { describe, expect, it } from 'vitest';
import { createPiDiagnosticLogEntry } from '../../src/validation/pi-diagnostic-logger.js';

describe('Pi diagnostic logger redaction', () => {
  it('redacts provider secrets, connector tokens, credential material, and sensitive tool outputs', () => {
    const entry = createPiDiagnosticLogEntry({
      level: 'warn',
      message: 'provider failed with Authorization: Bearer provider.secret.token',
      data: {
        provider: { apiKey: 'sk-provider-secret-value' },
        connector: { token: 'xoxb-connector-token-value' },
        credentialMaterial: { refreshToken: 'ya29.google-refresh-token-value' },
        toolOutput: 'raw output containing sk-tool-secret-value',
      },
    });

    expect(entry).toEqual({
      level: 'warn',
      message: 'provider failed with Authorization: Bearer [REDACTED]',
      data: {
        provider: { apiKey: '[REDACTED]' },
        connector: { token: '[REDACTED]' },
        credentialMaterial: '[REDACTED]',
        toolOutput: 'raw output containing [REDACTED]',
      },
    });
  });
});
