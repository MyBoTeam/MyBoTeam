import { describe, expect, it } from 'vitest';
import { redactPiDiagnosticText, redactPiDiagnosticValue } from '../../src/validation/redaction.js';

describe('Pi diagnostic redaction', () => {
  it('redacts secret-like object fields recursively', () => {
    expect(
      redactPiDiagnosticValue({
        nested: {
          apiKey: 'sk-test-secret-value',
          safe: 'visible',
        },
        connectorToken: 'xoxb-secret-token-value',
      }),
    ).toEqual({
      nested: {
        apiKey: '[REDACTED]',
        safe: 'visible',
      },
      connectorToken: '[REDACTED]',
    });
  });

  it('redacts common secret tokens inside diagnostic text', () => {
    expect(redactPiDiagnosticText('Authorization: Bearer abc.def.secret')).toBe(
      'Authorization: Bearer [REDACTED]',
    );
  });
});
