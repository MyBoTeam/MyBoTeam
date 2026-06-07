import { createOpencodeClient } from '@opencode-ai/sdk/v2';
import type { PermissionResponse } from '../../common/types/permission.js';
import type { Task, TaskConfig } from '../../common/types/task.js';
import { MYBOTEAM_AGENT_NAME } from '../../opencode/config-generator.js';
import type { OnBeforeStartContext, OnBeforeStartResult } from '../../types/task-manager.js';
import { serializeError } from '../../utils/error.js';
import type { AdapterState } from './adapter-state.js';
import {
  buildModelParam,
  deriveTitle,
  generateTaskId,
  buildWorkspaceInstructionRuntimeBlock as runtimeBlock,
} from './adapter-utils.js';
import { OpenCodeRuntimeUnavailableError } from './open-code-runtime-unavailable-error.js';

export async function prepareEnvAndClient(state: AdapterState, config: TaskConfig): Promise<void> {
  if (state.isDisposed) {
    throw new Error('Adapter has been disposed and cannot start new tasks');
  }

  const taskId = config.taskId || generateTaskId();
  state.currentTaskId = taskId;
  state.currentSessionId = null;
  state.currentModelId = config.modelId ?? null;
  state.currentProviderId = config.provider ?? null;
  state.hasCompleted = false;
  state.wasInterrupted = false;
  state.pendingRequest = null;
  state.browserFrameSeen.clear();
  state.messageRoles.clear();
  state.pendingTextParts.clear();
  state.countedToolCallIds.clear();
  state.awaitingIdle = false;
  state.sawAssistantProgress = false;
  state.completionEnforcer?.reset();
  state.lastWorkingDirectory = config.workingDirectory;
  state.options.setProxyTaskId?.(taskId);

  if (state.logWatcher) {
    await state.logWatcher.start();
  }

  const onBeforeStartCtx: OnBeforeStartContext = {
    taskId,
    workspaceId: config.workspaceId,
  };

  if (state.options.onBeforeStart) {
    const rawResult = await state.options.onBeforeStart(onBeforeStartCtx);
    if (rawResult && typeof rawResult === 'object' && 'env' in rawResult) {
      const result = rawResult as OnBeforeStartResult;
      state.externalEnv = result.env ?? {};
      state.workspaceInstructions = result.workspaceInstructions;
    } else {
      state.externalEnv = (rawResult as NodeJS.ProcessEnv | undefined) ?? {};
      state.workspaceInstructions = undefined;
    }
  }

  if (!state.options.getServerUrl) {
    throw new OpenCodeRuntimeUnavailableError('AdapterOptions.getServerUrl not configured.');
  }
  const serverUrl = await state.options.getServerUrl(taskId, onBeforeStartCtx);
  if (!serverUrl) {
    throw new OpenCodeRuntimeUnavailableError(
      `No opencode-serve URL available for task ${taskId}.`,
    );
  }

  state.client = createOpencodeClient({ baseUrl: serverUrl });
}

export async function createSessionAndPrompt(
  state: AdapterState,
  config: TaskConfig,
): Promise<Task> {
  const taskId = state.currentTaskId ?? config.taskId ?? generateTaskId();

  state.emit('progress', { stage: 'loading', message: 'Loading agent...' });

  const model = buildModelParam(config);
  let sessionId: string | null = config.sessionId ?? null;

  if (!sessionId) {
    const sessionCreateRes = await state.client!.session.create(
      { title: deriveTitle(config.prompt) },
      { throwOnError: true },
    );
    sessionId =
      (sessionCreateRes as { data?: { id?: string }; id?: string }).data?.id ??
      (sessionCreateRes as { id?: string }).id ??
      null;
    if (!sessionId) {
      throw new Error('session.create did not return a session ID');
    }
  }
  state.currentSessionId = sessionId;

  state.emit('progress', { stage: 'waiting', message: 'Waiting for response...' });

  state.awaitingIdle = true;

  const system = runtimeBlock(state.workspaceInstructions);

  state
    .client!.session.prompt({
      sessionID: sessionId,
      agent: MYBOTEAM_AGENT_NAME,
      ...(system ? { system } : {}),
      parts: [{ type: 'text', text: config.prompt }],
      ...(model ? { model } : {}),
    })
    .catch((err: unknown) => {
      const log = { warn: (m: string, d?: unknown) => console.warn(m, d) };
      log.warn('session.prompt rejected', { error: serializeError(err) });
    });

  return {
    id: taskId,
    prompt: config.prompt,
    status: 'running' as const,
    sessionId,
    messages: [],
    createdAt: new Date().toISOString(),
  };
}

export async function sendResponse(
  state: AdapterState,
  response: PermissionResponse,
): Promise<void> {
  if (response.taskId && state.currentTaskId && response.taskId !== state.currentTaskId) {
    throw new Error(
      `sendResponse taskId mismatch: adapter task=${state.currentTaskId}, response task=${response.taskId}`,
    );
  }
  const pending = state.pendingRequest;
  if (!pending) {
    throw new Error('No pending permission or question request to respond to');
  }
  if (!state.client) {
    throw new Error('SDK client not initialised');
  }

  if (pending.kind === 'permission') {
    const reply: 'once' | 'always' | 'reject' = response.decision === 'allow' ? 'once' : 'reject';
    await state.client.permission.reply(
      { requestID: pending.sdkRequestId, reply },
      { throwOnError: true },
    );
    state.pendingRequest = null;
  } else {
    const answers: string[][] = [];
    if (response.selectedOptions && response.selectedOptions.length > 0) {
      answers.push(response.selectedOptions);
    }
    if (response.customText) {
      answers.push([response.customText]);
    }
    const isCancel = response.decision === 'deny' && answers.length === 0;
    if (isCancel) {
      await state.client.question.reject(
        { requestID: pending.sdkRequestId },
        { throwOnError: true },
      );
    } else {
      await state.client.question.reply(
        { requestID: pending.sdkRequestId, answers },
        { throwOnError: true },
      );
    }
    state.pendingRequest = null;

    if (isCancel) {
      state.emit('complete', {
        status: 'success',
        sessionId: state.currentSessionId || undefined,
      } as never);
      state.hasCompleted = true;
    }
  }
}
