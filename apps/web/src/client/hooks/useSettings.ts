import { useCallback, useEffect, useState } from 'react';
import { useProviderSettings } from '@/components/settings/hooks/useProviderSettings';
import { getMyBoTeam } from '@/lib/myboteam';

export function useSettings() {
  const [debugMode, setDebugModeState] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [appVersion, setAppVersion] = useState('');
  const [versionLoading, setVersionLoading] = useState(true);

  const {
    settings,
    loading,
    error,
    refetch,
    setActiveProvider,
    connectProvider,
    disconnectProvider,
    updateModel,
    switchProviderModel,
  } = useProviderSettings();
  const myboteam = getMyBoTeam();

  useEffect(() => {
    myboteam
      .getDebugMode()
      .then(setDebugModeState)
      .catch(() => {});
    myboteam
      .getNotificationsEnabled()
      .then(setNotificationsEnabledState)
      .catch(() => {});
    myboteam
      .getVersion()
      .then((v) => {
        setAppVersion(v);
        setVersionLoading(false);
      })
      .catch(() => setVersionLoading(false));
  }, [myboteam]);

  const handleDebugToggle = useCallback(async () => {
    const newValue = !debugMode;
    await myboteam.setDebugMode(newValue);
    setDebugModeState(newValue);
  }, [debugMode, myboteam]);

  const handleNotificationsToggle = useCallback(async () => {
    const newValue = !notificationsEnabled;
    await myboteam.setNotificationsEnabled(newValue);
    setNotificationsEnabledState(newValue);
  }, [notificationsEnabled, myboteam]);

  return {
    settings,
    loading,
    error,
    refetch,
    debugMode,
    notificationsEnabled,
    appVersion,
    versionLoading,
    handleDebugToggle,
    handleNotificationsToggle,
    setActiveProvider,
    connectProvider,
    disconnectProvider,
    updateModel,
    switchProviderModel,
  };
}
