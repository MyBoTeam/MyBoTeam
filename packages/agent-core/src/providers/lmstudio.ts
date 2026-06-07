import type { LMStudioConfig } from '../common/types/provider.js';
import { createConsoleLogger } from '../utils/logging.js';
import { sanitizeString } from '../utils/sanitize.js';
import { validateHttpUrl } from '../utils/url.js';
import { fetchAndEnrichModels, LMSTUDIO_REQUEST_TIMEOUT_MS } from './lmstudio-models.js';

export type {
  LMStudioConnectionResult,
  LMStudioFetchModelsOptions,
  LMStudioModel,
} from './lmstudio-models.js';
export { fetchLMStudioModels, LMSTUDIO_REQUEST_TIMEOUT_MS } from './lmstudio-models.js';

import type { LMStudioConnectionResult } from './lmstudio-models.js';

const log = createConsoleLogger({ prefix: 'LMStudio' });

export interface LMStudioConnectionOptions {
  url: string;

  timeoutMs?: number;
}

export async function testLMStudioConnection(
  options: LMStudioConnectionOptions,
): Promise<LMStudioConnectionResult> {
  const { url, timeoutMs = LMSTUDIO_REQUEST_TIMEOUT_MS } = options;

  const sanitizedUrl = sanitizeString(url, 'lmstudioUrl', 256);

  try {
    validateHttpUrl(sanitizedUrl, 'LM Studio URL');
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Invalid URL format',
    };
  }

  try {
    const result = await fetchAndEnrichModels(sanitizedUrl, timeoutMs);

    if (!result.success) {
      return result;
    }

    if (!result.models || result.models.length === 0) {
      return {
        success: false,
        error: 'No models loaded in LM Studio. Please load a model first.',
      };
    }

    log.info(`[LM Studio] Connection successful, found ${result.models.length} models`);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection failed';
    log.warn(`[LM Studio] Connection failed: ${message}`);

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Connection timed out. Make sure LM Studio is running.',
      };
    }
    return { success: false, error: `Cannot connect to LM Studio: ${message}` };
  }
}

export function validateLMStudioConfig(config: LMStudioConfig): void {
  if (typeof config.baseUrl !== 'string' || typeof config.enabled !== 'boolean') {
    throw new Error('Invalid LM Studio configuration');
  }

  validateHttpUrl(config.baseUrl, 'LM Studio base URL');

  if (config.lastValidated !== undefined && typeof config.lastValidated !== 'number') {
    throw new Error('Invalid LM Studio configuration');
  }

  if (config.models !== undefined) {
    if (!Array.isArray(config.models)) {
      throw new Error('Invalid LM Studio configuration: models must be an array');
    }
    for (const model of config.models) {
      if (typeof model.id !== 'string' || typeof model.name !== 'string') {
        throw new Error('Invalid LM Studio configuration: invalid model format');
      }
    }
  }
}
