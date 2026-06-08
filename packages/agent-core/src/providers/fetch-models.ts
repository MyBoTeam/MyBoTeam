import { getModelDisplayName } from '../common/model-display.js';
import type { ModelsEndpointConfig } from '../common/types/provider.js';
import { fetchWithTimeout } from '../utils/fetch.js';
import { createConsoleLogger } from '../utils/logging.js';

const log = createConsoleLogger({ prefix: 'FetchModels' });

const DEFAULT_TIMEOUT_MS = 15000;

export interface FetchProviderModelsResult {
  success: boolean;
  models?: Array<{ id: string; name: string }>;
  error?: string;
}

export interface FetchProviderModelsOptions {
  endpointConfig: ModelsEndpointConfig;
  apiKey: string;
  timeout?: number;

  urlOverride?: string;
}

function buildRequest(
  config: ModelsEndpointConfig,
  apiKey: string,
  urlOverride?: string,
): { url: string; headers: Record<string, string> } {
  let url = urlOverride || config.url;
  const headers: Record<string, string> = {};

  if (config.authStyle === 'bearer') {
    headers.Authorization = `Bearer ${apiKey}`;
  } else if (config.authStyle === 'x-api-key') {
    headers['x-api-key'] = apiKey;
  } else if (config.authStyle === 'query-param') {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}key=${encodeURIComponent(apiKey)}`;
  }

  if (config.extraHeaders) {
    Object.assign(headers, config.extraHeaders);
  }

  return { url, headers };
}

function parseOpenAIResponse(
  data: unknown,
  prefix: string,
  filter?: RegExp,
): Array<{ id: string; name: string }> {
  const response = data as { data?: Array<{ id: string }> };
  if (!response.data || !Array.isArray(response.data)) return [];

  let models = response.data;
  if (filter) {
    models = models.filter((m) => filter.test(m.id));
  }

  return models.map((m) => ({
    id: `${prefix}${m.id}`,
    name: getModelDisplayName(m.id),
  }));
}

function parseAnthropicResponse(
  data: unknown,
  prefix: string,
  filter?: RegExp,
): Array<{ id: string; name: string }> {
  const response = data as {
    data?: Array<{ id: string; display_name?: string; type?: string }>;
  };
  if (!response.data || !Array.isArray(response.data)) return [];

  let models = response.data;
  if (filter) {
    models = models.filter((m) => filter.test(m.id));
  }

  return models.map((m) => ({
    id: `${prefix}${m.id}`,
    name: m.display_name || getModelDisplayName(m.id),
  }));
}

function parseGoogleResponse(
  data: unknown,
  prefix: string,
  filter?: RegExp,
): Array<{ id: string; name: string }> {
  const response = data as {
    models?: Array<{
      name: string;
      displayName?: string;
      supportedGenerationMethods?: string[];
    }>;
  };
  if (!response.models || !Array.isArray(response.models)) return [];

  const models = response.models.filter((m) =>
    m.supportedGenerationMethods?.includes('generateContent'),
  );

  const mapped = models.map((m) => {
    const id = m.name.replace(/^models\//, '');
    return { id, displayName: m.displayName || id };
  });

  let filtered = mapped;
  if (filter) {
    filtered = mapped.filter((m) => filter.test(m.id));
  }

  return filtered.map((m) => ({
    id: `${prefix}${m.id}`,
    name: m.displayName || getModelDisplayName(m.id),
  }));
}

const PARSERS: Record<
  ModelsEndpointConfig['responseFormat'],
  (data: unknown, prefix: string, filter?: RegExp) => Array<{ id: string; name: string }>
> = {
  openai: parseOpenAIResponse,
  anthropic: parseAnthropicResponse,
  google: parseGoogleResponse,
};

export async function fetchProviderModels(
  options: FetchProviderModelsOptions,
): Promise<FetchProviderModelsResult> {
  const { endpointConfig, apiKey, urlOverride } = options;
  const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
  const prefix = endpointConfig.modelIdPrefix || '';

  if (!apiKey) {
    return { success: false, error: 'No API key provided' };
  }

  try {
    const { url, headers } = buildRequest(endpointConfig, apiKey, urlOverride);

    const response = await fetchWithTimeout(url, { method: 'GET', headers }, timeout);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        (errorData as { error?: { message?: string } })?.error?.message ||
        `API returned status ${response.status}`;
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    const parser = PARSERS[endpointConfig.responseFormat];
    const models = parser(data, prefix, endpointConfig.modelFilter);

    log.info(`Fetched ${models.length} models from ${url}`);
    return { success: true, models };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch models';
    log.warn(`Fetch failed: ${message}`);

    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Request timed out. Check your internet connection.' };
    }
    return { success: false, error: `Failed to fetch models: ${message}` };
  }
}
