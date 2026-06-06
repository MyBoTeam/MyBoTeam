import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ConnectorsPanel');

export function useOAuthCallback(
  completeOAuth: (state: string, code: string) => Promise<void>,
  onError?: (error: string) => void,
) {
  const { t } = useTranslation('settings');

  useEffect(() => {
    const unsubscribe = window.myboteam?.onMcpAuthCallback?.((callbackUrl: string) => {
      try {
        const parsed = new URL(callbackUrl);
        const code = parsed.searchParams.get('code');
        const state = parsed.searchParams.get('state');
        if (code && state) {
          completeOAuth(state, code).catch((err) => {
            logger.error('Failed to complete OAuth:', err);
            onError?.(err instanceof Error ? err.message : t('connectors.oauthCompletionFailed'));
          });
        }
      } catch (err) {
        logger.error('Failed to parse OAuth callback URL:', err);
        onError?.(t('connectors.invalidOauthCallback'));
      }
    });
    return () => unsubscribe?.();
  }, [completeOAuth, t, onError]);
}
