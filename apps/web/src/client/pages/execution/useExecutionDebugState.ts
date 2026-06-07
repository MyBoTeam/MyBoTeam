import { useEffect, useRef, useState } from 'react';
import type { DebugLogEntry } from '../../components/execution/DebugPanel';
import { createLogger } from '../../lib/logger';

const logger = createLogger('Execution');

interface UseExecutionDebugStateOptions {
  myboteam: ReturnType<typeof import('../../lib/myboteam').getMyBoTeam>;
  startupStageTaskId: string | null | undefined;
  startupStage: { startTime: number; stage: string; message?: string } | null | undefined;
  id: string | undefined;
  currentTool: string | null;
}

export function useExecutionDebugState({
  myboteam,
  startupStageTaskId,
  startupStage,
  id,
  currentTool,
}: UseExecutionDebugStateOptions) {
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);
  const [debugModeEnabled, setDebugModeEnabled] = useState(false);
  const [bugReporting, setBugReporting] = useState(false);
  const [bugReportSaved, setBugReportSaved] = useState(false);
  const bugSavedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    myboteam
      .getDebugMode()
      .then(setDebugModeEnabled)
      .catch((err: unknown) => {
        logger.error('Failed to get debug mode:', err);
      });
    const unsub = myboteam.onDebugModeChange?.(({ enabled }: { enabled: boolean }) => {
      setDebugModeEnabled(enabled);
    });
    return () => {
      unsub?.();
    };
  }, [myboteam.onDebugModeChange, myboteam.getDebugMode]);

  useEffect(() => {
    const isShowing = startupStageTaskId === id && startupStage && !currentTool;
    if (!isShowing) {
      setElapsedTime(0);
      return;
    }
    const calc = () => Math.floor((Date.now() - startupStage.startTime) / 1000);
    setElapsedTime(calc());
    const interval = setInterval(() => {
      setElapsedTime(calc());
    }, 1000);
    return () => clearInterval(interval);
  }, [startupStageTaskId, startupStage, id, currentTool]);

  useEffect(() => {
    return () => {
      if (bugSavedTimerRef.current) {
        clearTimeout(bugSavedTimerRef.current);
        bugSavedTimerRef.current = null;
      }
    };
  }, []);

  return {
    debugLogs,
    setDebugLogs,
    debugModeEnabled,
    bugReporting,
    setBugReporting,
    bugReportSaved,
    setBugReportSaved,
    bugSavedTimerRef,
    elapsedTime,
  };
}
