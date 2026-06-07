import type { OpencodeClient } from '@opencode-ai/sdk/v2';
import {
  CompletionEnforcer,
  type CompletionEnforcerCallbacks,
} from '../../opencode/completion/index.js';
import { MYBOTEAM_AGENT_NAME } from '../../opencode/config-generator.js';
import { serializeError } from '../../utils/error.js';
import { buildWorkspaceInstructionRuntimeBlock } from './adapter-utils.js';
import { type OpenCodeLogError, OpenCodeLogWatcher } from './OpenCodeLogWatcher.js';

export function createCompletionEnforcer(
  currentSessionId: () => string | null,
  client: () => OpencodeClient | null,
  emit: (event: string, ...args: unknown[]) => boolean,
  markComplete: (status: string, error?: string) => void,
): CompletionEnforcer {
  const callbacks: CompletionEnforcerCallbacks = {
    onStartContinuation: async (prompt: string) => {
      const sid = currentSessionId();
      const cl = client();
      if (sid && cl) {
        const runtimeSystem = buildWorkspaceInstructionRuntimeBlock(undefined);
        cl.session
          .prompt({
            sessionID: sid,
            agent: MYBOTEAM_AGENT_NAME,
            ...(runtimeSystem ? { system: runtimeSystem } : {}),
            parts: [{ type: 'text', text: prompt }],
          })
          .catch((err: unknown) => {
            const log = { warn: (m: string, d?: unknown) => console.warn(m, d) };
            log.warn('continuation prompt rejected', { error: serializeError(err) });
          });
      }
    },
    onComplete: () => {
      markComplete('success');
    },
    onDebug: (type: string, message: string, data?: unknown) => {
      emit('debug', { type, message, data });
    },
  };
  return new CompletionEnforcer(callbacks);
}

export function setupLogWatcher(
  logWatcher: { on: (event: string, listener: (...args: unknown[]) => void) => void },
  hasCompleted: () => boolean,
  client: () => unknown,
  emit: (event: string, ...args: unknown[]) => boolean,
  markComplete: (status: string, error?: string) => void,
  abortSession: (reason: string) => Promise<void>,
): void {
  logWatcher.on('error', ((error: OpenCodeLogError) => {
    if (hasCompleted() || !client()) return;
    const log = { info: (m: string, d?: unknown) => console.info(m, d) };
    log.info(`Log watcher detected error: ${error.errorName}`);

    const errorMessage = OpenCodeLogWatcher.getErrorMessage(error);

    emit('debug', {
      type: 'error',
      message: `[${error.errorName}] ${errorMessage}`,
      data: {
        errorName: error.errorName,
        statusCode: error.statusCode,
        providerID: error.providerID,
        modelID: error.modelID,
        message: error.message,
      },
    });

    if (error.isAuthError && error.providerID) {
      emit('auth-error', {
        providerId: error.providerID,
        message: errorMessage,
      });
    }

    markComplete('error', errorMessage);
    void abortSession('log-error');
  }) as (...args: unknown[]) => void);
}
