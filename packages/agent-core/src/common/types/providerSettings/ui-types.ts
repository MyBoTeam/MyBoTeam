export type OpenAiOauthPlan = 'free' | 'paid';

export const OPENAI_OAUTH_MODEL_IDS = ['gpt-5', 'gpt-5-codex', 'codex-mini-latest'] as const;

export const OPENAI_OAUTH_FREE_MODEL_IDS = ['gpt-5'] as const;
