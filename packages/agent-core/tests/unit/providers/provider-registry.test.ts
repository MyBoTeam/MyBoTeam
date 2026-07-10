import { describe, expect, it, vi } from 'vitest';
import type { ProviderClient } from '../../../src/index.js';
import { ProviderRegistry } from '../../../src/providers/provider-registry.js';

function createMockClient(): ProviderClient {
  return {
    chatCompletion: vi.fn(),
    streamChat: vi.fn(),
    listModels: vi.fn(),
  };
}

describe('ProviderRegistry', () => {
  describe('register', () => {
    it('should register a provider', () => {
      const registry = new ProviderRegistry();
      const client = createMockClient();

      registry.register({
        providerId: 'p1',
        client,
        name: 'Test Provider',
        type: 'openai',
        enabled: true,
      });

      expect(registry.size).toBe(1);
      expect(registry.get('p1')).toBeDefined();
      expect(registry.get('p1')?.name).toBe('Test Provider');
    });

    it('should overwrite existing provider', () => {
      const registry = new ProviderRegistry();
      const client = createMockClient();

      registry.register({ providerId: 'p1', client, name: 'V1', type: 'openai', enabled: true });
      registry.register({ providerId: 'p1', client, name: 'V2', type: 'anthropic', enabled: true });

      expect(registry.size).toBe(1);
      expect(registry.get('p1')?.name).toBe('V2');
    });
  });

  describe('unregister', () => {
    it('should remove provider', () => {
      const registry = new ProviderRegistry();
      registry.register({
        providerId: 'p1',
        client: createMockClient(),
        name: 'Test',
        type: 'openai',
        enabled: true,
      });

      expect(registry.unregister('p1')).toBe(true);
      expect(registry.size).toBe(0);
    });

    it('should return false for non-existent', () => {
      const registry = new ProviderRegistry();
      expect(registry.unregister('nonexistent')).toBe(false);
    });
  });

  describe('get / isEnabled / enable / disable', () => {
    it('should track enabled state', () => {
      const registry = new ProviderRegistry();
      registry.register({
        providerId: 'p1',
        client: createMockClient(),
        name: 'Test',
        type: 'openai',
        enabled: true,
      });

      expect(registry.isEnabled('p1')).toBe(true);

      registry.disable('p1');
      expect(registry.isEnabled('p1')).toBe(false);

      registry.enable('p1');
      expect(registry.isEnabled('p1')).toBe(true);
    });

    it('should return false for unknown provider', () => {
      const registry = new ProviderRegistry();
      expect(registry.isEnabled('unknown')).toBe(false);
      expect(registry.enable('unknown')).toBe(false);
      expect(registry.disable('unknown')).toBe(false);
    });
  });

  describe('getAll / getEnabled', () => {
    it('should return providers sorted by registration order', () => {
      const registry = new ProviderRegistry();
      registry.register({
        providerId: 'p3',
        client: createMockClient(),
        name: 'Third',
        type: 'openai',
        enabled: true,
      });
      registry.register({
        providerId: 'p1',
        client: createMockClient(),
        name: 'First',
        type: 'openai',
        enabled: true,
      });
      registry.register({
        providerId: 'p2',
        client: createMockClient(),
        name: 'Second',
        type: 'openai',
        enabled: false,
      });

      const all = registry.getAll();
      expect(all.map((e) => e.providerId)).toEqual(['p3', 'p1', 'p2']);

      const enabled = registry.getEnabled();
      expect(enabled.map((e) => e.providerId)).toEqual(['p3', 'p1']);
    });
  });

  describe('getEnabledByIds', () => {
    it('should filter by IDs and enabled state', () => {
      const registry = new ProviderRegistry();
      registry.register({
        providerId: 'p1',
        client: createMockClient(),
        name: 'Test',
        type: 'openai',
        enabled: true,
      });
      registry.register({
        providerId: 'p2',
        client: createMockClient(),
        name: 'Test',
        type: 'openai',
        enabled: false,
      });
      registry.register({
        providerId: 'p3',
        client: createMockClient(),
        name: 'Test',
        type: 'openai',
        enabled: true,
      });

      const result = registry.getEnabledByIds(['p1', 'p2', 'p3', 'missing']);
      expect(result.map((e) => e.providerId)).toEqual(['p1', 'p3']);
    });
  });
});
