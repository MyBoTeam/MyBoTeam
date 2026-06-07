export type { StoredAuthEntry } from '@myboteam/agent-core/desktop-main';

export interface ConnectorOAuthStatus {
  connected: boolean;
  pendingAuthorization: boolean;
  lastValidatedAt?: number;
}
