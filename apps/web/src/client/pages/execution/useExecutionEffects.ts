import { useEffect } from 'react';
import type { useExecutionCore } from './useExecutionCore';

type CoreState = ReturnType<typeof useExecutionCore>;

/**
 * Side-effect hooks for the execution page.
 * Handles auth/pause cleanup, follow-up focus, and keyboard shortcuts.
 */
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
        .catch(() => {
          // ignore errors from oauth status check
        });
      return () => {
        stale = true;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- s.setTaskActionError/setIsTaskActionRunning are stable store actions
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- followUpInputRef is a stable ref
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- s is a stable hook result reference
  }, [s.currentTask, s.isComplete, s.permissionRequest, s.showSettingsDialog, s.interruptTask]);
}
