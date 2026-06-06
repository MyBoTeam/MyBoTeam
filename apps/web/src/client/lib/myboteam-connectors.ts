import type { McpConnector } from '@myboteam/agent-core';
import type { ConnectorAuthStatus, OAuthProviderId } from '@myboteam/agent-core/common';

export interface MyBoTeamAPIConnectors {
  getConnectors(): Promise<McpConnector[]>;
  addConnector(name: string, url: string): Promise<McpConnector>;
  deleteConnector(id: string): Promise<void>;
  setConnectorEnabled(id: string, enabled: boolean): Promise<void>;
  startConnectorOAuth(connectorId: string): Promise<{ state: string; authUrl: string }>;
  completeConnectorOAuth(state: string, code: string): Promise<McpConnector>;
  disconnectConnector(connectorId: string): Promise<void>;
  onMcpAuthCallback?(callback: (url: string) => void): () => void;
  getBuiltInConnectorAuthStatus(): Promise<ConnectorAuthStatus[]>;
  loginBuiltInConnector(providerId: OAuthProviderId): Promise<{ ok: boolean }>;
  logoutBuiltInConnector(providerId: OAuthProviderId): Promise<void>;
  lightdashGetServerUrl(): Promise<string | null>;
  lightdashSetServerUrl(url: string): Promise<void>;
  datadogGetServerUrl(): Promise<string | null>;
  datadogSetServerUrl(url: string): Promise<void>;
}
