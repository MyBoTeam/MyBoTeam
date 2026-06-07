import type {
  ConnectorAuthStatus,
  McpConnector,
  OAuthProviderId,
} from '@myboteam/agent-core/common';
import { useCallback, useEffect, useState } from 'react';
import { getMyBoTeam } from '@/lib/myboteam';
import type { SlackMcpAuthState } from './useConnectors.types';

export function useConnectors() {
  const [connectors, setConnectors] = useState<McpConnector[]>([]);
  const [slackAuth, setSlackAuth] = useState<SlackMcpAuthState>({
    connected: false,
    pendingAuthorization: false,
  });
  const [builtInAuthStates, setBuiltInAuthStates] = useState<Record<string, ConnectorAuthStatus>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnectors = useCallback(async () => {
    const myboteam = getMyBoTeam();
    try {
      const [connectorsResult, slackStatusResult, builtInStatusResult] = await Promise.allSettled([
        myboteam.getConnectors(),
        myboteam.getSlackMcpOauthStatus(),
        myboteam.getBuiltInConnectorAuthStatus(),
      ]);

      if (connectorsResult.status === 'fulfilled') {
        setConnectors(connectorsResult.value);
      }

      if (slackStatusResult.status === 'fulfilled') {
        setSlackAuth(slackStatusResult.value);
      }

      if (builtInStatusResult.status === 'fulfilled') {
        const statusMap: Record<string, ConnectorAuthStatus> = {};
        for (const status of builtInStatusResult.value) {
          statusMap[status.providerId] = status;
        }
        setBuiltInAuthStates(statusMap);
      }

      if (
        connectorsResult.status === 'rejected' &&
        slackStatusResult.status === 'rejected' &&
        builtInStatusResult.status === 'rejected'
      ) {
        throw connectorsResult.reason;
      }

      setError(null);
    } catch (err) {
      console.error('Failed to load connectors:', err);
      setError(err instanceof Error ? err.message : 'Failed to load connectors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnectors();
  }, [fetchConnectors]);

  const addConnector = useCallback(async (name: string, url: string) => {
    const myboteam = getMyBoTeam();
    const connector = await myboteam.addConnector(name, url);
    setConnectors((prev) => [connector, ...prev]);
    return connector;
  }, []);

  const deleteConnector = useCallback(async (id: string) => {
    const myboteam = getMyBoTeam();
    await myboteam.deleteConnector(id);
    setConnectors((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const toggleEnabled = useCallback(
    async (id: string) => {
      const connector = connectors.find((c) => c.id === id);
      if (!connector) {
        return;
      }

      const myboteam = getMyBoTeam();
      await myboteam.setConnectorEnabled(id, !connector.isEnabled);
      setConnectors((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isEnabled: !c.isEnabled } : c)),
      );
    },
    [connectors],
  );

  const startOAuth = useCallback(async (connectorId: string) => {
    setConnectors((prev) =>
      prev.map((c) => (c.id === connectorId ? { ...c, status: 'connecting' as const } : c)),
    );

    try {
      const myboteam = getMyBoTeam();
      return await myboteam.startConnectorOAuth(connectorId);
    } catch (err) {
      setConnectors((prev) =>
        prev.map((c) => (c.id === connectorId ? { ...c, status: 'error' as const } : c)),
      );
      throw err;
    }
  }, []);

  const completeOAuth = useCallback(async (state: string, code: string) => {
    const myboteam = getMyBoTeam();
    const updated = await myboteam.completeConnectorOAuth(state, code);
    if (updated) {
      setConnectors((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    }
    return updated;
  }, []);

  const disconnect = useCallback(async (connectorId: string) => {
    const myboteam = getMyBoTeam();
    await myboteam.disconnectConnector(connectorId);
    setConnectors((prev) =>
      prev.map((c) => (c.id === connectorId ? { ...c, status: 'disconnected' as const } : c)),
    );
  }, []);

  const authenticateBuiltIn = useCallback(
    async (providerId: OAuthProviderId) => {
      setBuiltInAuthStates((prev) => ({
        ...prev,
        [providerId]: {
          ...(prev[providerId] ?? { providerId, connected: false, pendingAuthorization: false }),
          pendingAuthorization: true,
        },
      }));

      try {
        const myboteam = getMyBoTeam();
        await myboteam.loginBuiltInConnector(providerId);
        await fetchConnectors();
      } catch (err) {
        setBuiltInAuthStates((prev) => ({
          ...prev,
          [providerId]: {
            ...(prev[providerId] ?? { providerId, connected: false, pendingAuthorization: false }),
            pendingAuthorization: false,
          },
        }));
        throw err;
      }
    },
    [fetchConnectors],
  );

  const disconnectBuiltIn = useCallback(async (providerId: OAuthProviderId) => {
    const myboteam = getMyBoTeam();
    await myboteam.logoutBuiltInConnector(providerId);
    setBuiltInAuthStates((prev) => ({
      ...prev,
      [providerId]: {
        providerId,
        connected: false,
        pendingAuthorization: false,
      },
    }));
  }, []);

  const authenticateSlack = useCallback(async () => {
    const myboteam = getMyBoTeam();

    setSlackAuth(() => ({
      connected: false,
      pendingAuthorization: true,
    }));

    try {
      if (slackAuth.pendingAuthorization) {
        await myboteam.logoutSlackMcp();
      }

      await myboteam.loginSlackMcp();
      const status = await myboteam.getSlackMcpOauthStatus();
      setSlackAuth(status);
      return status;
    } catch (err) {
      try {
        const status = await myboteam.getSlackMcpOauthStatus();
        setSlackAuth(status);
      } catch {
        setSlackAuth({ connected: false, pendingAuthorization: false });
      }
      throw err;
    }
  }, [slackAuth.pendingAuthorization]);

  const disconnectSlack = useCallback(async () => {
    const myboteam = getMyBoTeam();
    await myboteam.logoutSlackMcp();
    setSlackAuth({ connected: false, pendingAuthorization: false });
  }, []);

  return {
    connectors,
    slackAuth,
    builtInAuthStates,
    loading,
    error,
    addConnector,
    deleteConnector,
    toggleEnabled,
    startOAuth,
    completeOAuth,
    disconnect,
    authenticateBuiltIn,
    disconnectBuiltIn,
    authenticateSlack,
    disconnectSlack,
    refetch: fetchConnectors,
  };
}
