export enum OAuthProviderId {
  Slack = 'slack',
  Google = 'google',
  Jira = 'jira',
  GitHub = 'github',
  Monday = 'monday',
  Notion = 'notion',
  Lightdash = 'lightdash',
  Datadog = 'datadog',
}

export function isOAuthProviderId(value: string): value is OAuthProviderId {
  return Object.values(OAuthProviderId).includes(value as OAuthProviderId);
}

export function getOAuthProviderDisplayName(providerId: OAuthProviderId): string {
  switch (providerId) {
    case OAuthProviderId.Slack:
      return 'Slack';
    case OAuthProviderId.Google:
      return 'Google Drive';
    case OAuthProviderId.Jira:
      return 'Jira';
    case OAuthProviderId.GitHub:
      return 'GitHub';
    case OAuthProviderId.Monday:
      return 'monday.com';
    case OAuthProviderId.Notion:
      return 'Notion';
    case OAuthProviderId.Lightdash:
      return 'Lightdash';
    case OAuthProviderId.Datadog:
      return 'Datadog';
  }
}

export type ConnectorStatus = 'connected' | 'disconnected' | 'error' | 'connecting';

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresAt?: number;
  scope?: string;
}

export interface OAuthMetadata {
  issuer?: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  registrationEndpoint?: string;

  introspectionEndpoint?: string;
  scopesSupported?: string[];
}

export interface OAuthClientRegistration {
  clientId: string;
  clientSecret?: string;

  resourceServer?: string;

  mcp_resource_uri?: string;
}

export interface McpConnector {
  id: string;
  name: string;
  url: string;
  status: ConnectorStatus;
  isEnabled: boolean;
  oauthMetadata?: OAuthMetadata;
  clientRegistration?: OAuthClientRegistration;
  lastConnectedAt?: string;

  lastOAuthValidatedAt?: number;
  createdAt: string;
  updatedAt: string;
}

export type ConnectorDesktopOAuthKind =
  | 'mcp-dcr'
  | 'mcp-fixed-client'
  | 'desktop-google'
  | 'desktop-github';

export interface ConnectorCallbackBinding {
  readonly host: string;
  readonly port: number;
  readonly path: string;
}

export interface ConnectorAuthStoreConfig {
  readonly key: string;
  readonly serverUrl?: string;
  readonly usesDcr: boolean;
  readonly storesServerUrl: boolean;
  readonly callback: ConnectorCallbackBinding;
}

export interface StoredAuthEntry {
  accessToken?: string;
  refreshToken?: string;

  expiresAt?: number;

  lastOAuthValidatedAt?: number;
  clientRegistration?: OAuthClientRegistration;
  serverUrl?: string;
  codeVerifier?: string;
  oauthState?: string;
}

interface ConnectorDesktopOAuthBase {
  readonly kind: ConnectorDesktopOAuthKind;
}

export interface ConnectorMcpDcrOAuthDefinition extends ConnectorDesktopOAuthBase {
  readonly kind: 'mcp-dcr';
  readonly store: ConnectorAuthStoreConfig;
  readonly discoveryError: string;
  readonly registrationError: string;
  readonly tokenExchangeError: string;
  readonly extraAuthParams?: Record<string, string>;
}

export interface ConnectorMcpFixedClientOAuthDefinition extends ConnectorDesktopOAuthBase {
  readonly kind: 'mcp-fixed-client';
  readonly store: ConnectorAuthStoreConfig;
  readonly clientId: string;
  readonly discoveryError: string;
  readonly tokenExchangeError: string;
}

export interface ConnectorCustomOAuthDefinition extends ConnectorDesktopOAuthBase {
  readonly kind: 'desktop-google' | 'desktop-github';
}

export type ConnectorDesktopOAuthDefinition =
  | ConnectorMcpDcrOAuthDefinition
  | ConnectorMcpFixedClientOAuthDefinition
  | ConnectorCustomOAuthDefinition;

export interface ConnectorDefinition {
  readonly id: OAuthProviderId;

  readonly displayName: string;

  readonly referencePrompt?: string;

  readonly desktopOAuth: ConnectorDesktopOAuthDefinition;
}

export interface ConnectorAuthStatus {
  readonly providerId: OAuthProviderId;
  readonly connected: boolean;
  readonly pendingAuthorization: boolean;
  readonly lastValidatedAt?: number;
}
