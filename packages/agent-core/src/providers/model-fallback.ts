export interface ModelFallbackConfig {
  enabled?: boolean;
  defaultModels?: Record<string, string>;
}

const DEFAULT_FALLBACK_MODELS: Record<string, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
};

export class ModelFallback {
  private readonly enabled: boolean;
  private readonly defaultModels: Record<string, string>;

  constructor(config?: ModelFallbackConfig) {
    this.enabled = config?.enabled ?? true;
    this.defaultModels = config?.defaultModels ?? DEFAULT_FALLBACK_MODELS;
  }

  getModelChain(requestedModel: string, provider: string): string[] {
    if (!this.enabled) {
      return [requestedModel];
    }

    const chain: string[] = [requestedModel];

    const dateSuffixRegex = /-\d{4}-\d{2}-\d{2}$/;
    if (dateSuffixRegex.test(requestedModel)) {
      chain.push(requestedModel.replace(dateSuffixRegex, ''));
    }

    const fallbackModel = this.defaultModels[provider];
    if (fallbackModel && !chain.includes(fallbackModel)) {
      chain.push(fallbackModel);
    }

    return chain;
  }

  getDefaultModel(provider: string): string | undefined {
    return this.defaultModels[provider];
  }
}
