import type { ChatRequest, ChatResponse, ModelInfo, StreamingChunk } from '@myboteam/types';
import { LocalProviderBase } from './local-provider-base.js';
import { mapValidationError } from './tools/error-mapper.js';
import { isProviderError } from './tools/provider-helpers.js';

export class LMStudioProvider extends LocalProviderBase {
  protected get providerName(): string {
    return 'lmstudio';
  }

  protected buildRequestBody(request: ChatRequest, stream: boolean): Record<string, unknown> {
    return {
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
      stream,
      temperature: request.options?.temperature,
      max_tokens: request.options?.maxTokens,
    };
  }

  async chatCompletion(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      const body = this.buildRequestBody(request, false);
      const data = await this.postJson<{
        choices: Array<{
          message: { content: string | null; role: string };
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
      }>('/v1/chat/completions', body);

      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        throw mapValidationError(
          'choices',
          'Response missing or empty choices array',
          this.providerName,
        );
      }

      const choice = data.choices[0];
      const usage = data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined;

      const durationMs = this.emitMetrics(startTime, usage);

      this.logSuccess(request.model, durationMs, usage?.totalTokens ?? 0);

      return {
        message: {
          role: 'assistant',
          content: choice.message.content ?? '',
          timestamp: new Date().toISOString(),
        },
        toolCalls: choice.tool_calls ? this.parseToolCalls(choice.tool_calls) : undefined,
        usage,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this.handleProviderError(error, request.model, durationMs);
    }
  }

  async *streamChat(request: ChatRequest): AsyncIterable<StreamingChunk> {
    const startTime = Date.now();

    try {
      const body = this.buildRequestBody(request, true);
      const url = new URL('/v1/chat/completions', this.config.endpoint);
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(request.timeout ?? this.config.timeout),
      });

      if (!response.ok) {
        const { parseRateLimitHeaders } = await import('./tools/rate-limit-parser.js');
        const { mapHttpError } = await import('./tools/error-mapper.js');
        const rateLimitHeaders = parseRateLimitHeaders(response.headers);
        throw mapHttpError(
          response.status,
          `HTTP ${response.status}: ${response.statusText}`,
          this.providerName,
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
      let streamCompleted = false;

      try {
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
                streamCompleted = true;
                break;
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
                  const finishReason =
                    choice.finish_reason === 'stop'
                      ? 'stop'
                      : choice.finish_reason === 'tool_calls'
                        ? 'tool_call'
                        : choice.finish_reason === 'length'
                          ? 'length'
                          : 'error';
                  yield { finishReason };
                }
              } catch {
                // Skip malformed JSON lines
              }
            }
          }

          if (streamCompleted) break;
        }
      } finally {
        reader.releaseLock();
      }

      const durationMs = Date.now() - startTime;
      this.logSuccess(request.model, durationMs, 0);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this.handleProviderError(error, request.model, durationMs);
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const data = await this.getJson<{ data: Array<{ id: string; object?: string }> }>(
        '/v1/models',
      );

      return (data.data ?? []).map((model) => ({
        id: model.id,
        name: model.id,
        provider: this.providerName,
        capabilities: {
          tools: true,
          vision: false,
          streaming: true,
        },
      }));
    } catch (error) {
      if (isProviderError(error)) throw error;
      throw (await import('./tools/error-mapper.js')).mapNetworkError(error, this.providerName);
    }
  }

  protected async fetchModels(): Promise<ModelInfo[]> {
    return this.listModels();
  }
}
