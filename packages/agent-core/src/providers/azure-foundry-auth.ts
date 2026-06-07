import { getAzureEntraToken } from '../opencode/proxies/azure-token-manager.js';
import { fetchWithTimeout } from '../utils/fetch.js';
import { sanitizeString } from '../utils/sanitize.js';

export const DEFAULT_AZURE_TIMEOUT_MS = 15000;

export async function postAzureChatCompletionWithRetry(
  testUrl: string,
  headers: Record<string, string>,
  content: string,
  timeout: number,
): Promise<Response> {
  const baseBody = { messages: [{ role: 'user', content }] };

  const response = await fetchWithTimeout(
    testUrl,
    { method: 'POST', headers, body: JSON.stringify({ ...baseBody, max_completion_tokens: 5 }) },
    timeout,
  );

  if (response.ok) {
    return response;
  }

  const errorData = await response
    .clone()
    .json()
    .catch(() => ({}));
  const errorMessage = (errorData as { error?: { message?: string } })?.error?.message || '';

  if (errorMessage.includes('max_completion_tokens')) {
    return fetchWithTimeout(
      testUrl,
      { method: 'POST', headers, body: JSON.stringify({ ...baseBody, max_tokens: 5 }) },
      timeout,
    );
  }

  return response;
}

export type AzureAuthType = 'api-key' | 'entra-id';

export interface AzureAuthHeaderResult {
  success: true;
  headers: Record<string, string>;
  authValue: string;
}

export interface AzureAuthHeaderError {
  success: false;
  error: string;
}

export type AzureAuthHeaderOutcome = AzureAuthHeaderResult | AzureAuthHeaderError;

async function getEntraAuthHeader(): Promise<
  { success: false; error: string } | { success: true; authValue: string }
> {
  const tokenResult = await getAzureEntraToken();
  if (!tokenResult.success) {
    return { success: false, error: tokenResult.error };
  }
  return { success: true, authValue: `Bearer ${tokenResult.token}` };
}

export async function buildAzureAuthHeaders(
  authType: AzureAuthType,
  apiKey?: string,
): Promise<AzureAuthHeaderOutcome> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authType === 'entra-id') {
    const entraResult = await getEntraAuthHeader();
    if (!entraResult.success) {
      return { success: false, error: entraResult.error };
    }
    headers.Authorization = entraResult.authValue;
    return { success: true, headers, authValue: entraResult.authValue };
  }

  if (!apiKey) {
    return { success: false, error: 'API key is required for api-key authentication' };
  }

  let sanitizedKey: string;
  try {
    sanitizedKey = sanitizeString(apiKey, 'apiKey', 256);
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Invalid API key' };
  }

  headers['api-key'] = sanitizedKey;
  return { success: true, headers, authValue: sanitizedKey };
}

export async function buildTestAuthHeaders(
  authType: AzureAuthType,
  apiKey?: string,
): Promise<{ success: false; error: string } | { success: true; headers: Record<string, string> }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authType === 'api-key') {
    const trimmedKey = apiKey?.trim();
    if (!trimmedKey) {
      return { success: false, error: 'API key is required for API key authentication' };
    }
    headers['api-key'] = trimmedKey;
    return { success: true, headers };
  }

  const entraResult = await getEntraAuthHeader();
  if (!entraResult.success) {
    return { success: false, error: entraResult.error };
  }
  headers.Authorization = entraResult.authValue;
  return { success: true, headers };
}
