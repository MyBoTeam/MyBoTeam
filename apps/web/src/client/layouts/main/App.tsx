import { SpinnerGapIcon, WarningIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { getMyBoTeam, isRunningInElectron } from '../../config/myboteam';
import { useTaskStore } from '../../stores/taskStore';
import { logger } from '../../utils/logger';
import { AnimatedOutletWrapper } from './App.components';
import type { AppStatus } from './App.types';
import { AppOverlays } from './components/AppOverlays';
import Sidebar from './components/Sidebar';
import { SidebarFallback } from './components/SidebarFallback';

export function App() {
  const { t } = useTranslation('errors');
  const [status, setStatus] = useState<AppStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const isTitleBarHidden = isFullScreen;

  const { openLauncher, isLauncherOpen, authError, clearAuthError } = useTaskStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openLauncher();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openLauncher]);

  useEffect(() => {
    const checkStatus = async () => {
      if (!isRunningInElectron()) {
        setErrorMessage(t('app.mustRunInDesktop'));
        setStatus('error');
        return;
      }

      try {
        const myboteam = getMyBoTeam();
        await myboteam.setOnboardingComplete(true);
        setStatus('ready');
      } catch (error) {
        logger.error('Failed to initialize app:', error);
        setStatus('ready');
      }
    };

    checkStatus();
  }, [t]);

  useEffect(() => {
    if (!isRunningInElectron()) return;

    const myboteam = getMyBoTeam();

    const queryState = () => {
      myboteam
        .isFullScreen()
        .then(setIsFullScreen)
        .catch(() => {});
    };

    queryState();
    const cleanupFullscreen = myboteam.onFullScreenChanged(setIsFullScreen);
    window.addEventListener('resize', queryState);

    return () => {
      cleanupFullscreen();
      window.removeEventListener('resize', queryState);
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <SpinnerGapIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <WarningIcon className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <h1 className="mb-2 text-xl font-semibold text-foreground">{t('app.unableToStart')}</h1>
          <p className="text-muted-foreground">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Invisible drag region for window dragging (macOS hiddenInset titlebar) — hidden when fullscreen */}
      {!isTitleBarHidden && (
        <div className="drag-region fixed top-0 left-0 right-0 h-10 z-50 pointer-events-none" />
      )}
      <ErrorBoundary fallback={(_error, _reset) => <SidebarFallback />}>
        <Sidebar isTitleBarHidden={isTitleBarHidden} />
      </ErrorBoundary>
      <main className="flex-1 overflow-hidden">
        <AnimatedOutletWrapper />
      </main>
      <AppOverlays
        authError={authError}
        clearAuthError={clearAuthError}
        isLauncherOpen={isLauncherOpen}
      />
    </div>
  );
}
