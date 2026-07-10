import type {
  AgentConfig,
  ChatRequest,
  ChatResponse,
  FallbackChainResult,
  FallbackProviderEntry,
  ProviderClient,
  ProviderClientResult,
  ProviderHealthStatus,
  RoutingDecision,
  StreamingChunk,
} from '@myboteam/types';
import { err, ok } from '@myboteam/types';
import { createChildLogger } from '../storage/logger.js';
import type { ProviderHealthTracker } from './provider-health.js';
import type { ProviderRegistryEntry } from './provider-registry.js';
import { RetryHandler } from './tools/retry-handler.js';
import { classifyFailure } from './tools/router-error-mapper.js';

const log = createChildLogger({ module: 'model-router' });

const RETRY_CONFIG = { maxAttempts: 3, delay: 1000, backoff: 'exponential' as const };

export interface ModelRouterDeps {
  getEnabledProviders(): ProviderRegistryEntry[];
  getProvider(id: string): ProviderRegistryEntry | undefined;
  healthTracker: ProviderHealthTracker;
  retryConfig?: { maxAttempts: number; delay: number; backoff: 'linear' | 'exponential' };
}

export class ModelRouter {
  private readonly deps: ModelRouterDeps;

  constructor(deps: ModelRouterDeps) {
    this.deps = deps;
  }

  resolveFallbackChain(agent: AgentConfig): FallbackChainResult {
    const agentIds = agent.fallbackProviderIds;
    const allProviders = this.deps.getEnabledProviders();
    const now = new Date().toISOString();

    const entries: FallbackProviderEntry[] = [];
    const seen = new Set<string>();

    // Primary provider first (from agent config)
    if (
      this.deps.healthTracker.canUse(agent.providerId) &&
      this.deps.getProvider(agent.providerId)
    ) {
      entries.push({ providerId: agent.providerId, priority: 0, source: 'agent' });
      seen.add(agent.providerId);
    }

    // Agent-specified fallback providers
    if (agentIds) {
      for (const id of agentIds) {
        if (!seen.has(id) && this.deps.healthTracker.canUse(id)) {
          const provider = this.deps.getProvider(id);
          if (provider) {
            entries.push({ providerId: id, priority: entries.length, source: 'agent' });
            seen.add(id);
          }
        }
      }
    }

    // Global fallback providers (remaining enabled)
    for (const provider of allProviders) {
      if (!seen.has(provider.providerId) && this.deps.healthTracker.canUse(provider.providerId)) {
        entries.push({
          providerId: provider.providerId,
          priority: entries.length,
          source: 'global',
        });
        seen.add(provider.providerId);
      }
    }

    return {
      chain: entries,
      requestedProviderId: agent.providerId,
      resolvedAt: now,
    };
  }

  async chatCompletion(
    request: ChatRequest,
    agent: AgentConfig,
  ): Promise<ProviderClientResult<ChatResponse>> {
    const chain = this.resolveFallbackChain(agent);
    return this.executeWithFallback(
      chain,
      (client) => client.chatCompletion(request),
      agent.model,
    );
  }

  async streamChat(
    request: ChatRequest,
    agent: AgentConfig,
  ): Promise<ProviderClientResult<AsyncIterable<StreamingChunk>>> {
    const chain = this.resolveFallbackChain(agent);
    return this.executeWithFallback(
      chain,
      (client) => client.streamChat(request),
      agent.model,
    );
  }

  private async executeWithFallback<T>(
    chain: FallbackChainResult,
    execute: (client: ProviderClient) => Promise<T> | T,
    model: string,
  ): Promise<ProviderClientResult<T>> {
    for (const entry of chain.chain) {
      const provider = this.deps.getProvider(entry.providerId);

      if (!provider) {
        log.warn({ providerId: entry.providerId }, 'Provider not found in registry');
        continue;
      }

      const decision: RoutingDecision = {
        providerId: entry.providerId,
        providerName: provider.name,
        model,
        fallbackPosition: entry.priority,
        totalProviders: chain.chain.length,
        reason: entry.priority === 0 ? 'Primary provider' : `Fallback #${entry.priority}`,
        attemptTimestamp: new Date().toISOString(),
      };

      log.debug(decision, 'Attempting provider');

      try {
        const retryHandler = new RetryHandler(this.deps.retryConfig ?? RETRY_CONFIG);
        const result = await retryHandler.execute(
          () => Promise.resolve(execute(provider.client)),
          (error) => {
            const providerError = this.toProviderError(error, provider.name);
            return classifyFailure(providerError) === 'transient';
          },
        );

        this.deps.healthTracker.isSuccess(entry.providerId);

        log.debug({ ...decision, success: true }, 'Provider succeeded');

        return ok(result) as ProviderClientResult<T>;
      } catch (error) {
        const providerError = this.toProviderError(error, provider.name);
        this.deps.healthTracker.isFailure(entry.providerId);

        log.warn(
          {
            ...decision,
            error: providerError.message,
            classification: classifyFailure(providerError),
          },
          'Provider failed',
        );
      }
    }

    return err({
      code: 'ALL_PROVIDERS_FAILED',
      message: 'All providers in fallback chain failed',
    }) as ProviderClientResult<T>;
  }

  getHealthStatus(): ProviderHealthStatus[] {
    const allStates = this.deps.healthTracker.getAll();
    const statuses: ProviderHealthStatus[] = [];

    for (const [providerId, stateInfo] of allStates) {
      const provider = this.deps.getProvider(providerId);
      if (!provider) continue;

      statuses.push({
        providerId,
        providerName: provider.name,
        state: stateInfo.state,
        consecutiveFailures: stateInfo.failureCount,
        cooldownExpiresAt: stateInfo.cooldownExpiresAt,
        lastFailureReason: stateInfo.lastFailureAt
          ? `Last failure at ${stateInfo.lastFailureAt}`
          : undefined,
        lastSuccessAt: stateInfo.lastSuccessAt,
      });
    }

    return statuses;
  }

  private toProviderError(
    error: unknown,
    providerName: string,
  ): {
    code: string;
    message: string;
    category: 'auth' | 'rate_limit' | 'network' | 'provider';
    retryable: boolean;
    provider?: string;
    statusCode?: number;
  } {
    if (error && typeof error === 'object' && 'code' in error) {
      const obj = error as Record<string, unknown>;
      return {
        code: typeof obj.code === 'string' ? obj.code : 'PROVIDER_ERROR',
        message: typeof obj.message === 'string' ? obj.message : String(error),
        category:
          'category' in obj && typeof obj.category === 'string'
            ? (obj.category as 'auth' | 'rate_limit' | 'network' | 'provider')
            : 'provider',
        retryable: 'retryable' in obj && typeof obj.retryable === 'boolean' ? obj.retryable : false,
        provider:
          'provider' in obj && typeof obj.provider === 'string' ? obj.provider : providerName,
        statusCode:
          'statusCode' in obj && typeof obj.statusCode === 'number' ? obj.statusCode : undefined,
      };
    }

    const message = error instanceof Error ? error.message : String(error);
    return {
      code: 'PROVIDER_ERROR',
      message,
      category: 'provider',
      retryable: false,
      provider: providerName,
    };
  }
}
