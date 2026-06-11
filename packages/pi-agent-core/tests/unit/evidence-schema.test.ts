import { describe, expect, it } from 'vitest';
import { parseValidationEvidenceItem } from '../../src/validation/evidence-schema.js';

describe('validation evidence schema', () => {
  it('accepts a complete evidence item', () => {
    expect(
      parseValidationEvidenceItem({
        status: 'pass',
        scopeItem: 'redaction unit test',
        environment: 'unit',
        commandOrResult: 'pnpm -F @myboteam/pi-agent-core test',
        evidenceLink: 'local output',
        reviewer: 'maintainer',
        secretSafetyNote: 'No credentials used',
      }),
    ).toMatchObject({ status: 'pass', scopeItem: 'redaction unit test' });
  });

  it('rejects missing required review fields', () => {
    expect(() => parseValidationEvidenceItem({ status: 'pass' })).toThrow();
  });
});
