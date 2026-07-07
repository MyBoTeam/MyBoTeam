import type { RetryConfig } from './provider-config.js';

export class RetryHandler {
  private readonly maxAttempts: number;
  private readonly delay: number;
  private readonly backoff: 'linear' | 'exponential';

  constructor(config?: RetryConfig) {
    this.maxAttempts = config?.maxAttempts ?? 3;
    this.delay = config?.delay ?? 1000;
    this.backoff = config?.backoff ?? 'exponential';
  }

  async execute<T>(fn: () => Promise<T>, isRetryable?: (error: unknown) => boolean): Promise<T> {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === this.maxAttempts) {
          throw lastError;
        }

        if (isRetryable && !isRetryable(lastError)) {
          throw lastError;
        }

        const waitTime = this.calculateDelay(attempt);
        await this.sleep(waitTime);
      }
    }

    throw lastError;
  }

  private calculateDelay(attempt: number): number {
    if (this.backoff === 'exponential') {
      return this.delay * 2 ** (attempt - 1);
    }
    return this.delay * attempt;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
