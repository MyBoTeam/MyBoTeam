import type { ChatRequest, ChatResponse, ModelInfo, StreamingChunk } from '@myboteam/types';
import { ConcurrencyLimiter } from './tools/concurrency-limiter.js';
import type { ProviderHealth } from './tools/health-check.js';
import { checkHealth } from './tools/health-check.js';
import { createLocalMetricsEmitter } from './tools/local-metrics.js';
import { ModelFallback } from './tools/model-fallback.js';
import type { ProviderConfig } from './tools/provider-config.js';
import { executeStreamWithFallback, executeWithFallback } from './tools/provider-helpers.js';
import { RetryHandler } from './tools/retry-handler.js';

export abstract class CloudProviderBase {
  protected readonly limiter: ConcurrencyLimiter;
  protected readonly fallback: ModelFallback;
  protected readonly metrics = createLocalMetricsEmitter();
  protected readonly retryHandler: RetryHandler;

  constructor(config: ProviderConfig) {
    this.limiter = new ConcurrencyLimiter(config.maxConcurrent ?? 10);
    this.fallback = new ModelFallback();
    this.retryHandler = new RetryHandler(config.retry);
  }

  protected abstract get providerName(): string;
  protected abstract executeChatCompletion(request: ChatRequest): Promise<ChatResponse>;
  protected abstract executeStreamChat(request: ChatRequest): AsyncIterable<StreamingChunk>;
  protected abstract listModelsFromApi(): Promise<ModelInfo[]>;

  async chatCompletion(request: ChatRequest): Promise<ChatResponse> {
    return executeWithFallback(
      request,
      this.providerName,
      this.limiter,
      this.fallback,
      this.retryHandler,
      (model) => this.executeChatCompletion({ ...request, model }),
    );
  }

  async *streamChat(request: ChatRequest): AsyncIterable<StreamingChunk> {
    yield* executeStreamWithFallback(
      request,
      this.providerName,
      this.limiter,
      this.fallback,
      this.retryHandler,
      (model) => this.executeStreamChat({ ...request, model }),
    );
  }

  async listModels(): Promise<ModelInfo[]> {
    return this.listModelsFromApi();
  }

  async healthCheck(): Promise<ProviderHealth> {
    return checkHealth(async () => {
      const startTime = Date.now();
      await this.listModelsFromApi();
      return {
        healthy: true,
        latency: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    });
  }
}
