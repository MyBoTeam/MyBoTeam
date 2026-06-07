import { app } from 'electron';
import { flushAnalytics } from './analytics/analytics-service';
import { trackAppClose } from './analytics/events';
import { flushMixpanel } from './analytics/mixpanel-service';
import { getDaemonClient, shutdownDaemon } from './daemon-bootstrap';
import { type getLogCollector, shutdownLogCollector } from './logging';
import { cleanupVertexServiceAccountKey, stopDevBrowserServer } from './opencode';

import { slackMcpOAuthFlow } from './opencode/slack-auth';
import { stopHuggingFaceServer } from './providers/huggingface-local';
import { stopAllBrowserPreviewStreams } from './services/browserPreview';
import * as workspaceManager from './store/workspaceManager';
import { destroyTray } from './tray';

let stopDaemonOnQuit = false;

export function requestStopDaemonOnQuit(): void {
  stopDaemonOnQuit = true;
}

type AppLogger = ReturnType<typeof getLogCollector> | null;

async function raceTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export async function shutdownApp(logger: AppLogger): Promise<void> {
  destroyTray();
  // NOTE: `shutdownDaemon()` moved below the analytics-flush block in

  try {
    await raceTimeout(stopDevBrowserServer(), 5000, 'Dev-browser shutdown');
  } catch (error: unknown) {
    logger?.logEnv('ERROR', `[Main] Failed to stop dev-browser server: ${String(error)}`);
  }

  try {
    await raceTimeout(stopAllBrowserPreviewStreams(), 5000, 'Stopping browser preview streams');
  } catch (error: unknown) {
    logger?.logEnv('ERROR', `[Main] Failed to stop browser preview streams: ${String(error)}`);
  }

  try {
    await raceTimeout(stopHuggingFaceServer(), 5000, 'HuggingFace server stop');
  } catch (error: unknown) {
    logger?.logEnv('ERROR', `[Main] Failed to stop HuggingFace server: ${String(error)}`);
  }

  try {
    cleanupVertexServiceAccountKey();
  } catch (error: unknown) {
    logger?.logEnv('ERROR', `[Main] Error during cleanupVertexServiceAccountKey: ${String(error)}`);
  }

  try {
    slackMcpOAuthFlow.dispose();
  } catch (error: unknown) {
    logger?.logEnv('ERROR', `[Main] Error during slackMcpOAuthFlow.dispose: ${String(error)}`);
  }

  try {
    workspaceManager.close();
  } catch (error: unknown) {
    logger?.logEnv('ERROR', `[Main] Error during workspaceManager.close: ${String(error)}`);
  }

  try {
    await trackAppClose();
    flushAnalytics();
    flushMixpanel();
  } catch (error: unknown) {
    logger?.logEnv('ERROR', `[Main] Error during analytics flush: ${String(error)}`);
  }

  if (stopDaemonOnQuit) {
    try {
      const client = getDaemonClient();
      await client.call('daemon.shutdown').catch(() => {});
    } catch (error: unknown) {
      logger?.logEnv('INFO', `[Main] daemon.shutdown skipped: ${String(error)}`);
    }
  }

  shutdownDaemon();

  try {
    shutdownLogCollector();
  } finally {
    app.quit();
  }
}
