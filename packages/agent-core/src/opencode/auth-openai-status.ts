import { type OpenCodeOauthAuthEntry, readOpenCodeAuthJson } from './auth-common.js';

export function getOpenAiOauthStatus(): { connected: boolean; expires?: number } {
  const authJson = readOpenCodeAuthJson();
  if (!authJson) return { connected: false };

  const entry = authJson.openai;
  if (!entry || typeof entry !== 'object') return { connected: false };

  const oauth = entry as OpenCodeOauthAuthEntry;
  if (oauth.type !== 'oauth') return { connected: false };

  const refresh = oauth.refresh;
  const connected = typeof refresh === 'string' && refresh.trim().length > 0;
  return { connected, expires: oauth.expires };
}

export function getOpenAiOauthAccessToken(): string | null {
  const authJson = readOpenCodeAuthJson();
  if (!authJson) return null;

  const entry = authJson.openai;
  if (!entry || typeof entry !== 'object') return null;

  const oauth = entry as OpenCodeOauthAuthEntry;
  if (oauth.type !== 'oauth') return null;

  const access = oauth.access;
  return typeof access === 'string' && access.trim().length > 0 ? access : null;
}
