import type { ChatRequest, ChatResponse, ModelInfo, StreamingChunk } from '@myboteam/types';
import { mapHttpError, mapNetworkError, mapValidationError } from './tools/error-mapper.js';
import { createLocalMetricsEmitter } from './tools/local-metrics.js';
import type { LocalProviderConfig, ProviderCapability } from './tools/local-provider-types.js';
import { logProviderError, logProviderRequest } from './tools/logger.js';
import { parseRateLimitHeaders } from './tools/rate-limit-parser.js';

export abstract class LocalProviderBase {
  protected readonly config: LocalProviderConfig;
  protected capabilities: ProviderCapability | null = null;
  protected readonly metrics = createLocalMetricsEmitter();

  constructor(config: LocalProviderConfig) {
    this.config = config;
  }

  abstract chatCompletion(request: ChatRequest): Promise<ChatResponse>;
  abstract streamChat(request: ChatRequest): AsyncIterable<StreamingChunk>;
  abstract listModels(): Promise<ModelInfo[]>;
  protected abstract get providerName(): string;
  protected abstract buildRequestBody(
    request: ChatRequest,
    stream: boolean,
  ): Record<string, unknown>;

  async detectCapabilities(): Promise<ProviderCapability> {
    if (this.capabilities) {
      return this.capabilities;
    }

    const timeout = 2000;

    try {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const models = await Promise.race([
        this.fetchModels(),
        new Promise<never>(
          (_, reject) =>
            (timer = setTimeout(() => reject(new Error('Capability detection timeout')), timeout)),
        ),
      ]);
      if (timer !== undefined) clearTimeout(timer);

      this.capabilities = {
        streaming: true,
        tools: this.detectToolSupport(models),
        vision: this.detectVisionSupport(models),
        maxContextWindow: this.detectMaxContextWindow(models),
      };
    } catch {
      this.capabilities = {
        streaming: true,
        tools: false,
        vision: false,
      };
    }

    return this.capabilities;
  }

  protected abstract fetchModels(): Promise<ModelInfo[]>;

  protected detectToolSupport(_models: ModelInfo[]): boolean {
    return false;
  }

  protected detectVisionSupport(_models: ModelInfo[]): boolean {
    return false;
  }

  protected detectMaxContextWindow(_models: ModelInfo[]): number | undefined {
    return undefined;
  }

  protected buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };

    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  protected async postJson<T>(path: string, body: unknown): Promise<T> {
    const url = new URL(path, this.config.endpoint);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      const rateLimitHeaders = parseRateLimitHeaders(response.headers);
      throw mapHttpError(
        response.status,
        `HTTP ${response.status}: ${response.statusText}`,
        this.providerName,
        rateLimitHeaders,
      );
    }

    return response.json() as Promise<T>;
  }

  protected async getJson<T>(path: string): Promise<T> {
    const url = new URL(path, this.config.endpoint);
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.buildHeaders(),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw mapHttpError(
        response.status,
        `HTTP ${response.status}: ${response.statusText}`,
        this.providerName,
      );
    }

    return response.json() as Promise<T>;
  }

  protected handleProviderError(error: unknown, model: string, durationMs: number): never {
    logProviderError(this.providerName, model, error, durationMs);

    if (error && typeof error === 'object' && 'category' in error) {
      throw error;
    }

    throw mapNetworkError(error, this.providerName);
  }

  protected parseToolCalls(
    toolCalls: Array<{ id: string; function: { name: string; arguments: string } }>,
  ) {
    return toolCalls.map((tc) => {
      let parsedArgs: Record<string, unknown>;
      try {
        parsedArgs = JSON.parse(tc.function.arguments);
      } catch {
        throw mapValidationError(
          'tool_calls',
          `Invalid JSON in tool call arguments for ${tc.function.name}`,
          this.providerName,
        );
      }
      return {
        id: tc.id,
        name: tc.function.name,
        arguments: parsedArgs,
      };
    });
  }

  protected emitMetrics(
    startTime: number,
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number },
  ) {
    const durationMs = Date.now() - startTime;
    this.metrics.emit({
      requestDuration: durationMs,
      promptTokens: usage?.promptTokens ?? 0,
      completionTokens: usage?.completionTokens ?? 0,
      totalTokens: usage?.totalTokens ?? 0,
    });
    return durationMs;
  }

  protected logSuccess(model: string, durationMs: number, totalTokens: number) {
    logProviderRequest({
      model,
      duration_ms: durationMs,
      tokens_used: totalTokens,
      provider_name: this.providerName,
      success: true,
    });
  }
}
