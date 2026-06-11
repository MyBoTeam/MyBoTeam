import { describe, expect, it, vi } from 'vitest';
import { createProviderCredentialResolver } from '../../src/models/provider-credential-resolver.js';

describe('Pi provider credential resolver', () => {
  it('retrieves provider keys through the runtime callback', async () => {
    const lookup = vi.fn((providerId: string) => `${providerId}-key`);
    const resolver = createProviderCredentialResolver(lookup);

    await expect(resolver.getApiKey('openai')).resolves.toEqual({
      status: 'available',
      providerId: 'openai',
      apiKey: 'openai-key',
    });
    expect(lookup).toHaveBeenCalledWith('openai');
  });

  it('reports missing credentials without generating auth files', async () => {
    const resolver = createProviderCredentialResolver(() => null);

    await expect(resolver.getApiKey('anthropic')).resolves.toEqual({
      status: 'missing',
      providerId: 'anthropic',
    });
  });
});
