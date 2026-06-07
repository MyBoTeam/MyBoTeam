import type {
  ConnectorMcpDcrOAuthDefinition,
  ConnectorMcpFixedClientOAuthDefinition,
} from '@myboteam/agent-core/common';
import { getConnectorDefinitions, OAuthProviderId } from '@myboteam/agent-core/common';
import { ConnectorAuthStore } from './connector-auth-store';

function hasStore(oauth: {
  kind: string;
}): oauth is ConnectorMcpDcrOAuthDefinition | ConnectorMcpFixedClientOAuthDefinition {
  return oauth.kind === 'mcp-dcr' || oauth.kind === 'mcp-fixed-client';
}

const authStoreMap = new Map<OAuthProviderId, ConnectorAuthStore>();

for (const def of getConnectorDefinitions()) {
  if (hasStore(def.desktopOAuth)) {
    authStoreMap.set(def.id, new ConnectorAuthStore(def.desktopOAuth.store));
  }
}

authStoreMap.set(
  OAuthProviderId.GitHub,
  new ConnectorAuthStore({
    key: 'github',
    usesDcr: false,
    storesServerUrl: false,

    callback: { host: '127.0.0.1', port: 0, path: '/' },
  }),
);

export function getConnectorAuthStore(id: OAuthProviderId): ConnectorAuthStore | undefined {
  return authStoreMap.get(id);
}

export function getAllConnectorAuthStores(): ReadonlyMap<OAuthProviderId, ConnectorAuthStore> {
  return authStoreMap;
}
