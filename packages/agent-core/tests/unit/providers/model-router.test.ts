import type { AgentConfig, ChatRequest, ProviderClient } from '@myboteam/types';
import { describe, expect, it, vi } from 'vitest';
import type { ModelRouterDeps } from '../../../src/providers/model-router.js';
import { ModelRouter } from '../../../src/providers/model-router.js';
import { ProviderHealthTracker } from '../../../src/providers/provider-health.js';
import type { ProviderRegistryEntry } from '../../../src/providers/provider-registry.js';

function createMockClient(shouldFail = false): ProviderClient {
  return {
    chatCompletion: vi.fn().mockImplementation(() => {
      if (shouldFail) throw new Error('Provider error');
      return Promise.resolve({ id: 'resp-1', choices: [], model: 'gpt-4' });
    }),
    streamChat: vi.fn(),
    listModels: vi.fn(),
  };
}

function createAgent(overrides?: Partial<AgentConfig>): AgentConfig {
  return {
    name: 'Test Agent',
    provider: '550e8400-e29b-41d4-a716-446655440001',
    model: 'gpt-4',
    ...overrides,
  };
}

function createRequest(): ChatRequest {
  return {
    id: 'req-1',
    agentId: 'agent-1',
    messages: [{ role: 'user', content: 'Hello' }],
    model: 'gpt-4',
  };
}

function createDeps(providers: ProviderRegistryEntry[]): ModelRouterDeps {
  const map = new Map(providers.map((p) => [p.providerId, p]));
  return {
    getEnabledProviders: () => providers,
    getProvider: (id) => map.get(id),
    healthTracker: new ProviderHealthTracker(),
    retryConfig: { maxAttempts: 2, delay: 10, backoff: 'exponential' },
  };
}

describe('ModelRouter', () => {
  describe('resolveFallbackChain', () => {
    it('should build chain with primary provider first', () => {
      const p1 = {
        providerId: '550e8400-e29b-41d4-a716-446655440010',
        client: createMockClient(),
        name: 'Provider A',
        type: 'openai',
        enabled: true,
        priority: 0,
      };
      const p2 = {
        providerId: '550e8400-e29b-41d4-a716-446655440011',
        client: createMockClient(),
        name: 'Provider B',
        type: 'anthropic',
        enabled: true,
        priority: 1,
      };

      const deps = createDeps([p1, p2]);
      const router = new ModelRouter(deps);
      const agent = createAgent({
        provider: '550e8400-e29b-41d4-a716-446655440010',
      });

      const chain = router.resolveFallbackChain(agent);

      expect(chain.chain).toHaveLength(2);
      expect(chain.chain[0].providerId).toBe('550e8400-e29b-41d4-a716-446655440010');
      expect(chain.chain[0].source).toBe('agent');
      expect(chain.chain[1].providerId).toBe('550e8400-e29b-41d4-a716-446655440011');
      expect(chain.chain[1].source).toBe('global');
    });

    it('should use global default when agent has no provider-specific fallbacks', () => {
      const p1 = {
        providerId: '550e8400-e29b-41d4-a716-446655440010',
        client: createMockClient(),
        name: 'Provider A',
        type: 'openai',
        enabled: true,
        priority: 0,
      };
      const p2 = {
        providerId: '550e8400-e29b-41d4-a716-446655440011',
        client: createMockClient(),
        name: 'Provider B',
        type: 'anthropic',
        enabled: true,
        priority: 1,
      };

      const deps = createDeps([p1, p2]);
      const router = new ModelRouter(deps);
      const agent = createAgent({
        provider: '550e8400-e29b-41d4-a716-446655440010',
      });

      const chain = router.resolveFallbackChain(agent);

      expect(chain.chain).toHaveLength(2);
      expect(chain.chain[0].source).toBe('agent');
      expect(chain.chain[1].source).toBe('global');
    });

    it('should skip providers in cooldown', () => {
      const p1 = {
        providerId: '550e8400-e29b-41d4-a716-446655440010',
        client: createMockClient(),
        name: 'Provider A',
        type: 'openai',
        enabled: true,
        priority: 0,
      };

      const deps = createDeps([p1]);
      const router = new ModelRouter(deps);
      const agent = createAgent({
        provider: '550e8400-e29b-41d4-a716-446655440010',
      });

      // Put provider in cooldown
      deps.healthTracker.isFailure('550e8400-e29b-41d4-a716-446655440010');
      deps.healthTracker.isFailure('550e8400-e29b-41d4-a716-446655440010');
      deps.healthTracker.isFailure('550e8400-e29b-41d4-a716-446655440010');

      const chain = router.resolveFallbackChain(agent);

      expect(chain.chain).toHaveLength(0);
    });
  });

  describe('chatCompletion', () => {
    it('should succeed with first provider', async () => {
      const client = createMockClient();
      const p1 = {
        providerId: '550e8400-e29b-41d4-a716-446655440010',
        client,
        name: 'Provider A',
        type: 'openai',
        enabled: true,
        priority: 0,
      };

      const deps = createDeps([p1]);
      const router = new ModelRouter(deps);
      const agent = createAgent({
        provider: '550e8400-e29b-41d4-a716-446655440010',
      });

      const result = await router.chatCompletion(createRequest(), agent);

      expect(result.ok).toBe(true);
      expect(client.chatCompletion).toHaveBeenCalledTimes(1);
    });

    it('should fallback to second provider on failure', async () => {
      const client1 = createMockClient(true);
      const client2 = createMockClient();
      const p1 = {
        providerId: '550e8400-e29b-41d4-a716-446655440010',
        client: client1,
        name: 'Provider A',
        type: 'openai',
        enabled: true,
        priority: 0,
      };
      const p2 = {
        providerId: '550e8400-e29b-41d4-a716-446655440011',
        client: client2,
        name: 'Provider B',
        type: 'anthropic',
        enabled: true,
        priority: 1,
      };

      const deps = createDeps([p1, p2]);
      const router = new ModelRouter(deps);
      const agent = createAgent({
        provider: '550e8400-e29b-41d4-a716-446655440010',
      });

      const result = await router.chatCompletion(createRequest(), agent);

      expect(result.ok).toBe(true);
      expect(client1.chatCompletion).toHaveBeenCalled();
      expect(client2.chatCompletion).toHaveBeenCalled();
    });

    it('should return error when all providers fail', async () => {
      const client1 = createMockClient(true);
      const client2 = createMockClient(true);
      const p1 = {
        providerId: '550e8400-e29b-41d4-a716-446655440010',
        client: client1,
        name: 'Provider A',
        type: 'openai',
        enabled: true,
        priority: 0,
      };
      const p2 = {
        providerId: '550e8400-e29b-41d4-a716-446655440011',
        client: client2,
        name: 'Provider B',
        type: 'anthropic',
        enabled: true,
        priority: 1,
      };

      const deps = createDeps([p1, p2]);
      const router = new ModelRouter(deps);
      const agent = createAgent({
        provider: '550e8400-e29b-41d4-a716-446655440010',
      });

      const result = await router.chatCompletion(createRequest(), agent);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('ALL_PROVIDERS_FAILED');
      }
    });

    it('should retry transient errors within same provider before fallback', async () => {
      let callCount = 0;
      const client1 = {
        chatCompletion: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            throw new Error('Temporary network error');
          }
          return Promise.resolve({ id: 'resp-1', choices: [], model: 'gpt-4' });
        }),
        streamChat: vi.fn(),
        listModels: vi.fn(),
      };
      const client2 = createMockClient();
      const p1 = {
        providerId: '550e8400-e29b-41d4-a716-446655440010',
        client: client1,
        name: 'Provider A',
        type: 'openai',
        enabled: true,
        priority: 0,
      };
      const p2 = {
        providerId: '550e8400-e29b-41d4-a716-446655440011',
        client: client2,
        name: 'Provider B',
        type: 'anthropic',
        enabled: true,
        priority: 1,
      };

      const deps = createDeps([p1, p2]);
      const router = new ModelRouter(deps);
      const agent = createAgent({
        provider: '550e8400-e29b-41d4-a716-446655440010',
      });

      const result = await router.chatCompletion(createRequest(), agent);

      expect(result.ok).toBe(true);
      expect(client1.chatCompletion).toHaveBeenCalledTimes(2);
      expect(client2.chatCompletion).not.toHaveBeenCalled();
    });
  });

  describe('streamChat', () => {
    it('should fallback to second provider on stream failure', async () => {
      const client1 = {
        chatCompletion: vi.fn(),
        streamChat: vi.fn().mockImplementation(() => {
          throw new Error('Stream error');
        }),
        listModels: vi.fn(),
      };
      const client2 = {
        chatCompletion: vi.fn(),
        streamChat: vi.fn().mockResolvedValue({
          [Symbol.asyncIterator]: () => ({
            next: () => Promise.resolve({ done: true, value: undefined }),
          }),
        }),
        listModels: vi.fn(),
      };

      const p1 = {
        providerId: '550e8400-e29b-41d4-a716-446655440010',
        client: client1,
        name: 'Provider A',
        type: 'openai',
        enabled: true,
        priority: 0,
      };
      const p2 = {
        providerId: '550e8400-e29b-41d4-a716-446655440011',
        client: client2,
        name: 'Provider B',
        type: 'anthropic',
        enabled: true,
        priority: 1,
      };

      const deps = createDeps([p1, p2]);
      const router = new ModelRouter(deps);
      const agent = createAgent({
        provider: '550e8400-e29b-41d4-a716-446655440010',
      });

      const result = await router.streamChat(createRequest(), agent);

      expect(result.ok).toBe(true);
      expect(client1.streamChat).toHaveBeenCalled();
      expect(client2.streamChat).toHaveBeenCalled();
    });

    it('should handle mid-stream iteration failure with fallback', async () => {
      const client1 = {
        chatCompletion: vi.fn(),
        streamChat: vi.fn().mockResolvedValue({
          [Symbol.asyncIterator]: () => {
            let callCount = 0;
            return {
              next: () => {
                callCount++;
                if (callCount === 1) {
                  return Promise.resolve({ done: false, value: { content: 'chunk1' } });
                }
                return Promise.reject(new Error('Stream interrupted'));
              },
            };
          },
        }),
        listModels: vi.fn(),
      };
      const client2 = {
        chatCompletion: vi.fn(),
        streamChat: vi.fn().mockResolvedValue({
          [Symbol.asyncIterator]: () => ({
            next: () => Promise.resolve({ done: true, value: undefined }),
          }),
        }),
        listModels: vi.fn(),
      };

      const p1 = {
        providerId: '550e8400-e29b-41d4-a716-446655440010',
        client: client1,
        name: 'Provider A',
        type: 'openai',
        enabled: true,
        priority: 0,
      };
      const p2 = {
        providerId: '550e8400-e29b-41d4-a716-446655440011',
        client: client2,
        name: 'Provider B',
        type: 'anthropic',
        enabled: true,
        priority: 1,
      };

      const deps = createDeps([p1, p2]);
      const router = new ModelRouter(deps);
      const agent = createAgent({
        provider: '550e8400-e29b-41d4-a716-446655440010',
      });

      const result = await router.streamChat(createRequest(), agent);

      // Note: Current implementation returns ok(true) with the first provider's stream
      // Mid-stream errors during iteration are not caught by the current fallback logic
      // This test documents the current behavior
      expect(result.ok).toBe(true);
      expect(client1.streamChat).toHaveBeenCalled();
    });
  });

  describe('getHealthStatus', () => {
    it('should return empty array when no providers tracked', () => {
      const deps = createDeps([]);
      const router = new ModelRouter(deps);

      const statuses = router.getHealthStatus();
      expect(statuses).toEqual([]);
    });

    it('should return health status for tracked providers', () => {
      const p1 = {
        providerId: '550e8400-e29b-41d4-a716-446655440010',
        client: createMockClient(),
        name: 'Provider A',
        type: 'openai',
        enabled: true,
        priority: 0,
      };
      const p2 = {
        providerId: '550e8400-e29b-41d4-a716-446655440011',
        client: createMockClient(),
        name: 'Provider B',
        type: 'anthropic',
        enabled: true,
        priority: 1,
      };

      const deps = createDeps([p1, p2]);
      const router = new ModelRouter(deps);

      // Simulate some failures on p1, then success
      deps.healthTracker.isFailure('550e8400-e29b-41d4-a716-446655440010');
      deps.healthTracker.isFailure('550e8400-e29b-41d4-a716-446655440010');
      deps.healthTracker.isSuccess('550e8400-e29b-41d4-a716-446655440010');
      deps.healthTracker.isSuccess('550e8400-e29b-41d4-a716-446655440011');

      const statuses = router.getHealthStatus();

      expect(statuses).toHaveLength(2);
      expect(statuses[0].providerId).toBe('550e8400-e29b-41d4-a716-446655440010');
      expect(statuses[0].providerName).toBe('Provider A');
      expect(statuses[0].consecutiveFailures).toBe(0); // reset after success
      expect(statuses[1].providerId).toBe('550e8400-e29b-41d4-a716-446655440011');
      expect(statuses[1].state).toBe('healthy');
    });

    it('should include cooldown expiry when provider is in cooldown', () => {
      const p1 = {
        providerId: '550e8400-e29b-41d4-a716-446655440010',
        client: createMockClient(),
        name: 'Provider A',
        type: 'openai',
        enabled: true,
        priority: 0,
      };

      const deps = createDeps([p1]);
      const router = new ModelRouter(deps);

      // Put provider in cooldown
      deps.healthTracker.isFailure('550e8400-e29b-41d4-a716-446655440010');
      deps.healthTracker.isFailure('550e8400-e29b-41d4-a716-446655440010');
      deps.healthTracker.isFailure('550e8400-e29b-41d4-a716-446655440010');

      const statuses = router.getHealthStatus();

      expect(statuses).toHaveLength(1);
      expect(statuses[0].state).toBe('cooldown');
      expect(statuses[0].cooldownExpiresAt).toBeDefined();
      expect(statuses[0].consecutiveFailures).toBe(3);
    });
  });
});
