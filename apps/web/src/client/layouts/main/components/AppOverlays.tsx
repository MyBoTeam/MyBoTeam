import { OAuthProviderId } from '@myboteam/agent-core/common';
import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
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

interface AppOverlaysProps {
  authError: { providerId: string; message: string } | null;
  clearAuthError: () => void;
  isLauncherOpen: boolean;
}

export function AppOverlays({ authError, clearAuthError, isLauncherOpen }: AppOverlaysProps) {
  const navigate = useNavigate();

  const handleAuthReLogin = () => {
    if (authError) {
      if (authError.providerId === OAuthProviderId.Slack) {
        navigate('/settings/integrations');
      } else {
        navigate('/settings/providers');
      }
      clearAuthError();
    }
  };

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

      <DaemonConnectionToast onNavigateToSettings={() => navigate('/settings/general')} />

      <CloseConfirmDialog />
    </>
  );
}
