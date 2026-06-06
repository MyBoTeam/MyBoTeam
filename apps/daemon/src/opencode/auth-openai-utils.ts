import type { OpenAiOauthPlan } from '@myboteam/agent-core';

export const OPENAI_PROVIDER_ID = 'openai';
export const OPENAI_AUTH_TIMEOUT_MS = 2 * 60_000;
export const PREFERRED_OAUTH_LABEL = 'ChatGPT Pro/Plus';

export class OAuthLoginError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options as ErrorOptions | undefined);
    this.name = 'OAuthLoginError';
  }
}

export function abortError(message: string): Error {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

export function pickOauthMethodIndex(
  methods: Array<{ type: 'oauth' | 'api'; label: string }>,
): number {
  const preferred = methods.findIndex(
    (m) => m.type === 'oauth' && m.label === PREFERRED_OAUTH_LABEL,
  );
  if (preferred !== -1) return preferred;
  const anyOauth = methods.findIndex((m) => m.type === 'oauth');
  if (anyOauth !== -1) return anyOauth;
  throw new OAuthLoginError('OpenAI authentication is not available in this OpenCode runtime.');
}

export interface ActiveSession {
  sessionId: string;
  abortController: AbortController;
  authorizeUrl: string;
  completion: Promise<OpenAiOauthPlan>;
  runtime: { close: () => void };
}
