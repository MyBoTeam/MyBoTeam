import { MetricsEmitter } from '../../providers/metrics.js';
import type { ProviderMetrics } from '../../providers/metrics.js';
import { createChildLogger } from '../../storage/logger.js';

export { MetricsEmitter } from '../../providers/metrics.js';
export type { ProviderMetrics } from '../../providers/metrics.js';

const logger = createChildLogger({ module: 'provider-metrics' });

export function createLocalMetricsEmitter(): MetricsEmitter {
  return new MetricsEmitter((metrics: ProviderMetrics) => {
    logger.debug(
      {
        metric: 'provider_request_duration_ms',
        value: metrics.requestDuration,
        prompt_tokens: metrics.promptTokens,
        completion_tokens: metrics.completionTokens,
        total_tokens: metrics.totalTokens,
      },
      'Provider metrics',
    );
  });
}
