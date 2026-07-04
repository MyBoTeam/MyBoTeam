import type { ChatRequest, ChatResponse, ModelInfo, StreamingChunk } from '@myboteam/types';
import OpenAI from 'openai';
import { ConcurrencyLimiter } from './tools/concurrency-limiter.js';
import type { ProviderHealth } from './tools/health-check.js';
import { checkHealth } from './tools/health-check.js';
import type { ProviderMetrics } from './tools/metrics.js';
import { MetricsEmitter } from './tools/metrics.js';
import { ModelFallback } from './tools/model-fallback.js';
import type { ProviderConfig } from './tools/provider-config.js';
import { toProviderError } from './tools/provider-errors.js';
import {
  executeStreamWithFallback,
  executeWithFallback,
  safeJsonParse,
} from './tools/provider-helpers.js';
import { RetryHandler } from './retry-handler.js';

export class OpenAIProvider {
  private readonly client: OpenAI;
  private readonly limiter: ConcurrencyLimiter;
  private readonly fallback: ModelFallback;
  private readonly metrics: MetricsEmitter;
  private readonly retryHandler: RetryHandler;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      organization: config.organizationId,
      defaultHeaders: config.customHeaders,
      timeout: config.timeout ?? 120_000,
    });
    this.limiter = new ConcurrencyLimiter(config.maxConcurrent ?? 10);
    this.fallback = new ModelFallback();
    this.metrics = new MetricsEmitter();
    this.retryHandler = new RetryHandler(config.retry);
  }

  async chatCompletion(request: ChatRequest): Promise<ChatResponse> {
    return executeWithFallback(
      request,
      'openai',
      this.limiter,
      this.fallback,
      this.retryHandler,
      (model) => this.executeChatCompletion({ ...request, model }),
    );
  }

  private async executeChatCompletion(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    let response: any;
    try {
      response = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages.map((msg) => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })),
        tools: request.tools?.map((tool) => ({
          type: 'function' as const,
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })),
        temperature: request.options?.temperature as number | undefined,
        max_tokens: request.options?.maxTokens as number | undefined,
      });
    } catch (error) {
      throw toProviderError(error, 'openai');
    }

    const choice = response.choices[0];
    const toolCalls = choice.message.tool_calls?.map((tc: any) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: safeJsonParse(tc.function.arguments),
    }));

    const metrics: ProviderMetrics = {
      requestDuration: Date.now() - startTime,
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      totalTokens: response.usage?.total_tokens ?? 0,
    };

    this.metrics.emit(metrics);

    return {
      message: {
        role: 'assistant',
        content: choice.message.content ?? '',
        timestamp: new Date().toISOString(),
      },
      toolCalls,
      usage: {
        promptTokens: metrics.promptTokens,
        completionTokens: metrics.completionTokens,
        totalTokens: metrics.totalTokens,
      },
    };
  }

  async *streamChat(request: ChatRequest): AsyncIterable<StreamingChunk> {
    yield* executeStreamWithFallback(request, 'openai', this.limiter, this.fallback, (model) =>
      this.executeStreamChat({ ...request, model }),
    );
  }

  private async *executeStreamChat(request: ChatRequest): AsyncIterable<StreamingChunk> {
    const startTime = Date.now();
    let stream: any;
    try {
      stream = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages.map((msg) => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })),
        tools: request.tools?.map((tool) => ({
          type: 'function' as const,
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })),
        stream: true,
        temperature: request.options?.temperature as number | undefined,
        max_tokens: request.options?.maxTokens as number | undefined,
      });
    } catch (error) {
      throw toProviderError(error, 'openai');
    }

    const toolCallsMap = new Map<number, { id: string; name: string; arguments: string }>();
    let ttfcEmitted = false;

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      if (!ttfcEmitted && (choice.delta.content || choice.delta.tool_calls)) {
        const ttfc = Date.now() - startTime;
        this.metrics.emit({
          requestDuration: ttfc,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          timeToFirstChunk: ttfc,
        });
        ttfcEmitted = true;
      }

      if (choice.delta.content) {
        yield { content: choice.delta.content };
      }

      if (choice.delta.tool_calls) {
        for (const tc of choice.delta.tool_calls) {
          const index = tc.index ?? 0;
          const existing = toolCallsMap.get(index);

          if (existing) {
            existing.arguments += tc.function?.arguments ?? '';
          } else {
            toolCallsMap.set(index, {
              id: tc.id ?? `call_${index}`,
              name: tc.function?.name ?? '',
              arguments: tc.function?.arguments ?? '',
            });
          }
        }
      }

      if (choice.finish_reason === 'stop' || choice.finish_reason === 'tool_calls') {
        const toolCalls = Array.from(toolCallsMap.values()).map((tc) => ({
          id: tc.id,
          name: tc.name,
          argumentsDelta: tc.arguments,
        }));

        if (toolCalls.length > 0) {
          for (const toolCall of toolCalls) {
            yield {
              finishReason: 'tool_call',
              toolCall,
            };
          }
        } else {
          yield {
            finishReason: 'stop',
          };
        }
      }
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const response = await this.client.models.list();
      return response.data.map((model) => ({
        id: model.id,
        name: model.id,
        provider: 'openai',
        capabilities: { tools: true, vision: true, streaming: true },
      }));
    } catch (error) {
      const providerError = toProviderError(error, 'openai');
      throw providerError;
    }
  }

  async healthCheck(): Promise<ProviderHealth> {
    return checkHealth(async () => {
      const startTime = Date.now();
      await this.client.models.list();
      return {
        healthy: true,
        latency: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    });
  }
}
