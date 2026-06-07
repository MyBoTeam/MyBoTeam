import type { OAuthClientRegistration, OAuthMetadata } from '@myboteam/agent-core/desktop-main';

// In-memory store for pending OAuth flows (keyed by state parameter).
// Stays in main because it's transient (lives only between start-oauth
// and complete-oauth) and the flow pairs the callback state with locally
// generated PKCE values — nothing persistent.
export const OAUTH_FLOW_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const pendingOAuthFlows = new Map<
  string,
  {
    connectorId: string;
    codeVerifier: string;
    metadata: OAuthMetadata;
    clientRegistration: OAuthClientRegistration;
    createdAt: number;
  }
>();

export function cleanupExpiredOAuthFlows(): void {
  const now = Date.now();
  for (const [state, flow] of pendingOAuthFlows) {
    if (now - flow.createdAt > OAUTH_FLOW_TTL_MS) {
      pendingOAuthFlows.delete(state);
    }
  }
}
