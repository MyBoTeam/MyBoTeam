import { useEffect } from 'react';
import type { ViewStatus } from '../components/StatusBadge';

interface UseBrowserPreviewIpcOptions {
  taskId: string;
  handleFrame: (event: {
    taskId: string;
    pageName: string;
    frame: string;
    timestamp: number;
  }) => void;
  handleNavigate: (event: { taskId: string; pageName: string; url: string }) => void;
  handleStatus: (event: {
    taskId: string;
    pageName: string;
    status: string;
    message?: string;
  }) => void;
}

export function useBrowserPreviewIpc({
  taskId,
  handleFrame,
  handleNavigate,
  handleStatus,
}: UseBrowserPreviewIpcOptions): void {
  useEffect(() => {
    const api = window.myboteam;
    if (!api) {
      return;
    }

    const cleanups: (() => void)[] = [];

    if (api.onBrowserFrame) {
      cleanups.push(api.onBrowserFrame(handleFrame));
    }
    if (api.onBrowserNavigate) {
      cleanups.push(api.onBrowserNavigate(handleNavigate));
    }
    if (api.onBrowserStatus) {
      cleanups.push(api.onBrowserStatus(handleStatus));
    }

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, [handleFrame, handleNavigate, handleStatus]);

  useEffect(() => {
    const api = window.myboteam;
    return () => {
      api?.stopBrowserPreview?.(taskId).catch(() => {});
    };
  }, [taskId]);
}

export type { ViewStatus };
