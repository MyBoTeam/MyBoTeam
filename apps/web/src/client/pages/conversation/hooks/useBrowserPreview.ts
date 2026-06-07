import { useCallback, useEffect, useReducer, useRef } from 'react';
import { initialPreviewState, isViewStatus, previewReducer } from './browserPreviewState';
import type { ViewStatus } from './StatusBadge';
import { useBrowserPreviewIpc } from './useBrowserPreviewIpc';

interface UseBrowserPreviewOptions {
  taskId: string;
  pageName?: string | null;
  currentTool?: string | null;
}

export interface UseBrowserPreviewResult {
  frameData: string | null;
  currentUrl: string;
  status: ViewStatus;
  error: string | undefined;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  imgRef: React.RefObject<HTMLImageElement | null>;
}

export function useBrowserPreview({
  taskId,
  pageName,
  currentTool,
}: UseBrowserPreviewOptions): UseBrowserPreviewResult {
  const imgRef = useRef<HTMLImageElement>(null);
  const isPausedRef = useRef(false);
  const screencastStartedRef = useRef(false);
  const isCollapsedRef = useRef(false);
  const statusRef = useRef<ViewStatus>('idle');

  const [state, dispatch] = useReducer(previewReducer, initialPreviewState);

  useEffect(() => {
    screencastStartedRef.current = false;
    statusRef.current = 'idle';
    dispatch({ type: 'RESET' });
  }, []);

  useEffect(() => {
    isCollapsedRef.current = state.isCollapsed;
  }, [state.isCollapsed]);

  useEffect(() => {
    const handleVisibility = () => {
      isPausedRef.current = document.hidden;
    };
    handleVisibility();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!currentTool) {
      return;
    }

    const toolSuffix = currentTool.includes('_browser_')
      ? currentTool.slice(currentTool.lastIndexOf('_browser_') + 1)
      : currentTool;
    const isBrowserTool = toolSuffix.startsWith('browser_') && toolSuffix !== 'browser_screencast';
    if (!isBrowserTool || screencastStartedRef.current) {
      return;
    }

    const api = window.myboteam;
    if (!api?.startBrowserPreview) {
      return;
    }

    let cancelled = false;
    screencastStartedRef.current = true;
    statusRef.current = 'starting';
    dispatch({ type: 'SET_STARTING' });

    api.startBrowserPreview(taskId).catch(() => {
      if (cancelled) {
        return;
      }

      screencastStartedRef.current = false;
      statusRef.current = 'idle';
      dispatch({ type: 'IDLE' });
    });

    return () => {
      cancelled = true;
    };
  }, [currentTool, taskId]);

  const handleFrame = useCallback(
    (event: { taskId: string; pageName: string; frame: string; timestamp: number }) => {
      if (event.taskId !== taskId) {
        return;
      }
      if (pageName && event.pageName !== pageName) {
        return;
      }
      if (isPausedRef.current || isCollapsedRef.current) {
        return;
      }
      if (statusRef.current === 'streaming') {
        if (imgRef.current) {
          imgRef.current.src = `data:image/jpeg;base64,${event.frame}`;
        }
      } else {
        dispatch({ type: 'SET_FRAME', frame: event.frame });
        if (imgRef.current) {
          imgRef.current.src = `data:image/jpeg;base64,${event.frame}`;
        }
        statusRef.current = 'streaming';
      }
    },
    [taskId, pageName],
  );

  const handleNavigate = useCallback(
    (event: { taskId: string; pageName: string; url: string }) => {
      if (event.taskId !== taskId) {
        return;
      }
      if (pageName && event.pageName !== pageName) {
        return;
      }
      dispatch({ type: 'SET_URL', url: event.url });
    },
    [taskId, pageName],
  );

  const handleStatus = useCallback(
    (event: { taskId: string; pageName: string; status: string; message?: string }) => {
      if (event.taskId !== taskId) {
        return;
      }
      if (pageName && event.pageName !== pageName) {
        return;
      }
      if (event.status === 'stopped') {
        screencastStartedRef.current = false;
        statusRef.current = 'idle';
        dispatch({ type: 'IDLE' });
        return;
      }
      if (event.status === 'error') {
        screencastStartedRef.current = false;
      }
      if (!isViewStatus(event.status)) {
        return;
      }
      statusRef.current = event.status;
      dispatch({ type: 'SET_STATUS', status: event.status, message: event.message });
    },
    [taskId, pageName],
  );

  const setIsCollapsed = useCallback((value: boolean) => {
    dispatch({ type: 'SET_COLLAPSED', value });
  }, []);

  useBrowserPreviewIpc({ taskId, handleFrame, handleNavigate, handleStatus });

  return {
    frameData: state.frameData,
    currentUrl: state.currentUrl,
    status: state.status,
    error: state.error,
    isCollapsed: state.isCollapsed,
    setIsCollapsed,
    imgRef,
  };
}
