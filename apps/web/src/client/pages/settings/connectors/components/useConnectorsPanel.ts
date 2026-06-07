import type { OAuthProviderId } from '@myboteam/agent-core/common';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createLogger } from '@/utils/logger';
import { useConnectors } from './useConnectors';
import { useOAuthCallback } from './useOAuthCallback';

const logger = createLogger('ConnectorsPanel');

export function useConnectorsPanel() {
  const { t } = useTranslation('settings');
  const {
    connectors,
    slackAuth,
    builtInAuthStates,
    loading,
    addConnector,
    deleteConnector,
    toggleEnabled,
    startOAuth,
    completeOAuth,
    disconnect,
    authenticateBuiltIn,
    disconnectBuiltIn,
    authenticateSlack,
    disconnectSlack,
    refetch,
  } = useConnectors();

  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [slackActionLoading, setSlackActionLoading] = useState(false);
  const [builtInActionLoading, setBuiltInActionLoading] = useState<Record<string, boolean>>({});
  const [addError, setAddError] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useOAuthCallback(completeOAuth, (error) => setOauthError(error));

  const deriveNameFromUrl = useCallback(
    (serverUrl: string): string => {
      try {
        const parsed = new URL(serverUrl);
        const parts = parsed.hostname.split('.');
        const name = parts.length > 1 ? parts[parts.length - 2] : parts[0];
        return name.charAt(0).toUpperCase() + name.slice(1);
      } catch {
        return t('connectors.defaultName');
      }
    },
    [t],
  );

  const handleAdd = useCallback(async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      return;
    }
    try {
      const parsed = new URL(trimmedUrl);
      if (!parsed.protocol.startsWith('http')) {
        setAddError(t('connectors.urlMustBeHttp'));
        return;
      }
    } catch {
      setAddError(t('connectors.invalidUrl'));
      return;
    }
    setAdding(true);
    setAddError(null);
    setOauthError(null);
    try {
      const name = deriveNameFromUrl(trimmedUrl);
      await addConnector(name, trimmedUrl);
      setUrl('');
    } catch (err) {
      logger.error('Failed to add connector:', err);
      setAddError(err instanceof Error ? err.message : t('connectors.addFailed'));
    } finally {
      setAdding(false);
    }
  }, [url, addConnector, deriveNameFromUrl, t]);

  const handleConnect = useCallback(
    async (connectorId: string) => {
      setOauthError(null);
      try {
        await startOAuth(connectorId);
      } catch (err) {
        logger.error('Failed to start OAuth:', err);
        setOauthError(err instanceof Error ? err.message : t('connectors.oauthStartFailed'));
      }
    },
    [startOAuth, t],
  );

  const handleBuiltInAuthenticate = useCallback(
    async (providerId: OAuthProviderId) => {
      setBuiltInActionLoading((prev) => ({ ...prev, [providerId]: true }));
      setOauthError(null);
      try {
        await authenticateBuiltIn(providerId);
      } catch (err) {
        logger.error('Failed to authenticate built-in connector:', err);
        const raw = err instanceof Error ? err.message : t('connectors.oauthStartFailed');
        const cleaned = raw.replace(/^Error invoking remote method '[^']+': (\w+Error: )?/, '');
        setOauthError(cleaned);
      } finally {
        setBuiltInActionLoading((prev) => ({ ...prev, [providerId]: false }));
      }
    },
    [authenticateBuiltIn, t],
  );

  const handleBuiltInDisconnect = useCallback(
    async (providerId: OAuthProviderId) => {
      setBuiltInActionLoading((prev) => ({ ...prev, [providerId]: true }));
      setOauthError(null);
      try {
        await disconnectBuiltIn(providerId);
      } catch (err) {
        logger.error('Failed to disconnect built-in connector:', err);
        setOauthError(err instanceof Error ? err.message : t('connectors.oauthStartFailed'));
      } finally {
        setBuiltInActionLoading((prev) => ({ ...prev, [providerId]: false }));
      }
    },
    [disconnectBuiltIn, t],
  );

  const handleSlackAuthenticate = useCallback(async () => {
    setSlackActionLoading(true);
    setAddError(null);
    setOauthError(null);
    try {
      await authenticateSlack();
    } catch (err) {
      logger.error('Failed to authenticate Slack MCP:', err);
      const raw = err instanceof Error ? err.message : t('connectors.slack.authFailed');
      const cleaned = raw.replace(/^Error invoking remote method '[^']+': (\w+Error: )?/, '');
      setOauthError(cleaned);
    } finally {
      setSlackActionLoading(false);
    }
  }, [authenticateSlack, t]);

  const handleSlackDisconnect = useCallback(async () => {
    setSlackActionLoading(true);
    setAddError(null);
    setOauthError(null);
    try {
      await disconnectSlack();
    } catch (err) {
      logger.error('Failed to disconnect Slack MCP:', err);
      setOauthError(err instanceof Error ? err.message : t('connectors.slack.disconnectFailed'));
    } finally {
      setSlackActionLoading(false);
    }
  }, [disconnectSlack, t]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !adding) {
        handleAdd();
      }
    },
    [handleAdd, adding],
  );

  const handleUrlChange = useCallback((value: string) => {
    setUrl(value);
    setAddError(null);
  }, []);

  const dismissTabError = useCallback(() => {
    setOauthError(null);
  }, []);

  return {
    connectors,
    slackAuth,
    builtInAuthStates,
    builtInActionLoading,
    loading,
    deleteConnector,
    toggleEnabled,
    disconnect,
    url,
    adding,
    slackActionLoading,
    addError,
    oauthError,
    tabError: oauthError,
    dismissTabError,
    handleAdd,
    handleConnect,
    handleBuiltInAuthenticate,
    handleBuiltInDisconnect,
    handleSlackAuthenticate,
    handleSlackDisconnect,
    handleKeyDown,
    handleUrlChange,
    refetch,
  };
}
