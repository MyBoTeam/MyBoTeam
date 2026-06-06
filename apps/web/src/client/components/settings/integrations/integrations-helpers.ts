import type { ConnectorAuthStatus, OAuthProviderId } from '@myboteam/agent-core/common';

export function getAuthState(
  builtInAuthStates: Record<string, ConnectorAuthStatus>,
  providerId: OAuthProviderId,
): Pick<ConnectorAuthStatus, 'connected' | 'pendingAuthorization'> {
  return (
    builtInAuthStates[providerId] ?? {
      connected: false,
      pendingAuthorization: false,
    }
  );
}

export function isActionLoading(
  builtInActionLoading: Record<string, boolean>,
  providerId: OAuthProviderId,
): boolean {
  return builtInActionLoading[providerId] ?? false;
}
