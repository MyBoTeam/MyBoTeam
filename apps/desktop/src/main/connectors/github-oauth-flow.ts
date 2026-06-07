import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { OAuthProviderId } from '@myboteam/agent-core/common';
import { getConnectorAuthStore } from './connector-auth-registry';
import type { ConnectorOAuthResult } from './connector-token-resolver';
import {
  buildGhAugmentedPath,
  GH_BINARY_CANDIDATES,
  setDesktopConnectorConnected,
} from './desktop-connector-state';

const execFileAsync = promisify(execFile);

export async function performDesktopGoogleFlow(
  _providerId: OAuthProviderId,
): Promise<ConnectorOAuthResult> {
  return { ok: true, accessToken: 'google-managed' };
}

export async function performDesktopGithubFlow(
  providerId: OAuthProviderId,
): Promise<ConnectorOAuthResult> {
  const ghPath = await findGhBinary();
  if (!ghPath) {
    return {
      ok: false,
      error: 'gh-not-found',
      message: 'GitHub CLI (gh) not found on PATH. Install it from https://cli.github.com',
    };
  }

  const store = getConnectorAuthStore(providerId)!;
  const augmentedEnv = { ...process.env, PATH: buildGhAugmentedPath() };

  try {
    const { stdout } = await execFileAsync(ghPath, ['auth', 'token'], {
      timeout: 10_000,
      env: augmentedEnv,
    });
    const token = stdout.trim();
    if (token) {
      await store.setTokens({ accessToken: token, tokenType: 'bearer' }, Date.now());
      setDesktopConnectorConnected(providerId, true);
      return { ok: true, accessToken: token };
    }
  } catch {}

  try {
    await execFileAsync(ghPath, ['auth', 'login', '--git-protocol', 'https', '--web'], {
      timeout: 120_000,
      env: augmentedEnv,
    });

    const { stdout } = await execFileAsync(ghPath, ['auth', 'token'], {
      timeout: 10_000,
      env: augmentedEnv,
    });
    const token = stdout.trim();
    if (token) {
      await store.setTokens({ accessToken: token, tokenType: 'bearer' }, Date.now());
      setDesktopConnectorConnected(providerId, true);
      return { ok: true, accessToken: token };
    }

    setDesktopConnectorConnected(providerId, false);
    return {
      ok: false,
      error: 'oauth-failed',
      message: 'GitHub login succeeded but no token was retrieved',
    };
  } catch (err) {
    setDesktopConnectorConnected(providerId, false);
    return {
      ok: false,
      error: 'oauth-failed',
      message: err instanceof Error ? err.message : 'GitHub authentication failed',
    };
  }
}

async function findGhBinary(): Promise<string | null> {
  const augmentedEnv = { ...process.env, PATH: buildGhAugmentedPath() };
  for (const bin of GH_BINARY_CANDIDATES) {
    try {
      await execFileAsync(bin, ['--version'], { timeout: 5_000, env: augmentedEnv });
      return bin;
    } catch {}
  }
  return null;
}
