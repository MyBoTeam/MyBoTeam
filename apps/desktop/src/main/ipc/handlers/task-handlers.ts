import { createTaskId, type TaskConfig } from '@myboteam/agent-core/desktop-main';
import type { IpcMainInvokeEvent } from 'electron';
import { BrowserWindow } from 'electron';
import { trackTaskStart } from '../../analytics/events';
import { getDaemonClient } from '../../daemon-bootstrap';
import {
  stopAllBrowserPreviewStreams,
  stopBrowserPreviewStream,
} from '../../services/browserPreview';
import * as workspaceManager from '../../store/workspaceManager';
import {
  createMockTask,
  detectScenarioFromPrompt,
  executeMockTaskFlow,
  isMockTaskEventsEnabled,
} from '../../test-utils/mock-task-flow';
import { sanitizeAttachments } from './attachment-utils';
import { hasReadyProviderViaDaemon } from './task-helpers';
import { registerTaskSessionHandlers } from './task-session-handlers';
import { assertTrustedWindow, handle } from './utils';

export function registerTaskHandlers(): void {
  registerTaskSessionHandlers();

  // ─── Task execution (proxied to daemon) ──────────────────────────────────────

  handle('task:start', async (event: IpcMainInvokeEvent, config: TaskConfig) => {
    assertTrustedWindow(BrowserWindow.fromWebContents(event.sender));

    if (!isMockTaskEventsEnabled() && !(await hasReadyProviderViaDaemon())) {
      throw new Error(
        'No provider is ready. Please connect a provider and select a model in Settings.',
      );
    }

    const taskId = createTaskId();

    if (isMockTaskEventsEnabled()) {
      const window = BrowserWindow.fromWebContents(event.sender)!;
      const mockTask = createMockTask(taskId, config.prompt);
      const scenario = detectScenarioFromPrompt(config.prompt);
      void executeMockTaskFlow(window, {
        taskId,
        prompt: config.prompt,
        scenario,
        delayMs: 50,
      });
      return mockTask;
    }

    const sanitizedAttachments = sanitizeAttachments(config.files as unknown[] | undefined);

    const client = getDaemonClient();
    const task = await client.call('task.start', {
      prompt: config.prompt,
      taskId,
      modelId: config.modelId,
      workspaceId: workspaceManager.getActiveWorkspace() ?? undefined,
      workingDirectory: config.workingDirectory,
      allowedTools: config.allowedTools,
      systemPromptAppend: config.systemPromptAppend,
      outputSchema: config.outputSchema,
      sessionId: config.sessionId,
      attachments: sanitizedAttachments,
    });

    try {
      trackTaskStart(
        { taskId, sessionId: config.sessionId || '', taskType: 'chat' },
        config.modelId,
      );
    } catch {
      /* best-effort analytics */
    }

    return task;
  });

  handle('task:cancel', async (_event: IpcMainInvokeEvent, taskId?: string) => {
    if (!taskId) {
      return;
    }

    const client = getDaemonClient();
    await client.call('task.cancel', { taskId });

    await stopBrowserPreviewStream(taskId);
  });

  handle('task:interrupt', async (_event: IpcMainInvokeEvent, taskId?: string) => {
    if (!taskId) {
      return;
    }

    const client = getDaemonClient();
    await client.call('task.interrupt', { taskId });

    await stopBrowserPreviewStream(taskId);
  });

  // ─── Task reads (proxied to daemon) ──────────────────────────────────────────

  handle('task:get', async (_event: IpcMainInvokeEvent, taskId: string) => {
    const client = getDaemonClient();
    return (await client.call('task.get', { taskId })) || null;
  });

  handle('task:list', async (_event: IpcMainInvokeEvent) => {
    const client = getDaemonClient();
    const activeId = workspaceManager.getActiveWorkspace();
    const activeWorkspace = activeId ? workspaceManager.getWorkspace(activeId) : null;
    const isDefault = !!activeWorkspace?.isDefault;
    const workspaceId = activeId && activeWorkspace ? activeId : undefined;
    return await client.call('task.list', { workspaceId, includeUnassigned: isDefault });
  });

  handle('task:delete', async (_event: IpcMainInvokeEvent, taskId: string) => {
    const client = getDaemonClient();
    await client.call('task.delete', { taskId });
    await stopBrowserPreviewStream(taskId);
  });

  handle('task:clear-history', async (_event: IpcMainInvokeEvent) => {
    const client = getDaemonClient();
    await client.call('task.clearHistory');
    await stopAllBrowserPreviewStreams();
  });

  handle('task:get-todos', async (_event: IpcMainInvokeEvent, taskId: string) => {
    const client = getDaemonClient();
    return await client.call('task.getTodos', { taskId });
  });
}
