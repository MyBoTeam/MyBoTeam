import { fetchWithTimeout } from '../utils/fetch.js';
import { createConsoleLogger } from '../utils/logging.js';
import { testLMStudioModelToolSupport } from './tool-support-testing.js';

const log = createConsoleLogger({ prefix: 'LMStudio' });

export const LMSTUDIO_REQUEST_TIMEOUT_MS = 15000;

interface LMStudioModelsResponse {
  data?: Array<{
    id: string;
    object: string;
    owned_by?: string;
  }>;
}

import type { ToolSupportStatus } from '../common/types/providerSettings.js';

export interface LMStudioModel {
  id: string;
  name: string;
  toolSupport: ToolSupportStatus;
}

export interface LMStudioConnectionResult {
  success: boolean;
  error?: string;
  models?: LMStudioModel[];
}

export interface LMStudioFetchModelsOptions {
  baseUrl: string;

  timeoutMs?: number;
}

export function formatModelDisplayName(modelId: string): string {
  return modelId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function fetchAndEnrichModels(
  baseUrl: string,
  timeoutMs: number,
): Promise<LMStudioConnectionResult> {
  const response = await fetchWithTimeout(`${baseUrl}/v1/models`, { method: 'GET' }, timeoutMs);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      (errorData as { error?: { message?: string } })?.error?.message ||
      `API returned status ${response.status}`;
    return { success: false, error: errorMessage };
  }

  const data = (await response.json()) as LMStudioModelsResponse;
  const rawModels = data.data || [];

  const models: LMStudioModel[] = [];

  for (const m of rawModels) {
    const displayName = formatModelDisplayName(m.id);
    const toolSupport = await testLMStudioModelToolSupport(baseUrl, m.id);

    models.push({
      id: m.id,
      name: displayName,
      toolSupport,
    });

    log.info(`[LM Studio] Model ${m.id}: toolSupport=${toolSupport}`);
  }

  return { success: true, models };
}

export async function fetchLMStudioModels(
  options: LMStudioFetchModelsOptions,
): Promise<LMStudioConnectionResult> {
  const { baseUrl, timeoutMs = LMSTUDIO_REQUEST_TIMEOUT_MS } = options;

  try {
    return await fetchAndEnrichModels(baseUrl, timeoutMs);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch models';
    log.warn(`[LM Studio] Fetch failed: ${message}`);

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timed out. Check your LM Studio server.',
      };
    }
    return { success: false, error: `Failed to fetch models: ${message}` };
  }
}
