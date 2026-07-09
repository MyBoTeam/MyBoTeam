import { describe, expect, it } from 'vitest';
import {
  FallbackChainResultSchema,
  FallbackProviderEntrySchema,
  ProviderHealthStateInfoSchema,
  ProviderHealthStateSchema,
  RoutingDecisionSchema,
  RoutingErrorCodeSchema,
  RoutingErrorSchema,
} from '../../src/router.js';

describe('RoutingErrorCodeSchema', () => {
  it('accepts all valid error codes', () => {
    const codes = [
      'PROVIDER_UNAVAILABLE',
      'ALL_PROVIDERS_FAILED',
      'FALLBACK_EXHAUSTED',
      'COOLDOWN_ACTIVE',
      'VAULT_LOCKED',
      'NO_PROVIDER_CONFIGURED',
    ];
    codes.forEach((code) => {
      expect(RoutingErrorCodeSchema.safeParse(code).success).toBe(true);
    });
  });
});

describe('RoutingErrorSchema', () => {
  it('accepts valid routing error', () => {
    const result = RoutingErrorSchema.safeParse({
      code: 'ALL_PROVIDERS_FAILED',
      message: 'All providers failed',
    });
    expect(result.success).toBe(true);
  });

  it('accepts error with optional fields', () => {
    const result = RoutingErrorSchema.safeParse({
      code: 'COOLDOWN_ACTIVE',
      message: 'Provider in cooldown',
      provider: 'p1',
      cooldownExpiresAt: '2026-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid code', () => {
    const result = RoutingErrorSchema.safeParse({
      code: 'INVALID',
      message: 'Error',
    });
    expect(result.success).toBe(false);
  });
});

describe('FallbackProviderEntrySchema', () => {
  it('accepts valid entry', () => {
    const result = FallbackProviderEntrySchema.safeParse({
      providerId: '550e8400-e29b-41d4-a716-446655440000',
      priority: 0,
      source: 'agent',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid source', () => {
    const result = FallbackProviderEntrySchema.safeParse({
      providerId: '550e8400-e29b-41d4-a716-446655440000',
      priority: 0,
      source: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('FallbackChainResultSchema', () => {
  it('accepts valid result', () => {
    const result = FallbackChainResultSchema.safeParse({
      chain: [],
      requestedProviderId: '550e8400-e29b-41d4-a716-446655440000',
      resolvedAt: '2026-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts with entries', () => {
    const result = FallbackChainResultSchema.safeParse({
      chain: [
        {
          providerId: '550e8400-e29b-41d4-a716-446655440000',
          priority: 0,
          source: 'agent',
        },
      ],
      requestedProviderId: '550e8400-e29b-41d4-a716-446655440000',
      resolvedAt: '2026-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });
});

describe('ProviderHealthStateSchema', () => {
  it('accepts all valid states', () => {
    const states = ['healthy', 'degraded', 'cooldown'];
    states.forEach((state) => {
      expect(ProviderHealthStateSchema.safeParse(state).success).toBe(true);
    });
  });
});

describe('ProviderHealthStateInfoSchema', () => {
  it('accepts valid info', () => {
    const result = ProviderHealthStateInfoSchema.safeParse({
      state: 'healthy',
      failureCount: 0,
    });
    expect(result.success).toBe(true);
  });

  it('accepts with optional fields', () => {
    const result = ProviderHealthStateInfoSchema.safeParse({
      state: 'cooldown',
      failureCount: 3,
      cooldownExpiresAt: '2026-01-01T00:00:00Z',
      lastFailureAt: '2026-01-01T00:00:00Z',
      lastSuccessAt: '2026-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });
});

describe('RoutingDecisionSchema', () => {
  it('accepts valid decision', () => {
    const result = RoutingDecisionSchema.safeParse({
      providerId: '550e8400-e29b-41d4-a716-446655440000',
      providerName: 'Test Provider',
      model: 'gpt-4',
      fallbackPosition: 0,
      totalProviders: 2,
      reason: 'Primary provider',
      attemptTimestamp: '2026-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });
});
