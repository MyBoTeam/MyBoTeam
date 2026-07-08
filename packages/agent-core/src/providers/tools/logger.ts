import { createChildLogger } from '../../storage/logger.js';

export interface ProviderLogFields {
  model: string;
  duration_ms: number;
  tokens_used: number;
  provider_name: string;
  success: boolean;
  error?: string;
}

const logger = createChildLogger({ module: 'provider' });

export function logProviderRequest(fields: ProviderLogFields): void {
  logger.debug(fields, 'Provider request completed');
}

export function logProviderError(
  providerName: string,
  model: string,
  error: unknown,
  durationMs: number,
): void {
  const message = error instanceof Error ? error.message : String(error);
  logger.warn(
    {
      model,
      duration_ms: durationMs,
      tokens_used: 0,
      provider_name: providerName,
      success: false,
      error: message,
    },
    'Provider request failed',
  );
}
