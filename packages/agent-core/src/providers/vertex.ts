import type { VertexCredentials } from '../common/types/auth.js';
import { safeParseJson } from '../utils/json.js';
import type { ValidationResult } from './validation.js';
import { getVertexAccessToken, type ServiceAccountKey } from './vertex-auth.js';

export interface VertexModel {
  id: string;
  name: string;
  provider: string;
}

export interface FetchVertexModelsResult {
  success: boolean;
  models: VertexModel[];
  error?: string;
}

const VERTEX_CURATED_MODELS: Array<{ publisher: string; modelId: string; displayName: string }> = [
  { publisher: 'google', modelId: 'gemini-3-pro-preview', displayName: 'Gemini 3 Pro (Preview)' },
  {
    publisher: 'google',
    modelId: 'gemini-3-flash-preview',
    displayName: 'Gemini 3 Flash (Preview)',
  },

  { publisher: 'google', modelId: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro' },
  { publisher: 'google', modelId: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash' },
  { publisher: 'google', modelId: 'gemini-2.5-flash-lite', displayName: 'Gemini 2.5 Flash Lite' },
];

const VERTEX_TOKEN_TIMEOUT_MS = 15000;

export class VertexClient {
  readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(
    readonly projectId: string,
    readonly location: string,
    readonly accessToken: string,
  ) {
    this.baseUrl =
      location === 'global'
        ? 'https://aiplatform.googleapis.com'
        : `https://${location}-aiplatform.googleapis.com`;
    this.headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  static async create(credentials: VertexCredentials): Promise<VertexClient> {
    const token = await getVertexAccessToken(credentials);
    return new VertexClient(credentials.projectId, credentials.location, token);
  }

  async testAccess(): Promise<void> {
    const url = `${this.baseUrl}/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/gemini-2.5-flash:generateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Say hi' }] }],
      }),
      signal: AbortSignal.timeout(VERTEX_TOKEN_TIMEOUT_MS),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return;
      }
      const errorText = await response.text().catch(() => '');
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          'Authentication failed. Check your credentials and ensure the Vertex AI API is enabled.',
        );
      }
      if (response.status === 404) {
        throw new Error(
          `Project "${this.projectId}" or location "${this.location}" not found. Verify your project ID and location.`,
        );
      }
      throw new Error(`Vertex AI API error (${response.status}): ${errorText}`);
    }
  }
}

export async function validateVertexCredentials(
  credentialsJson: string,
): Promise<ValidationResult> {
  const parseResult = safeParseJson<VertexCredentials>(credentialsJson);
  if (!parseResult.success) {
    return { valid: false, error: 'Failed to parse credentials' };
  }

  const credentials = parseResult.data;

  if (!credentials.projectId?.trim()) {
    return { valid: false, error: 'Project ID is required' };
  }
  if (!credentials.location?.trim()) {
    return { valid: false, error: 'Location is required' };
  }

  if (credentials.authType === 'serviceAccount') {
    if (!credentials.serviceAccountJson?.trim()) {
      return { valid: false, error: 'Service account JSON key is required' };
    }
    const keyResult = safeParseJson<ServiceAccountKey>(credentials.serviceAccountJson);
    if (!keyResult.success) {
      return { valid: false, error: 'Invalid service account JSON format' };
    }
    const key = keyResult.data;
    if (!key.type || !key.project_id || !key.private_key || !key.client_email) {
      return {
        valid: false,
        error:
          'Service account key missing required fields (type, project_id, private_key, client_email)',
      };
    }
  }

  try {
    const client = await VertexClient.create(credentials);
    await client.testAccess();
    return { valid: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Validation failed';
    return { valid: false, error: message };
  }
}

export function fetchVertexModels(_credentials: VertexCredentials): FetchVertexModelsResult {
  const models: VertexModel[] = VERTEX_CURATED_MODELS.map((m) => ({
    id: `vertex/${m.publisher}/${m.modelId}`,
    name: m.displayName,
    provider: m.publisher,
  }));
  return { success: true, models };
}
