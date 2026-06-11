export type PiModelResolutionStatus = 'resolved' | 'approved-exclusion';

export interface PiSelectedModel {
  provider: string;
  model: string;
}

export interface PiResolvedModel {
  status: 'resolved';
  provider: string;
  api: string;
  model: string;
}

export interface PiModelApprovedExclusion {
  status: 'approved-exclusion';
  provider: string;
  model?: string;
  reason: string;
}

export type PiModelResolution = PiResolvedModel | PiModelApprovedExclusion;

const PROVIDER_TO_PI: Record<string, { provider: string; api: string; prefixes: string[] }> = {
  anthropic: { provider: 'anthropic', api: 'anthropic-messages', prefixes: ['anthropic/'] },
  bedrock: {
    provider: 'amazon-bedrock',
    api: 'bedrock-converse-stream',
    prefixes: ['amazon-bedrock/', 'bedrock/'],
  },
  copilot: { provider: 'github-copilot', api: 'openai-responses', prefixes: ['copilot/'] },
  deepseek: { provider: 'deepseek', api: 'openai-completions', prefixes: ['deepseek/'] },
  fireworks: { provider: 'fireworks', api: 'openai-completions', prefixes: ['fireworks/'] },
  google: { provider: 'google', api: 'google-generative-ai', prefixes: ['google/'] },
  groq: { provider: 'groq', api: 'openai-completions', prefixes: ['groq/'] },
  litellm: { provider: 'litellm', api: 'openai-completions', prefixes: ['litellm/'] },
  lmstudio: { provider: 'lmstudio', api: 'openai-completions', prefixes: ['lmstudio/'] },
  minimax: { provider: 'minimax', api: 'openai-completions', prefixes: ['minimax/'] },
  moonshot: { provider: 'moonshotai', api: 'openai-completions', prefixes: ['moonshot/'] },
  nebius: { provider: 'openai', api: 'openai-completions', prefixes: ['nebius/'] },
  nim: { provider: 'nvidia', api: 'openai-completions', prefixes: ['nim/'] },
  ollama: { provider: 'ollama', api: 'openai-completions', prefixes: ['ollama/'] },
  openai: { provider: 'openai', api: 'openai-responses', prefixes: ['openai/'] },
  openrouter: { provider: 'openrouter', api: 'openai-completions', prefixes: ['openrouter/'] },
  together: { provider: 'together', api: 'openai-completions', prefixes: ['together/'] },
  vertex: { provider: 'google-vertex', api: 'google-vertex', prefixes: ['vertex/'] },
  xai: { provider: 'xai', api: 'openai-completions', prefixes: ['xai/'] },
  zai: { provider: 'zai', api: 'openai-completions', prefixes: ['zai/'] },
};

export function resolvePiModel(
  selectedModel: PiSelectedModel | null | undefined,
): PiModelResolution {
  if (!selectedModel?.model) {
    return {
      status: 'approved-exclusion',
      provider: selectedModel?.provider ?? 'unknown',
      reason: 'No selected model is configured for Pi routing',
    };
  }

  const mapping = PROVIDER_TO_PI[selectedModel.provider];
  if (!mapping) {
    return {
      status: 'approved-exclusion',
      provider: selectedModel.provider,
      model: selectedModel.model,
      reason: `Provider ${selectedModel.provider} requires maintainer-approved Pi parity validation`,
    };
  }

  return {
    status: 'resolved',
    provider: mapping.provider,
    api: mapping.api,
    model: stripKnownPrefix(selectedModel.model, mapping.prefixes),
  };
}

export function getPiSupportedProviderIds(): string[] {
  return Object.keys(PROVIDER_TO_PI).sort();
}

function stripKnownPrefix(model: string, prefixes: string[]): string {
  for (const prefix of prefixes) {
    if (model.startsWith(prefix)) {
      return model.slice(prefix.length);
    }
  }
  return model;
}
