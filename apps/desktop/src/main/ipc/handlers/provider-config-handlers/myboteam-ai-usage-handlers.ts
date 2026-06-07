import type { CreditUsage, MyboteamAiCredentials } from '@myboteam/agent-core/desktop-main';
import { getDaemonClient } from '../../../daemon-bootstrap';
import { isDaemonUnavailableError } from '../utils';
import type { MyBoTeamConnectRpcResult } from './myboteam-ai-utils';
import { log, normalizeRuntimeError } from './myboteam-ai-utils';

type HandleFn = <Args extends unknown[], ReturnType = unknown>(
  channel: string,
  handler: (event: import('electron').IpcMainInvokeEvent, ...args: Args) => ReturnType,
) => void;

export function registerMyboteamAiUsageHandlers(handle: HandleFn): void {
  handle('myboteam-ai:ensure-ready', async () => {
    let client: ReturnType<typeof getDaemonClient>;
    try {
      client = getDaemonClient();
    } catch (err) {
      if (isDaemonUnavailableError(err)) {
        throw new Error(
          'Free tier is not available in this build. Please use the official MyBoTeam release or connect your own API key.',
        );
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

    let result: MyBoTeamConnectRpcResult;
    try {
      result = await client.call('myboteam-ai.connect');
    } catch (err) {
      normalizeRuntimeError(err);
    }

    const credentials = {
      type: 'myboteam-ai' as const,
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

    if (
      !Object.values(settings.connectedProviders).some(
        (p) => p?.connectionStatus === 'connected' && !!p.selectedModelId,
      )
    ) {
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

    async function fetchLiveUsage(): Promise<CreditUsage> {
      return client.call('myboteam-ai.get-usage');
    }

    async function reconnectAndRetry(): Promise<CreditUsage | null> {
      const settings = await client.call('provider.getSettings');
      const provider = settings.connectedProviders['myboteam-ai'];
      if (provider?.connectionStatus !== 'connected') {
        return null;
      }

      try {
        log('INFO', 'Daemon identity lost — reconnecting');
        const connectResult = await client.call('myboteam-ai.connect');

        if (connectResult.usage) {
          return connectResult.usage;
        }

        return await fetchLiveUsage();
      } catch {
        return null;
      }
    }

    try {
      const live = await fetchLiveUsage();
      if (live.totalCredits === 0) {
        return (await client.call('provider.getMyboteamAiCredits')) ?? live;
      }
      await client.call('provider.saveMyboteamAiCredits', { usage: live });
      return live;
    } catch (err) {
      if (isDaemonUnavailableError(err)) {
        return { spentCredits: 0, remainingCredits: 0, totalCredits: 0, resetsAt: '' };
      }
      const retried = await reconnectAndRetry();
      if (retried) {
        if (retried.totalCredits > 0) {
          await client.call('provider.saveMyboteamAiCredits', { usage: retried });
        }
        return retried;
      }

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
