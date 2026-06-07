import type http from 'http';

export interface AzureFoundryProxyInfo {
  baseURL: string;
  targetBaseURL: string;
  port: number;
}

export const AZURE_FOUNDRY_PROXY_PORT = 9228;
export const MAX_REQUEST_SIZE = 10 * 1024 * 1024;
export const HOP_BY_HOP_HEADERS = [
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
];

export function getProxyBaseUrl(): string {
  return `http://127.0.0.1:${AZURE_FOUNDRY_PROXY_PORT}`;
}

export function sendJson(res: http.ServerResponse, status: number, body: object): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}
