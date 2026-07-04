import type { ChatRequest, ChatResponse, ModelInfo, StreamingChunk } from '@myboteam/types';
import { LocalProviderBase } from './local-provider-base.js';
import { mapHttpError, mapNetworkError } from './tools/error-mapper.js';
import { createLocalMetricsEmitter } from './tools/local-metrics.js';
import { logProviderError, logProviderRequest } from './tools/logger.js';
import { parseRateLimitHeaders } from './tools/rate-limit-parser.js';

export class OllamaProvider extends LocalProviderBase {
  private readonly metrics = createLocalMetricsEmitter();

  async chatCompletion(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      const body = {
        model: request.model,
        messages: request.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        tools: request.tools?.map((tool) => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })),
        stream: false,
        options: {
          temperature: request.options?.temperature,
          num_predict: request.options?.maxTokens,
        },
      };

      const url = new URL('/v1/chat/completions', this.config.endpoint);
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(request.timeout ?? this.config.timeout),
      });

      if (!response.ok) {
        const rateLimitHeaders = parseRateLimitHeaders(response.headers);
        throw mapHttpError(
          response.status,
          `HTTP ${response.status}: ${response.statusText}`,
          'ollama',
          rateLimitHeaders,
        );
      }

      const data = (await response.json()) as {
        choices: Array<{
          message: { content: string; role: string };
          tool_calls?: Array<{
            id: string;
            function: { name: string; arguments: string };
          }>;
        }>;
        usage?: {
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
        };
      };

      const choice = data.choices[0];
      const durationMs = Date.now() - startTime;

      const toolCalls = choice.tool_calls?.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      }));

      const usage = data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined;

      this.metrics.emit({
        requestDuration: durationMs,
        promptTokens: usage?.promptTokens ?? 0,
        completionTokens: usage?.completionTokens ?? 0,
        totalTokens: usage?.totalTokens ?? 0,
      });

      logProviderRequest({
        model: request.model,
        duration_ms: durationMs,
        tokens_used: usage?.totalTokens ?? 0,
        provider_name: 'ollama',
        success: true,
      });

      return {
        message: {
          role: 'assistant',
          content: choice.message.content,
          timestamp: new Date().toISOString(),
        },
        toolCalls,
        usage,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      logProviderError('ollama', request.model, error, durationMs);

      if (error && typeof error === 'object' && 'category' in error) {
        throw error;
      }

      throw mapNetworkError(error, 'ollama');
    }
  }

  async *streamChat(request: ChatRequest): AsyncIterable<StreamingChunk> {
    const startTime = Date.now();

    try {
      const body = {
        model: request.model,
        messages: request.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        tools: request.tools?.map((tool) => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })),
        stream: true,
        options: {
          temperature: request.options?.temperature,
          num_predict: request.options?.maxTokens,
        },
      };

      const url = new URL('/v1/chat/completions', this.config.endpoint);
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(request.timeout ?? this.config.timeout),
      });

      if (!response.ok) {
        const rateLimitHeaders = parseRateLimitHeaders(response.headers);
        throw mapHttpError(
          response.status,
          `HTTP ${response.status}: ${response.statusText}`,
          'ollama',
          rateLimitHeaders,
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let firstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const choice = parsed.choices?.[0];
              if (!choice) continue;

              if (firstChunk) {
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

              if (choice.delta?.content) {
                yield { content: choice.delta.content };
              }

              if (choice.delta?.tool_calls) {
                for (const tc of choice.delta.tool_calls) {
                  yield {
                    toolCall: {
                      id: tc.id ?? `call_${tc.index}`,
                      name: tc.function?.name ?? '',
                      argumentsDelta: tc.function?.arguments ?? '',
                    },
                  };
                }
              }

              if (choice.finish_reason) {
                yield {
                  finishReason: choice.finish_reason === 'stop' ? 'stop' : 'tool_call',
                };
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      }

      const durationMs = Date.now() - startTime;
      logProviderRequest({
        model: request.model,
        duration_ms: durationMs,
        tokens_used: 0,
        provider_name: 'ollama',
        success: true,
      });
    } catch (error) {
      const durationMs = Date.now() - startTime;
      logProviderError('ollama', request.model, error, durationMs);

      if (error && typeof error === 'object' && 'category' in error) {
        throw error;
      }

      throw mapNetworkError(error, 'ollama');
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const data = await this.fetchJson<{ data: Array<{ id: string; object?: string }> }>(
        '/v1/models',
      );

      return (data.data ?? []).map((model) => ({
        id: model.id,
        name: model.id,
        provider: 'ollama',
        capabilities: {
          tools: false,
          vision: false,
          streaming: true,
        },
      }));
    } catch (error) {
      throw mapNetworkError(error, 'ollama');
    }
  }

  protected async fetchModels(): Promise<ModelInfo[]> {
    return this.listModels();
  }
}
