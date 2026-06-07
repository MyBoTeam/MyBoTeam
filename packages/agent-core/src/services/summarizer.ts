import type { ApiKeyProvider } from '../common/types/provider.js';
import { createConsoleLogger } from '../utils/logging.js';
import { callAnthropic, callGoogle, callOpenAI, callXAI } from './summarizer-providers.js';
import { truncatePrompt } from './summarizer-providers-types.js';

const log = createConsoleLogger({ prefix: 'Summarizer' });

export type GetApiKeyFn = (provider: ApiKeyProvider) => string | null;

export async function generateTaskSummary(prompt: string, getApiKey: GetApiKeyFn): Promise<string> {
  const providers: ApiKeyProvider[] = ['anthropic', 'openai', 'google', 'xai'];

  for (const provider of providers) {
    const apiKey = getApiKey(provider);
    if (!apiKey) {
      continue;
    }

    try {
      const summary = await callProviderByName(provider, apiKey, prompt);
      if (summary) {
        log.info(`[Summarizer] Generated summary using ${provider}: "${summary}"`);
        return summary;
      }
    } catch (error) {
      log.warn(`[Summarizer] ${provider} failed: ${String(error)}`);
    }
  }

  log.info('[Summarizer] All providers failed, using truncated prompt');
  return truncatePrompt(prompt);
}

async function callProviderByName(
  provider: ApiKeyProvider,
  apiKey: string,
  prompt: string,
): Promise<string | null> {
  switch (provider) {
    case 'anthropic':
      return callAnthropic(apiKey, prompt);
    case 'openai':
      return callOpenAI(apiKey, prompt);
    case 'google':
      return callGoogle(apiKey, prompt);
    case 'xai':
      return callXAI(apiKey, prompt);
    default:
      return null;
  }
}
