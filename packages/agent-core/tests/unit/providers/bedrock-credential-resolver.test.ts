import { describe, expect, it, vi } from 'vitest';

const mockFromIni = vi.fn();

vi.mock('@aws-sdk/credential-providers', () => ({
  fromIni: mockFromIni,
}));

import { resolveFromIni } from '../../../src/providers/bedrock-credential-resolver.js';

describe('resolveFromIni', () => {
  it('returns fromIni function from credential-providers', async () => {
    const result = await resolveFromIni();
    expect(result).toBe(mockFromIni);
  });
});
