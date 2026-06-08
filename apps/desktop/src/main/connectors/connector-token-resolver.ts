import type { ConnectorDesktopOAuthKind, OAuthProviderId } from '@myboteam/agent-core/common';
import { getConnectorDefinition } from '@myboteam/agent-core/common';
import { performDesktopGithubFlow, performDesktopGoogleFlow } from './github-oauth-flow';
import { performMcpDcrFlow, performMcpFixedClientFlow } from './mcp-oauth-strategies';

export type ConnectorOAuthResult =
  | { ok: true; accessToken: string }
  | {
      ok: false;
      error: 'gh-not-found' | 'oauth-failed' | 'no-server-url' | 'not-configured';
      message?: string;
    };

export async function connectBuiltInConnector(
  providerId: OAuthProviderId,
): Promise<ConnectorOAuthResult> {
  const def = getConnectorDefinition(providerId);
  if (!def) {
    return {
      ok: false,
      error: 'not-configured',
      message: `No connector definition for ${providerId}`,
    };
  }

  const kind = def.desktopOAuth.kind as ConnectorDesktopOAuthKind;

  switch (kind) {
    case 'mcp-dcr':
      return performMcpDcrFlow(providerId, def);
    case 'mcp-fixed-client':
      return performMcpFixedClientFlow(providerId);
    case 'desktop-google':
      return performDesktopGoogleFlow(providerId);
    case 'desktop-github':
      return performDesktopGithubFlow(providerId);
    default:
      return assertNever(kind);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled OAuth kind: ${String(value)}`);
}
