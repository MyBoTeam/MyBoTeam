export interface ProviderHealth {
  healthy: boolean;
  latency: number;
  timestamp: string;
  error?: string;
}

export type HealthCheckFn = () => Promise<ProviderHealth>;

export async function checkHealth(
  healthCheckFn: HealthCheckFn,
  timeoutMs = 5000,
): Promise<ProviderHealth> {
  const start = Date.now();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const result = await Promise.race([
      healthCheckFn(),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Health check timeout')), timeoutMs);
      }),
    ]);

    return { ...result, latency: Date.now() - start };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}
