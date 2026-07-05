import type { ModelInfo } from '@myboteam/types';
import type { ProviderCapability } from './local-provider-types.js';

export interface CapabilityDetector {
  detectCapabilities(
    endpoint: string,
    headers: Record<string, string>,
  ): Promise<ProviderCapability>;
}

export async function detectCapabilities(
  endpoint: string,
  headers: Record<string, string>,
): Promise<ProviderCapability> {
  const timeout = 2000;

  try {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const models = await Promise.race([
      fetchModels(endpoint, headers),
      new Promise<never>(
        (_, reject) =>
          (timer = setTimeout(() => reject(new Error('Capability detection timeout')), timeout)),
      ),
    ]);
    if (timer !== undefined) clearTimeout(timer);

    const tools = await detectToolSupportByProbe(endpoint, headers, models).catch(() => false);

    return {
      streaming: true,
      tools: tools || detectToolSupportByName(models),
      vision: detectVisionSupportByName(models),
      maxContextWindow: detectMaxContextWindow(models),
    };
  } catch {
    return {
      streaming: true,
      tools: false,
      vision: false,
    };
  }
}

async function fetchModels(
  endpoint: string,
  headers: Record<string, string>,
): Promise<ModelInfo[]> {
  const url = new URL('/v1/models', endpoint);
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
    signal: AbortSignal.timeout(2000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as { data?: Array<{ id: string; object?: string }> };
  return (data.data ?? []).map((model) => ({
    id: model.id,
    name: model.id,
    provider: 'local',
    capabilities: { tools: false, vision: false, streaming: true },
  }));
}

async function detectToolSupportByProbe(
  endpoint: string,
  headers: Record<string, string>,
  models: ModelInfo[],
): Promise<boolean> {
  const probeModel = models[0]?.id ?? 'test';

  const url = new URL('/v1/chat/completions', endpoint);
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: probeModel,
      messages: [{ role: 'user', content: 'test' }],
      tools: [
        {
          type: 'function',
          function: {
            name: 'test_tool',
            description: 'Test tool',
            parameters: { type: 'object', properties: {} },
          },
        },
      ],
      max_tokens: 1,
    }),
    signal: AbortSignal.timeout(1000),
  });

  if (response.status === 400) {
    const error = await response.json().catch(() => null);
    const errorStr = JSON.stringify(error).toLowerCase();
    return !errorStr.includes('tool') && !errorStr.includes('function');
  }

  return response.ok;
}

function detectToolSupportByName(models: ModelInfo[]): boolean {
  return models.some(
    (m) =>
      m.capabilities?.tools ||
      m.id.toLowerCase().includes('function') ||
      m.id.toLowerCase().includes('tool'),
  );
}

function detectVisionSupportByName(models: ModelInfo[]): boolean {
  return models.some(
    (m) =>
      m.capabilities?.vision ||
      m.id.toLowerCase().includes('vision') ||
      m.id.toLowerCase().includes('vl'),
  );
}

function detectMaxContextWindow(models: ModelInfo[]): number | undefined {
  const contextWindows = models
    .map((m) => m.contextWindow)
    .filter((cw): cw is number => typeof cw === 'number' && cw > 0);

  return contextWindows.length > 0 ? Math.max(...contextWindows) : undefined;
}
