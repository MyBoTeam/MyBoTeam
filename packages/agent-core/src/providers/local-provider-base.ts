import type { ChatRequest, ChatResponse, ModelInfo, StreamingChunk } from '@myboteam/types';
import { mapHttpError } from './tools/error-mapper.js';
import type { LocalProviderConfig, ProviderCapability } from './tools/local-provider-types.js';

export abstract class LocalProviderBase {
  protected readonly config: LocalProviderConfig;
  protected capabilities: ProviderCapability | null = null;

  constructor(config: LocalProviderConfig) {
    this.config = config;
  }

  abstract chatCompletion(request: ChatRequest): Promise<ChatResponse>;
  abstract streamChat(request: ChatRequest): AsyncIterable<StreamingChunk>;
  abstract listModels(): Promise<ModelInfo[]>;
  protected abstract get providerName(): string;

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

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = new URL(path, this.config.endpoint);
    const response = await fetch(url.toString(), {
      ...init,
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

  protected fetchJson<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  protected postJson<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }
}
