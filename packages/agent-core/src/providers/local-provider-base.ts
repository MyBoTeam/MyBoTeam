import type { ChatRequest, ChatResponse, ModelInfo, StreamingChunk } from '@myboteam/types';
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

  async detectCapabilities(): Promise<ProviderCapability> {
    if (this.capabilities) {
      return this.capabilities;
    }

    const timeout = 2000;

    try {
      const models = await Promise.race([
        this.fetchModels(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Capability detection timeout')), timeout),
        ),
      ]);

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

  protected async fetchJson<T>(path: string): Promise<T> {
    const url = new URL(path, this.config.endpoint);
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.buildHeaders(),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }
}
