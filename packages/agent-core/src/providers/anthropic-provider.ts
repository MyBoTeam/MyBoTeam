import Anthropic from '@anthropic-ai/sdk';
import type { ChatRequest, ChatResponse, ModelInfo, StreamingChunk } from '@myboteam/types';
import { ConcurrencyLimiter } from './concurrency-limiter.js';
import type { ProviderHealth } from './health-check.js';
import { checkHealth } from './health-check.js';
import type { ProviderMetrics } from './metrics.js';
import { MetricsEmitter } from './metrics.js';
import { ModelFallback } from './model-fallback.js';
import type { ProviderConfig } from './provider-config.js';
import { toProviderError } from './provider-errors.js';
import { executeStreamWithFallback, executeWithFallback } from './provider-helpers.js';
import { RetryHandler } from './retry-handler.js';

export class AnthropicProvider {
  private readonly client: Anthropic;
  private readonly limiter: ConcurrencyLimiter;
  private readonly fallback: ModelFallback;
  private readonly metrics: MetricsEmitter;
  private readonly retryHandler: RetryHandler;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
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
      'anthropic',
      this.limiter,
      this.fallback,
      this.retryHandler,
      (model) => this.executeChatCompletion({ ...request, model }),
    );
  }

  private async executeChatCompletion(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    const systemMessages = request.messages
      .filter((msg) => msg.role === 'system')
      .map((msg) => msg.content)
      .join('\n\n');
    const nonSystemMessages = request.messages.filter((msg) => msg.role !== 'system');

    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model: request.model,
        max_tokens: (request.options?.maxTokens as number) ?? 4096,
        system: systemMessages || undefined,
        messages: nonSystemMessages.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        tools: request.tools?.map((tool) => ({
          name: tool.name,
          description: tool.description,
          input_schema: tool.parameters as Anthropic.Tool['input_schema'],
        })),
        temperature: request.options?.temperature as number | undefined,
      });
    } catch (error) {
      throw toProviderError(error, 'anthropic');
    }

    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );

    const toolCalls = toolUseBlocks.map((block) => ({
      id: block.id,
      name: block.name,
      arguments: block.input as Record<string, unknown>,
    }));

    const metrics: ProviderMetrics = {
      requestDuration: Date.now() - startTime,
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    };

    this.metrics.emit(metrics);

    return {
      message: {
        role: 'assistant',
        content: content || '',
        timestamp: new Date().toISOString(),
      },
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        promptTokens: metrics.promptTokens,
        completionTokens: metrics.completionTokens,
        totalTokens: metrics.totalTokens,
      },
    };
  }

  async *streamChat(request: ChatRequest): AsyncIterable<StreamingChunk> {
    yield* executeStreamWithFallback(request, 'anthropic', this.limiter, this.fallback, (model) =>
      this.executeStreamChat({ ...request, model }),
    );
  }

  private async *executeStreamChat(request: ChatRequest): AsyncIterable<StreamingChunk> {
    const startTime = Date.now();
    const systemMessages = request.messages
      .filter((msg) => msg.role === 'system')
      .map((msg) => msg.content)
      .join('\n\n');
    const nonSystemMessages = request.messages.filter((msg) => msg.role !== 'system');

    let stream: any;
    try {
      stream = this.client.messages.stream({
        model: request.model,
        max_tokens: (request.options?.maxTokens as number) ?? 4096,
        system: systemMessages || undefined,
        messages: nonSystemMessages.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        tools: request.tools?.map((tool) => ({
          name: tool.name,
          description: tool.description,
          input_schema: tool.parameters as Anthropic.Tool['input_schema'],
        })),
        temperature: request.options?.temperature as number | undefined,
      });
    } catch (error) {
      throw toProviderError(error, 'anthropic');
    }

    let firstChunk = true;
    const toolCallsMap = new Map<number, { id: string; name: string; arguments: string }>();

    for await (const event of stream) {
      if (firstChunk && event.type === 'content_block_delta') {
        const ttfc = Date.now() - startTime;
        this.metrics.emit({
          requestDuration: ttfc,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          timeToFirstChunk: ttfc,
        });
        firstChunk = false;
      }

      if (event.type === 'content_block_start') {
        const block = event.content_block;
        if (block.type === 'tool_use') {
          toolCallsMap.set(event.index, {
            id: block.id,
            name: block.name,
            arguments: '',
          });
        }
      }

      if (event.type === 'content_block_delta') {
        const delta = event.delta;
        if (delta.type === 'text_delta') {
          yield { content: delta.text };
        } else if (delta.type === 'input_json_delta') {
          const existing = toolCallsMap.get(event.index);
          if (existing) {
            existing.arguments += delta.partial_json;
          }
        }
      }

      if (event.type === 'message_stop') {
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
        name: model.display_name ?? model.id,
        provider: 'anthropic',
        capabilities: { tools: true, vision: true, streaming: true },
      }));
    } catch (error) {
      const providerError = toProviderError(error, 'anthropic');
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
