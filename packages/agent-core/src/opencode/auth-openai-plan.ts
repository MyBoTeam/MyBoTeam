import * as fs from 'node:fs';
import type { OpenAiOauthPlan } from '../common/types/providerSettings.js';
import { getOpenCodeAuthJsonPath } from './auth-paths.js';

export interface DetectOpenAiOauthPlanOptions {
  authStatePath?: string;
  timeoutMs?: number;
  pollMs?: number;
}

interface OpenAiAuthTokenPayload {
  'https://api.openai.com/auth'?: {
    chatgpt_plan_type?: string;
  };
}

const OPENAI_AUTH_PLAN_DETECTION_TIMEOUT_MS = 5_000;
const OPENAI_AUTH_PLAN_DETECTION_POLL_MS = 100;

function decodeJwtPayload(token: string): OpenAiAuthTokenPayload {
  const [, payloadSegment] = token.split('.');
  if (!payloadSegment) {
    throw new Error('OpenAI auth token is missing a JWT payload segment.');
  }

  const paddingLength = (4 - (payloadSegment.length % 4)) % 4;
  const normalizedPayload = `${payloadSegment.replace(/-/g, '+').replace(/_/g, '/')}${'='.repeat(
    paddingLength,
  )}`;

  return JSON.parse(Buffer.from(normalizedPayload, 'base64').toString('utf-8'));
}

export function readOpenAiOauthPlan(authStatePath = getOpenCodeAuthJsonPath()): OpenAiOauthPlan {
  const authState = JSON.parse(fs.readFileSync(authStatePath, 'utf-8')) as {
    openai?: { access?: string };
  };
  const accessToken = authState.openai?.access;
  if (!accessToken) {
    throw new Error('OpenCode auth state does not include an OpenAI access token yet.');
  }

  const payload = decodeJwtPayload(accessToken);
  const planType = payload['https://api.openai.com/auth']?.chatgpt_plan_type?.trim().toLowerCase();
  if (!planType) {
    throw new Error('OpenCode auth token does not include chatgpt_plan_type.');
  }

  return planType === 'free' ? 'free' : 'paid';
}

export async function detectOpenAiOauthPlan(
  options: DetectOpenAiOauthPlanOptions = {},
): Promise<OpenAiOauthPlan> {
  const authStatePath = options.authStatePath ?? getOpenCodeAuthJsonPath();
  const timeoutMs = options.timeoutMs ?? OPENAI_AUTH_PLAN_DETECTION_TIMEOUT_MS;
  const pollMs = options.pollMs ?? OPENAI_AUTH_PLAN_DETECTION_POLL_MS;
  const deadline = Date.now() + timeoutMs;
  let lastError: Error | undefined;

  while (Date.now() <= deadline) {
    try {
      return readOpenAiOauthPlan(authStatePath);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown OpenAI auth-state error');
      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }
  }

  throw new Error('Timed out waiting for OpenCode auth state to include an OpenAI plan.', {
    cause: lastError,
  });
}
