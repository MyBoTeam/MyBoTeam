import { fetchWithTimeout } from '../utils/fetch.js';
import { createConsoleLogger } from '../utils/logging.js';
import { sanitizeString } from '../utils/sanitize.js';
import { validateHttpUrl } from '../utils/url.js';

const log = createConsoleLogger({ prefix: 'CustomProvider' });

const DEFAULT_TIMEOUT_MS = 10000;

export interface CustomConnectionResult {
  success: boolean;
  error?: string;
}

export async function testCustomConnection(
  baseUrl: string,
  apiKey?: string,
): Promise<CustomConnectionResult> {
  const sanitizedUrl = sanitizeString(baseUrl, 'customUrl', 256);
  const sanitizedApiKey = apiKey ? sanitizeString(apiKey, 'apiKey', 256) : undefined;

  try {
    validateHttpUrl(sanitizedUrl, 'Custom endpoint URL');
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Invalid URL format' };
  }

  const normalizedUrl = sanitizedUrl.replace(/\/+$/, '');

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (sanitizedApiKey) {
      headers.Authorization = `Bearer ${sanitizedApiKey}`;
    }

    const parsedUrl = new URL(normalizedUrl);
    const pathname = parsedUrl.pathname;
    let modelsUrl: string;
    if (pathname === '/' || pathname === '' || pathname.endsWith('/v1')) {
      modelsUrl = normalizedUrl.endsWith('/v1')
        ? `${normalizedUrl}/models`
        : `${normalizedUrl}/v1/models`;
    } else {
      log.warn(
        '[Custom] URL path appears to be a specific endpoint rather than a base URL. ' +
          'For best results, provide a base URL ending in /v1 (e.g., https://api.example.com/v1).',
      );
      modelsUrl = normalizedUrl;
    }

    const response = await fetchWithTimeout(
      modelsUrl,
      { method: 'GET', headers },
      DEFAULT_TIMEOUT_MS,
    );

    if (response.ok) {
      log.info('[Custom] Connection successful, /models endpoint responded');
      return { success: true };
    }

    const status = response.status;

    if (status === 401 || status === 403) {
      if (!sanitizedApiKey) {
        return { success: false, error: 'Authentication required. Please provide an API key.' };
      }

      log.info('[Custom] Connection successful (server reachable, /models may not be supported)');
      return { success: true };
    }

    if (status === 404) {
      log.info('[Custom] Connection successful (server reachable, /models not implemented)');
      return { success: true };
    }

    const errorData = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    const errorMessage = errorData?.error?.message || `Server returned status ${status}`;

    log.info(`[Custom] ${errorMessage}, but connection is reachable`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection failed';
    log.warn(`[Custom] Connection failed: ${message}`);

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Connection timed out. Make sure the endpoint is accessible.',
      };
    }

    return { success: false, error: `Cannot connect to endpoint: ${message}` };
  }
}
