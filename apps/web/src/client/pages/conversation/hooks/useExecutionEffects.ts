import { useEffect } from 'react';
import type { useExecutionCore } from './useExecutionCore';

type CoreState = ReturnType<typeof useExecutionCore>;

export function useExecutionEffects(s: CoreState, myboteam: CoreState['myboteam']) {
  useEffect(() => {
    s.setTaskActionError(null);
    s.setIsTaskActionRunning(false);
    const result = s.currentTask?.result;
    const action = result && 'pauseAction' in result ? result.pauseAction : undefined;
    if (
      s.currentTask?.status === 'completed' &&
      result &&
      'pauseReason' in result &&
      result.pauseReason === 'oauth' &&
      action?.type === 'oauth-connect'
    ) {
      let stale = false;
      myboteam
        .getSlackMcpOauthStatus()
        .then((status) => {
          if (!stale && status.pendingAuthorization) {
            void myboteam.logoutSlackMcp();
          }
        })
        .catch(() => {});
      return () => {
        stale = true;
      };
    }
  }, [
    myboteam,
    s.currentTask?.status,
    s.setTaskActionError,
    s.setIsTaskActionRunning,
    s.currentTask?.result,
  ]);

  useEffect(() => {
    if (s.canFollowUp) {
      s.followUpInputRef.current?.focus();
    }
  }, [s.canFollowUp, s.followUpInputRef.current?.focus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) {
        return;
      }
      if (
        e.key === 'Escape' &&
        s.currentTask?.status === 'running' &&
        !s.isComplete &&
        !s.permissionRequest &&
        !s.showSettingsDialog
      ) {
        e.preventDefault();
        s.interruptTask();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [s.currentTask, s.isComplete, s.permissionRequest, s.showSettingsDialog, s.interruptTask]);
}
