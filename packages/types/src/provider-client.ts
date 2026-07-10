import type { ChatRequest, ChatResponse } from './chat.js';
import type { ProviderError } from './errors.js';
import type { ModelInfo } from './models.js';
import type { FallbackProviderEntry } from './router.js';
import type { StreamingChunk } from './streaming.js';

export interface ProviderClient {
  chatCompletion(request: ChatRequest): Promise<ChatResponse>;
  streamChat(request: ChatRequest): AsyncIterable<StreamingChunk>;
  listModels(): Promise<ModelInfo[]>;
}

export type ProviderClientResult<T> =
  | { ok: true; value: T; _routing?: RoutingMetadata }
  | { ok: false; error: ProviderError; _routing?: RoutingMetadata };

export interface RoutingMetadata {
  providerId: string;
  fallbackChain: FallbackProviderEntry[];
  attempts: number;
}
