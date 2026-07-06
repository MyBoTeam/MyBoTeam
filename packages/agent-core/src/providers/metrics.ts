export interface ProviderMetrics {
  requestDuration: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  errorCategory?: string;
  timeToFirstChunk?: number;
}

export type MetricsCallback = (metrics: ProviderMetrics) => void;

export class MetricsEmitter {
  private readonly callback?: MetricsCallback;

  constructor(callback?: MetricsCallback) {
    this.callback = callback;
  }

  emit(metrics: ProviderMetrics): void {
    try {
      this.callback?.(metrics);
    } catch {
      // Silently ignore errors from user-supplied metrics callback
      // to keep metrics delivery best-effort without breaking chat/stream flow
    }
  }
}
