import type { ChatRequest, ChatResponse } from './chat.js';
import type { ProviderError } from './errors.js';
import type { ModelInfo } from './models.js';
import type { StreamingChunk } from './streaming.js';

export interface ProviderClient {
  chatCompletion(request: ChatRequest): Promise<ChatResponse>;
  streamChat(request: ChatRequest): AsyncIterable<StreamingChunk>;
  listModels(): Promise<ModelInfo[]>;
}

export type ProviderClientResult<T> = { ok: true; value: T } | { ok: false; error: ProviderError };
