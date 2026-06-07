import { type FileAttachmentInfo, sanitizeString } from '@myboteam/agent-core/desktop-main';
import type { IpcMainInvokeEvent } from 'electron';
import { BrowserWindow } from 'electron';
import { getDaemonClient } from '../../daemon-bootstrap';
import {
  isScreencastActive,
  startBrowserPreviewStream,
  stopBrowserPreviewStream,
} from '../../services/browserPreview';
import * as workspaceManager from '../../store/workspaceManager';
import { isMockTaskEventsEnabled } from '../../test-utils/mock-task-flow';
import { sanitizeAttachments } from './attachment-utils';
import { hasReadyProviderViaDaemon } from './task-helpers';
import { assertTrustedWindow, handle } from './utils';

export function registerTaskSessionHandlers(): void {
  // ─── Browser Preview IPC handlers (ENG-695) ─────────────────────────────────
  handle(
    'browser-preview:start',
    async (_event: IpcMainInvokeEvent, taskId: string, pageName?: string) => {
      if (!taskId || typeof taskId !== 'string') {
        throw new Error('taskId is required');
      }
      await startBrowserPreviewStream(taskId, pageName);
      return { success: true };
    },
  );

  handle('browser-preview:stop', async (_event: IpcMainInvokeEvent, taskId: string) => {
    if (!taskId || typeof taskId !== 'string') {
      throw new Error('taskId is required');
    }
    await stopBrowserPreviewStream(taskId);
    return { stopped: true };
  });

  handle('browser-preview:status', async () => {
    return { active: isScreencastActive() };
  });

  // ─── Session resume (proxied to daemon) ──────────────────────────────────────

  handle(
    'session:resume',
    async (
      event: IpcMainInvokeEvent,
      sessionId: string,
      prompt: string,
      existingTaskId?: string,
      attachments?: FileAttachmentInfo[],
    ) => {
      assertTrustedWindow(BrowserWindow.fromWebContents(event.sender));

      const validatedSessionId = sanitizeString(sessionId, 'sessionId', 128);
      const validatedPrompt = sanitizeString(prompt, 'prompt');
      const validatedExistingTaskId = existingTaskId
        ? sanitizeString(existingTaskId, 'taskId', 128)
        : undefined;

      if (!isMockTaskEventsEnabled() && !(await hasReadyProviderViaDaemon())) {
        throw new Error(
          'No provider is ready. Please connect a provider and select a model in Settings.',
        );
      }

      const sanitizedAttachments = sanitizeAttachments(attachments as unknown[] | undefined);

      const client = getDaemonClient();
      const task = await client.call('session.resume', {
        sessionId: validatedSessionId,
        prompt: validatedPrompt,
        existingTaskId: validatedExistingTaskId,
        workspaceId: workspaceManager.getActiveWorkspace() ?? undefined,
        attachments: sanitizedAttachments,
      });

      return task;
    },
  );

  // ─── Permission response (proxied to daemon) ────────────────────────────────

  handle(
    'permission:respond',
    async (_event: IpcMainInvokeEvent, response: Record<string, unknown>) => {
      if (isMockTaskEventsEnabled()) {
        return;
      }
      const client = getDaemonClient();
      await client.call(
        'permission.respond',
        response as {
          requestId: string;
          taskId: string;
          decision: 'allow' | 'deny';
          message?: string;
          selectedOptions?: string[];
          customText?: string;
        },
      );
    },
  );
}
