import { describe, expect, it } from 'vitest';
import { getPiSupportedProviderIds, resolvePiModel } from '../../src/models/pi-model-resolver.js';

const configuredProviderIds = [
  'anthropic',
  'openai',
  'google',
  'xai',
  'deepseek',
  'moonshot',
  'zai',
  'bedrock',
  'azure-foundry',
  'ollama',
  'openrouter',
  'litellm',
  'minimax',
  'lmstudio',
  'vertex',
  'huggingface-local',
  'nebius',
  'together',
  'fireworks',
  'groq',
  'venice',
  'nim',
  'custom',
  'copilot',
] as const;

describe('Pi provider/model resolver', () => {
  it('returns a resolved model or approved exclusion for every configured provider class', () => {
    const results = configuredProviderIds.map((provider) =>
      resolvePiModel({ provider, model: `${provider}/example-model` }),
    );

    expect(results).toHaveLength(configuredProviderIds.length);
    expect(
      results.every((result) => ['resolved', 'approved-exclusion'].includes(result.status)),
    ).toBe(true);
  });

  it('normalizes supported provider prefixes for Pi', () => {
    expect(
      resolvePiModel({ provider: 'openrouter', model: 'openrouter/anthropic/claude' }),
    ).toEqual({
      status: 'resolved',
      provider: 'openrouter',
      api: 'openai-completions',
      model: 'anthropic/claude',
    });
    expect(getPiSupportedProviderIds()).toContain('openai');
  });

  it('records unsupported providers as approved exclusions', () => {
    expect(resolvePiModel({ provider: 'azure-foundry', model: 'azure-foundry/gpt-5' })).toEqual({
      status: 'approved-exclusion',
      provider: 'azure-foundry',
      model: 'azure-foundry/gpt-5',
      reason: 'Provider azure-foundry requires maintainer-approved Pi parity validation',
    });
  });
});
