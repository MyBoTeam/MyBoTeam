import type { ApiResponse } from './types.js';

export async function callApi(path: string, body: Record<string, unknown>): Promise<ApiResponse> {
  const port = process.env.MYBOTEAM_WHATSAPP_API_PORT;
  if (!port) throw new Error('MYBOTEAM_WHATSAPP_API_PORT is not set');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = process.env.MYBOTEAM_DAEMON_AUTH_TOKEN;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`http://localhost:${port}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`WhatsApp API returned ${response.status}`);
  return response.json() as Promise<ApiResponse>;
}

export type { ApiResponse } from './types.js';
