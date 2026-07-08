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
    this.callback?.(metrics);
  }
}
