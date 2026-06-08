import type { ConnectedProvider, OAuthCredentials, ProviderId } from '@myboteam/agent-core';
import { DEFAULT_PROVIDERS } from '@myboteam/agent-core/common';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getMyBoTeam } from '@/config/myboteam';
import { createLogger } from '@/utils/logger';

const logger = createLogger('useOAuthSignIn');

const OPENAI_OAUTH_FALLBACK_MODELS: Array<{ id: string; name: string }> = [
  { id: 'openai/gpt-5.2', name: 'GPT 5.2' },
  { id: 'openai/gpt-5.2-codex', name: 'GPT 5.2 Codex' },
  { id: 'openai/gpt-5.1-codex-max', name: 'GPT 5.1 Codex Max' },
  { id: 'openai/gpt-5.1-codex-mini', name: 'GPT 5.1 Codex Mini' },
];

export interface UseOAuthSignInOptions {
  providerId: ProviderId;
  onConnect: (provider: ConnectedProvider) => void;
  setError: (v: string | null) => void;
}

export interface UseOAuthSignInReturn {
  signingIn: boolean;
  handleChatGptSignIn: () => Promise<void>;
}

export function useOAuthSignIn({
  providerId,
  onConnect,
  setError,
}: UseOAuthSignInOptions): UseOAuthSignInReturn {
  const { t } = useTranslation('settings');
  const [signingIn, setSigningIn] = useState(false);
  const oauthPollAbortRef = useRef<AbortController | null>(null);

  const signInAttemptRef = useRef(0);

  useEffect(() => {
    return () => {
      oauthPollAbortRef.current?.abort();
    };
  }, []);

  const handleChatGptSignIn = async () => {
    const attemptId = ++signInAttemptRef.current;

    oauthPollAbortRef.current?.abort();
    const abortController = new AbortController();
    oauthPollAbortRef.current = abortController;

    setSigningIn(true);
    setError(null);
    let pollStarted = false;
    let shouldBail = false;

    const providerConfig = DEFAULT_PROVIDERS.find((p) => p.id === providerId);

    try {
      const myboteam = getMyBoTeam();
      const result = await myboteam.loginOpenAiWithChatGpt();

      if (abortController.signal.aborted || attemptId !== signInAttemptRef.current) {
        shouldBail = true;
        return;
      }

      if (!result.ok) {
        setError(t('status.signInFailed'));
        return;
      }

      pollStarted = true;

      const POLL_INTERVAL_MS = 5000;
      const MAX_ATTEMPTS = 36;

      const poll = async () => {
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
          }

          if (abortController.signal.aborted || attemptId !== signInAttemptRef.current) {
            return;
          }

          const status = await myboteam.getOpenAiOauthStatus();

          if (abortController.signal.aborted || attemptId !== signInAttemptRef.current) {
            return;
          }

          if (status.connected) {
            let availableModels = OPENAI_OAUTH_FALLBACK_MODELS;
            if (providerConfig?.modelsEndpoint) {
              const fetchResult = await myboteam.fetchProviderModels(providerId, {});
              if (fetchResult.success && fetchResult.models?.length) {
                availableModels = fetchResult.models;
              }
            }
            if (abortController.signal.aborted || attemptId !== signInAttemptRef.current) return;

            onConnect({
              providerId,
              connectionStatus: 'connected',
              selectedModelId:
                providerConfig?.defaultModelId &&
                availableModels.some((m) => m.id === providerConfig.defaultModelId)
                  ? providerConfig.defaultModelId
                  : null,
              credentials: { type: 'oauth', oauthProvider: 'chatgpt' } as OAuthCredentials,
              lastConnectedAt: new Date().toISOString(),
              availableModels,
            });
            if (abortController.signal.aborted || attemptId !== signInAttemptRef.current) return;
            setSigningIn(false);
            return;
          }
        }
        if (!abortController.signal.aborted && attemptId === signInAttemptRef.current) {
          setError(
            t('status.signInTimedOut') ??
              'Timed out waiting for ChatGPT sign-in. Please try again.',
          );
          setSigningIn(false);
        }
      };

      void poll().catch((err) => {
        if (abortController.signal.aborted || attemptId !== signInAttemptRef.current) {
          return;
        }
        logger.error('Error polling OpenAI OAuth status:', err);
        setError(err instanceof Error ? err.message : t('status.signInFailed'));
        setSigningIn(false);
      });
    } catch (err) {
      if (abortController.signal.aborted || attemptId !== signInAttemptRef.current) {
        shouldBail = true;
        return;
      }
      setError(err instanceof Error ? err.message : t('status.signInFailed'));
    } finally {
      if (!pollStarted && !shouldBail) {
        setSigningIn(false);
      }
    }
  };

  return { signingIn, handleChatGptSignIn };
}
