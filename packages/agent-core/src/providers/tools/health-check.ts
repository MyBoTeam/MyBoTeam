export interface ProviderHealth {
  healthy: boolean;
  latency: number;
  timestamp: string;
  error?: string;
}

export type HealthCheckFn = (signal?: AbortSignal) => Promise<ProviderHealth>;

export async function checkHealth(
  healthCheckFn: HealthCheckFn,
  timeoutMs = 5000,
): Promise<ProviderHealth> {
  const start = Date.now();
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const result = await Promise.race([
      healthCheckFn(controller.signal),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          reject(new Error('Health check timeout'));
        }, timeoutMs);
      }),
    ]);

    return { ...result, latency: Date.now() - start };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start,
      timestamp: new Date().toISOString(),
      error:
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message: unknown }).message)
            : 'Unknown error',
    };
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}
