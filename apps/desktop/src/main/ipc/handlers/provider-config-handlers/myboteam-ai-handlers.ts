/**
 * MyBoTeam AI IPC handlers.
 *
 * These handlers bridge the renderer's myboteam-ai IPC calls to the daemon
 * via JSON-RPC. The daemon owns the proxy, the identity, the provider
 * settings table and the credit cache — these handlers just orchestrate.
 *
 * Milestone 5 of the daemon-only-SQLite migration
 * (plan: /Users/yanai/.claude/plans/squishy-exploring-hamster.md):
 * every `getStorage()` call is gone. Reads go through `provider.getSettings`
 * / `provider.getMyboteamAiCredits`, writes through
 * `provider.setConnected` / `provider.saveMyboteamAiCredits` /
 * `provider.removeConnected` / `provider.setActive`.
 */

import type { CreditUsage, MyboteamAiCredentials } from '@myboteam/agent-core/desktop-main';
import type { IpcMainInvokeEvent } from 'electron';

type MyBoTeamConnectRpcResult = { deviceFingerprint: string; usage: CreditUsage | null };

import { getDaemonClient } from '../../../daemon-bootstrap';
import { getLogCollector } from '../../../logging';
import { isDaemonUnavailableError } from '../utils';

type HandleFn = <Args extends unknown[], ReturnType = unknown>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: Args) => ReturnType,
) => void;

const RUNTIME_UNAVAILABLE_MSG =
  'Free tier is not available in this build. Please use the official MyBoTeam release or connect your own API key.';

/** Normalize runtime-unavailable errors to a user-friendly message. */
function normalizeRuntimeError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('myboteam_runtime_unavailable')) {
    throw new Error(RUNTIME_UNAVAILABLE_MSG);
  }
  throw err;
}

function log(level: 'INFO' | 'WARN' | 'ERROR', msg: string) {
  try {
    getLogCollector()?.log(level, 'main' as const, `[myboteam-ai] ${msg}`);
  } catch {
    /* best-effort */
  }
}

/** Predicate mirror of the pre-M5 `storage.hasReadyProvider()` — any
 *  connected provider with `connection_status='connected'` and a non-null
 *  `selected_model_id`. Evaluated against the settings snapshot the caller
 *  has already fetched so we don't round-trip twice. */
function hasReadyProvider(
  settings: Awaited<ReturnType<ReturnType<typeof getDaemonClient>['call']>> extends infer _
    ? {
        connectedProviders: Record<
          string,
          { connectionStatus: string; selectedModelId: string | null } | undefined
        >;
      }
    : never,
): boolean {
  return Object.values(settings.connectedProviders).some(
    (p) => p?.connectionStatus === 'connected' && !!p.selectedModelId,
  );
}

export function registerMyboteamAiHandlers(handle: HandleFn): void {
  handle('myboteam-ai:connect', async () => {
    let result: MyBoTeamConnectRpcResult;
    try {
      const client = getDaemonClient();
      result = await client.call('myboteam-ai.connect');
    } catch (err) {
      if (isDaemonUnavailableError(err)) {
        throw new Error(RUNTIME_UNAVAILABLE_MSG);
      }
      normalizeRuntimeError(err);
    }

    const client = getDaemonClient();
    const credentials: MyboteamAiCredentials = {
      type: 'myboteam-ai',
      deviceFingerprint: result.deviceFingerprint,
    };

    await client.call('provider.setConnected', {
      providerId: 'myboteam-ai',
      provider: {
        providerId: 'myboteam-ai',
        connectionStatus: 'connected',
        selectedModelId: 'myboteam-ai/myboteam-free',
        credentials,
        lastConnectedAt: new Date().toISOString(),
      },
    });

    // Cache credits if available
    if (result.usage) {
      await client.call('provider.saveMyboteamAiCredits', { usage: result.usage });
    }

    log('INFO', `Connected with fingerprint ${result.deviceFingerprint.substring(0, 8)}...`);

    return {
      deviceFingerprint: result.deviceFingerprint,
      ...(result.usage ?? { spentCredits: 0, remainingCredits: 0, totalCredits: 0, resetsAt: '' }),
    };
  });

  handle('myboteam-ai:ensure-ready', async () => {
    let client: ReturnType<typeof getDaemonClient>;
    try {
      client = getDaemonClient();
    } catch (err) {
      if (isDaemonUnavailableError(err)) {
        throw new Error(RUNTIME_UNAVAILABLE_MSG);
      }
      throw err;
    }
    const settings = await client.call('provider.getSettings');
    const existing = settings.connectedProviders['myboteam-ai'];
    if (existing?.connectionStatus === 'connected') {
      return {
        deviceFingerprint: (existing.credentials as MyboteamAiCredentials).deviceFingerprint,
      };
    }

    // Not connected yet — connect without stealing active model
    let result: MyBoTeamConnectRpcResult;
    try {
      result = await client.call('myboteam-ai.connect');
    } catch (err) {
      normalizeRuntimeError(err);
    }

    const credentials: MyboteamAiCredentials = {
      type: 'myboteam-ai',
      deviceFingerprint: result.deviceFingerprint,
    };

    await client.call('provider.setConnected', {
      providerId: 'myboteam-ai',
      provider: {
        providerId: 'myboteam-ai',
        connectionStatus: 'connected',
        selectedModelId: 'myboteam-ai/myboteam-free',
        credentials,
        lastConnectedAt: new Date().toISOString(),
      },
    });

    // Don't steal active if the user already has a ready provider. Reuse
    // the snapshot we already fetched above; a second RPC round-trip
    // here would introduce a race where another flow could connect a
    // provider between the two reads.
    if (!hasReadyProvider(settings)) {
      await client.call('provider.setActive', { providerId: 'myboteam-ai' });
    }

    if (result.usage) {
      await client.call('provider.saveMyboteamAiCredits', { usage: result.usage });
    }

    return { deviceFingerprint: result.deviceFingerprint };
  });

  handle('myboteam-ai:disconnect', async () => {
    let client: ReturnType<typeof getDaemonClient>;
    try {
      client = getDaemonClient();
    } catch (err) {
      if (isDaemonUnavailableError(err)) return;
      throw err;
    }
    try {
      await client.call('myboteam-ai.disconnect');
    } catch (err) {
      log('WARN', `Daemon disconnect failed: ${String(err)}`);
    }

    // Credits are cleared automatically by removeConnectedProvider
    // (per the daemon-side SettingsService — same invariant pre-M5).
    await client.call('provider.removeConnected', { providerId: 'myboteam-ai' });
  });

  handle('myboteam-ai:get-usage', async () => {
    let client: ReturnType<typeof getDaemonClient>;
    try {
      client = getDaemonClient();
    } catch (err) {
      if (isDaemonUnavailableError(err)) {
        return { spentCredits: 0, remainingCredits: 0, totalCredits: 0, resetsAt: '' };
      }
      throw err;
    }

    /** Attempt to fetch live usage. */
    async function fetchLiveUsage(): Promise<CreditUsage> {
      return client.call('myboteam-ai.get-usage');
    }

    /** Reconnect daemon identity if it was lost (daemon restart) */
    async function reconnectAndRetry(): Promise<CreditUsage | null> {
      const settings = await client.call('provider.getSettings');
      const provider = settings.connectedProviders['myboteam-ai'];
      if (provider?.connectionStatus !== 'connected') {
        return null;
      }

      try {
        log('INFO', 'Daemon identity lost — reconnecting');
        const connectResult = await client.call('myboteam-ai.connect');

        // If connect returned usage (including exhausted state), use it directly
        if (connectResult.usage) {
          return connectResult.usage;
        }

        // Otherwise try live fetch
        return await fetchLiveUsage();
      } catch {
        return null;
      }
    }

    try {
      const live = await fetchLiveUsage();
      // If proxy hasn't connected yet (all zeros), fall back to cache
      if (live.totalCredits === 0) {
        return (await client.call('provider.getMyboteamAiCredits')) ?? live;
      }
      await client.call('provider.saveMyboteamAiCredits', { usage: live });
      return live;
    } catch (err) {
      if (isDaemonUnavailableError(err)) {
        return { spentCredits: 0, remainingCredits: 0, totalCredits: 0, resetsAt: '' };
      }
      // First failure — try reconnecting (daemon may have restarted)
      const retried = await reconnectAndRetry();
      if (retried) {
        if (retried.totalCredits > 0) {
          await client.call('provider.saveMyboteamAiCredits', { usage: retried });
        }
        return retried;
      }

      // All attempts failed — return cached
      return (
        (await client.call('provider.getMyboteamAiCredits')) ?? {
          spentCredits: 0,
          remainingCredits: 0,
          totalCredits: 0,
          resetsAt: '',
        }
      );
    }
  });

  handle('myboteam-ai:get-status', async () => {
    try {
      const client = getDaemonClient();
      const settings = await client.call('provider.getSettings');
      const provider = settings.connectedProviders['myboteam-ai'];
      return { connected: provider?.connectionStatus === 'connected' };
    } catch (err) {
      if (isDaemonUnavailableError(err)) return { connected: false };
      throw err;
    }
  });
}
