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
    const models = await Promise.race([
      fetchModels(endpoint, headers),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Capability detection timeout')), timeout),
      ),
    ]);

    const [tools, vision] = await Promise.all([
      detectToolSupportByProbe(endpoint, headers).catch(() => false),
      detectVisionSupportByProbe(endpoint, headers).catch(() => false),
    ]);

    return {
      streaming: true,
      tools: tools || detectToolSupportByName(models),
      vision: vision || detectVisionSupportByName(models),
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
): Promise<boolean> {
  const url = new URL('/v1/chat/completions', endpoint);
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'test',
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

async function detectVisionSupportByProbe(
  endpoint: string,
  headers: Record<string, string>,
): Promise<boolean> {
  const url = new URL('/v1/models', endpoint);
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
    signal: AbortSignal.timeout(1000),
  });

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as { data?: Array<{ id: string }> };
  const models = data.data ?? [];

  return models.some((m) => {
    const id = m.id.toLowerCase();
    return (
      id.includes('vision') || id.includes('vl') || id.includes('clip') || id.includes('multimodal')
    );
  });
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
