import type { ProviderId } from '@myboteam/agent-core/common';
import { lazy, Suspense } from 'react';
import { CloseConfirmDialog } from '../../../components/common/CloseConfirmDialog';
import { DaemonConnectionToast } from '../../../components/common/DaemonConnectionToast';

const AuthErrorToast = lazy(() =>
  import('../../../components/common/AuthErrorToast').then((module) => ({
    default: module.AuthErrorToast,
  })),
);
const TaskLauncher = lazy(() =>
  import('../../../components/common/TaskLauncher').then((module) => ({
    default: module.TaskLauncher,
  })),
);
const AuthSettingsDialog = lazy(() => import('./AuthSettingsDialog'));

type SettingsTab =
  | 'providers'
  | 'voice'
  | 'skills'
  | 'integrations'
  | 'scheduler'
  | 'general'
  | 'about';

interface AppOverlaysProps {
  authError: { providerId: string; message: string } | null;
  authSettingsOpen: boolean;
  authSettingsProvider: ProviderId | undefined;
  clearAuthError: () => void;
  handleAuthReLogin: () => void;
  handleAuthSettingsClose: (open: boolean) => void;
  isLauncherOpen: boolean;
  setAuthSettingsOpen: (open: boolean) => void;
  setAuthSettingsTab: (tab: SettingsTab) => void;
}

export function AppOverlays({
  authError,
  authSettingsOpen,
  authSettingsProvider,
  clearAuthError,
  handleAuthReLogin,
  handleAuthSettingsClose,
  isLauncherOpen,
  setAuthSettingsOpen,
  setAuthSettingsTab,
}: AppOverlaysProps) {
  return (
    <>
      {isLauncherOpen && (
        <Suspense fallback={null}>
          <TaskLauncher />
        </Suspense>
      )}

      {authError && (
        <Suspense fallback={null}>
          <AuthErrorToast
            error={authError}
            onReLogin={handleAuthReLogin}
            onDismiss={clearAuthError}
          />
        </Suspense>
      )}

      <DaemonConnectionToast
        onOpenSettings={() => {
          setAuthSettingsTab('general');
          setAuthSettingsOpen(true);
        }}
      />

      <CloseConfirmDialog />

      {authSettingsOpen && (
        <Suspense fallback={null}>
          <AuthSettingsDialog
            open={authSettingsOpen}
            onOpenChange={handleAuthSettingsClose}
            initialProvider={authSettingsProvider}
            onApiKeySaved={() => {
              clearAuthError();
              setAuthSettingsOpen(false);
            }}
          />
        </Suspense>
      )}
    </>
  );
}
