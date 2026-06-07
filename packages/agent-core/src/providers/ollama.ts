import type { ToolSupportStatus } from '../common/types/providerSettings.js';

import { fetchWithTimeout } from '../utils/fetch.js';
import { sanitizeString } from '../utils/sanitize.js';
import { validateHttpUrl } from '../utils/url.js';
import { testOllamaModelToolSupport } from './tool-support-testing.js';

const OLLAMA_API_TIMEOUT_MS = 15000;

export interface OllamaModel {
  id: string;
  displayName: string;
  size: number;
  toolSupport?: ToolSupportStatus;
}

export interface OllamaConnectionResult {
  success: boolean;
  error?: string;
  models?: OllamaModel[];
}

interface OllamaTagsResponse {
  models?: Array<{ name: string; size: number }>;
}

export async function testOllamaConnection(url: string): Promise<OllamaConnectionResult> {
  const sanitizedUrl = sanitizeString(url, 'ollamaUrl', 256);

  try {
    validateHttpUrl(sanitizedUrl, 'Ollama URL');
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Invalid URL format' };
  }

  try {
    const response = await fetchWithTimeout(
      `${sanitizedUrl}/api/tags`,
      { method: 'GET' },
      OLLAMA_API_TIMEOUT_MS,
    );

    if (!response.ok) {
      throw new Error(`Ollama returned status ${response.status}`);
    }

    const data = (await response.json()) as OllamaTagsResponse;
    const rawModels = data.models || [];

    if (rawModels.length === 0) {
      return { success: true, models: [] };
    }

    const BATCH_SIZE = 5;
    const models: OllamaModel[] = [];

    for (let i = 0; i < rawModels.length; i += BATCH_SIZE) {
      const batch = rawModels.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (m) => {
          const toolSupport = await testOllamaModelToolSupport(sanitizedUrl, m.name);
          return { id: m.name, displayName: m.name, size: m.size, toolSupport };
        }),
      );
      models.push(...results);
    }

    return { success: true, models };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection failed';

    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Connection timed out. Make sure Ollama is running.' };
    }
    return { success: false, error: `Cannot connect to Ollama: ${message}` };
  }
}
