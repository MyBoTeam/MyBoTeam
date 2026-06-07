import type { ConnectedProvider, CopilotOAuthCredentials } from '@myboteam/agent-core';
import { COPILOT_MODELS } from '@myboteam/agent-core/common';
import { useEffect, useState } from 'react';
import { createLogger } from '@/lib/logger';
import { getMyBoTeam } from '@/lib/myboteam';

const logger = createLogger('useCopilotConnection');

function buildCopilotProvider(): ConnectedProvider {
  return {
    providerId: 'copilot',
    connectionStatus: 'connected',
    selectedModelId: 'copilot/gpt-4o',
    credentials: { type: 'copilot-oauth' } as CopilotOAuthCredentials,
    lastConnectedAt: new Date().toISOString(),
    availableModels: COPILOT_MODELS.map((m) => ({ id: m.id, name: m.displayName })),
  };
}

interface UseCopilotConnectionOptions {
  isConnected: boolean;
  onConnect: (provider: ConnectedProvider) => void;
  onDisconnect: () => void;
}

interface UseCopilotConnectionResult {
  connecting: boolean;
  error: string | null;
  userCode: string | null;
  verificationUri: string | null;
  handleConnect: () => Promise<void>;
  handleDisconnect: () => Promise<void>;
}

export function useCopilotConnection({
  isConnected,
  onConnect,
  onDisconnect,
}: UseCopilotConnectionOptions): UseCopilotConnectionResult {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCode, setUserCode] = useState<string | null>(null);
  const [verificationUri, setVerificationUri] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      return;
    }

    const myboteam = getMyBoTeam();
    myboteam
      .getCopilotOAuthStatus()
      .then((status) => {
        if (status.connected) {
          onConnect(buildCopilotProvider());
        }
      })
      .catch((err) => logger.error('Failed to check Copilot status:', err));
  }, [onConnect, isConnected]);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    setUserCode(null);
    setVerificationUri(null);

    let pollStarted = false;

    try {
      const myboteam = getMyBoTeam();

      const result = await myboteam.loginGithubCopilot();

      if (result.ok) {
        if (result.userCode) {
          setUserCode(result.userCode);
        }
        if (result.verificationUri) {
          setVerificationUri(result.verificationUri);
        }

        pollStarted = true;

        const POLL_INTERVAL_MS = 5000;
        const expiresInMs = (result.expiresIn ?? 900) * 1000;
        const MAX_ATTEMPTS = Math.max(1, Math.ceil(expiresInMs / POLL_INTERVAL_MS));

        const poll = async () => {
          for (let i = 0; i < MAX_ATTEMPTS; i++) {
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
            const status = await myboteam.getCopilotOAuthStatus();
            if (status.connected) {
              onConnect(buildCopilotProvider());
              setUserCode(null);
              setVerificationUri(null);
              setConnecting(false);
              return;
            }
          }
          setError('Timed out waiting for GitHub authorization. Please try again.');
          setUserCode(null);
          setVerificationUri(null);
          setConnecting(false);
        };

        void poll().catch((err) => {
          logger.error('Error polling Copilot status:', err);
          setError(err instanceof Error ? err.message : 'Connection failed');
          setConnecting(false);
        });

        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      if (!pollStarted) {
        setConnecting(false);
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      const myboteam = getMyBoTeam();
      await myboteam.logoutGithubCopilot();
    } catch (err) {
      logger.error('Failed to logout from Copilot:', err);
    }
    setUserCode(null);
    setVerificationUri(null);
    onDisconnect();
  };

  return {
    connecting,
    error,
    userCode,
    verificationUri,
    handleConnect,
    handleDisconnect,
  };
}
