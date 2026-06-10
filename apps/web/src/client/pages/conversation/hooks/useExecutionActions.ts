import { hasAnyReadyProvider } from '@myboteam/agent-core/common';
import { useCallback, useEffect } from 'react';
import { createLogger } from '@/utils/logger';
import type { useExecutionCore } from './useExecutionCore';
import { useExecutionEffects } from './useExecutionEffects';
import { useExecutionPauseActions } from './useExecutionPauseActions';

const logger = createLogger('ExecutionActions');

type CoreState = ReturnType<typeof useExecutionCore>;

export function useExecutionActions(s: CoreState) {
  const { id, navigate, myboteam } = s;

  useExecutionEffects(s, myboteam);

  const { handleContinue, handlePauseAction, handleTaskAction } = useExecutionPauseActions(s);

  const handleFollowUp = useCallback(async () => {
    if (!s.followUp.trim() && s.attachments.length === 0) {
      return;
    }
    if (s.followUp.length > 0 && s.isFollowUpOverLimit) {
      return;
    }
    const isE2EMode = await myboteam.isE2EMode();
    if (!isE2EMode) {
      const settings = await myboteam.getProviderSettings();
      if (!hasAnyReadyProvider(settings)) {
        s.setPendingFollowUp(s.followUp);
        navigate('/settings/providers');
        return;
      }
    }
    const ok = await s.sendFollowUp(s.followUp, s.attachments);
    if (ok) {
      s.setFollowUp('');
      s.setAttachments([]);
    }
  }, [myboteam, s, navigate]);

  useEffect(() => {
    if (!s.pendingSpeechFollowUpRef.current) {
      return;
    }
    if (!s.canFollowUp || s.isLoading) {
      return;
    }
    if (s.followUp !== s.pendingSpeechFollowUpRef.current) {
      return;
    }
    s.pendingSpeechFollowUpRef.current = null;
    void handleFollowUp();
  }, [
    s.canFollowUp,
    s.followUp,
    s.isLoading,
    handleFollowUp,
    s.pendingSpeechFollowUpRef.current,
    s.pendingSpeechFollowUpRef,
  ]);

  const handlePermissionResponse = async (
    allowed: boolean,
    selectedOpts?: string[],
    customText?: string,
  ) => {
    if (!s.permissionRequest || !s.currentTask) {
      return;
    }
    await s.respondToPermission({
      requestId: s.permissionRequest.id,
      taskId: s.permissionRequest.taskId,
      decision: allowed ? 'allow' : 'deny',
      selectedOptions: selectedOpts,
      customText: customText,
    });
    if (!allowed && s.permissionRequest.type === 'question') {
      s.interruptTask();
    }
  };

  const handleBugReport = useCallback(async () => {
    if (!s.currentTask || !id) {
      return;
    }
    s.setBugReporting(true);
    try {
      const [screenshotResult, axtreeResult] = await Promise.all([
        myboteam.captureScreenshot(),
        myboteam.captureAxtree(),
      ]);
      const taskError = s.currentTask.result?.error;
      const result = await myboteam.generateBugReport({
        taskId: s.currentTask.id,
        taskPrompt: s.currentTask.prompt,
        taskStatus: s.currentTask.status,
        taskCreatedAt: s.currentTask.createdAt,
        taskCompletedAt: s.currentTask.completedAt,
        taskError,
        messages: s.currentTask.messages as unknown[],
        debugLogs: s.debugLogs as unknown[],
        screenshot: screenshotResult.success ? screenshotResult.data : undefined,
        axtree: axtreeResult.success ? axtreeResult.data : undefined,
      });
      if (result.success) {
        s.setBugReportSaved(true);
        if (s.bugSavedTimerRef.current) {
          clearTimeout(s.bugSavedTimerRef.current);
        }
        s.bugSavedTimerRef.current = setTimeout(() => {
          s.setBugReportSaved(false);
          s.bugSavedTimerRef.current = null;
        }, 2500);
      }
    } catch (err) {
      logger.error('Bug report failed:', err);
    } finally {
      s.setBugReporting(false);
    }
  }, [myboteam, s, id]);

  const handleRepeatTask = useCallback(async () => {
    if (!s.currentTask) {
      return;
    }
    if (
      ['pending', 'queued', 'running', 'waiting_permission', 'waiting'].includes(
        s.currentTask.status,
      )
    ) {
      return;
    }
    s.setRepeatingTask(true);
    try {
      const newTask = await myboteam.startTask({ prompt: s.currentTask.prompt });
      navigate(`/execution/${newTask.id}`);
    } catch (err) {
      logger.error('Failed to repeat task:', err);
    } finally {
      s.setRepeatingTask(false);
    }
  }, [myboteam, s, navigate]);

  const handleOpenSpeechSettings = useCallback(() => {
    navigate('/settings/voice');
  }, [navigate]);
  const handleOpenModelSettings = useCallback(() => {
    navigate('/settings/providers');
  }, [navigate]);

  return {
    handleFollowUp,
    handleContinue,
    handlePauseAction,
    handleTaskAction,
    handlePermissionResponse,
    handleBugReport,
    handleRepeatTask,
    handleOpenSpeechSettings,
    handleOpenModelSettings,
  };
}
