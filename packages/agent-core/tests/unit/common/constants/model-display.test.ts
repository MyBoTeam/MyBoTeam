import { describe, expect, it } from 'vitest';
import {
  getModelDisplayName,
  MODEL_DISPLAY_NAMES,
  PROVIDER_PREFIXES,
} from '../../../../src/common/constants/model-display.js';

describe('getModelDisplayName', () => {
  it('returns "AI" for empty string', () => {
    expect(getModelDisplayName('')).toBe('AI');
  });

  it('strips provider prefix from anthropic models', () => {
    expect(getModelDisplayName('anthropic/claude-sonnet-4-5')).toBe('Claude Sonnet 4.5');
  });

  it('strips provider prefix from google models', () => {
    expect(getModelDisplayName('google/gemini-2.0-flash')).toBe('Gemini 2.0 Flash');
  });

  it('strips provider prefix from openai models', () => {
    expect(getModelDisplayName('openai/gpt-4o')).toBe('GPT-4o');
  });

  it('handles openrouter format with extra path', () => {
    expect(getModelDisplayName('openrouter/anthropic/claude-sonnet-4-5')).toBe('Claude Sonnet 4.5');
  });

  it('strips date suffixes from model IDs', () => {
    const result = getModelDisplayName('claude-sonnet-4-5-20250514');
    expect(result).toBe('Claude Sonnet 4.5');
  });

  it('falls back to capitalized name for unknown models', () => {
    const result = getModelDisplayName('my-custom-model-v2');
    expect(result).toBe('My Custom Model V2');
  });

  it('returns known display name for exact match', () => {
    expect(getModelDisplayName('gpt-4o-mini')).toBe('GPT-4o Mini');
  });

  it('handles o1 family models', () => {
    expect(getModelDisplayName('openai/o1')).toBe('o1');
    expect(getModelDisplayName('openai/o1-mini')).toBe('o1 Mini');
    expect(getModelDisplayName('openai/o3-mini')).toBe('o3 Mini');
  });

  it('handles provider prefix with custom model', () => {
    expect(getModelDisplayName('bedrock/claude-opus-4')).toBe('Claude Opus 4');
  });
});

describe('PROVIDER_PREFIXES', () => {
  it('includes common providers', () => {
    expect(PROVIDER_PREFIXES).toEqual(
      expect.arrayContaining(['anthropic/', 'openai/', 'google/', 'bedrock/', 'ollama/']),
    );
  });
});

describe('MODEL_DISPLAY_NAMES', () => {
  it('maps known model IDs to display names', () => {
    expect(MODEL_DISPLAY_NAMES['claude-sonnet-4-5']).toBe('Claude Sonnet 4.5');
    expect(MODEL_DISPLAY_NAMES['gpt-4o']).toBe('GPT-4o');
    expect(MODEL_DISPLAY_NAMES['gemini-2.0-flash']).toBe('Gemini 2.0 Flash');
  });
});
