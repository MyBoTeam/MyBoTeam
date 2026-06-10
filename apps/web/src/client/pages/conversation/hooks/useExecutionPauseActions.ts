import { getOAuthProviderDisplayName, hasAnyReadyProvider } from '@myboteam/agent-core/common';
import { useCallback, useMemo } from 'react';
import type { useExecutionCore } from './useExecutionCore';

type CoreState = ReturnType<typeof useExecutionCore>;

export function useExecutionPauseActions(s: CoreState) {
  const { myboteam, navigate, t } = s;

  const resumePausedTask = useCallback(
    async (message: string): Promise<boolean> => {
      const isE2EMode = await myboteam.isE2EMode();
      if (!isE2EMode) {
        const settings = await myboteam.getProviderSettings();
        if (!hasAnyReadyProvider(settings)) {
          s.setPendingFollowUp(message);
          navigate('/settings/providers');
          return false;
        }
      }
      return await s.sendFollowUp(message, []);
    },

    [myboteam, navigate, s.setPendingFollowUp, s.sendFollowUp],
  );

  const handleContinue = useCallback(async () => {
    return await resumePausedTask('continue');
  }, [resumePausedTask]);

  const { pauseAction, setTaskActionError, setIsTaskActionRunning } = s;

  const handlePauseAction = useCallback(async () => {
    if (pauseAction?.type !== 'oauth-connect') {
      return;
    }
    const providerName = getOAuthProviderDisplayName(pauseAction.providerId);
    setTaskActionError(null);
    setIsTaskActionRunning(true);
    try {
      const status = await myboteam.getSlackMcpOauthStatus();
      if (status.pendingAuthorization) {
        await myboteam.logoutSlackMcp();
      }
      if (!status.connected) {
        await myboteam.loginSlackMcp();
      }
      const refreshed = await myboteam.getSlackMcpOauthStatus();
      if (!refreshed.connected) {
        throw new Error(t('questionPrompt.oauthStillDisconnected', { provider: providerName }));
      }
      return await resumePausedTask(pauseAction.successText ?? `${providerName} is connected.`);
    } catch (error) {
      setTaskActionError(
        error instanceof Error
          ? error.message
          : t('questionPrompt.oauthFailed', { provider: providerName }),
      );
      return false;
    } finally {
      setIsTaskActionRunning(false);
    }
  }, [myboteam, t, resumePausedTask, pauseAction, setTaskActionError, setIsTaskActionRunning]);

  const handleTaskAction = useMemo(
    () => (s.isConnectorAuthPause ? handlePauseAction : handleContinue),
    [s.isConnectorAuthPause, handlePauseAction, handleContinue],
  );

  return { handleContinue, handlePauseAction, handleTaskAction, resumePausedTask };
}
