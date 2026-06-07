/**
 * MyBoTeam AI IPC handlers.
 */

import type { IpcMainInvokeEvent } from 'electron';
import { getDaemonClient } from '../../../daemon-bootstrap';
import { isDaemonUnavailableError } from '../utils';
import { registerMyboteamAiUsageHandlers } from './myboteam-ai-usage-handlers';
import type { MyBoTeamConnectRpcResult } from './myboteam-ai-utils';
import { log, normalizeRuntimeError, RUNTIME_UNAVAILABLE_MSG } from './myboteam-ai-utils';

type HandleFn = <Args extends unknown[], ReturnType = unknown>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: Args) => ReturnType,
) => void;

export function registerMyboteamAiHandlers(handle: HandleFn): void {
  registerMyboteamAiUsageHandlers(handle);

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

    if (result.usage) {
      await client.call('provider.saveMyboteamAiCredits', { usage: result.usage });
    }

    log('INFO', `Connected with fingerprint ${result.deviceFingerprint.substring(0, 8)}...`);

    return {
      deviceFingerprint: result.deviceFingerprint,
      ...(result.usage ?? { spentCredits: 0, remainingCredits: 0, totalCredits: 0, resetsAt: '' }),
    };
  });
}
