import { getCDPSession, getFullPageName, getPage } from './connection.js';

const FRAME_INTERVAL_MS = 100;
const activeFrameHandlers = new Map<string, (event: { data: string; sessionId: number }) => void>();
const screencastStarting = new Set<string>();

export async function startScreencast(pageName?: string): Promise<void> {
  const pageKey = pageName || 'main';
  const fullPageName = getFullPageName(pageName);

  if (screencastStarting.has(pageKey)) {
    return;
  }
  screencastStarting.add(pageKey);

  try {
    const resolvedPage = await getPage(pageName);
    const context = resolvedPage.context();
    const session = await context.newCDPSession(resolvedPage);

    const existingHandler = activeFrameHandlers.get(pageKey);
    if (existingHandler) {
      session.off('Page.screencastFrame', existingHandler);
      activeFrameHandlers.delete(pageKey);
    }

    await session.send('Page.stopScreencast').catch(() => {});
    await session.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 50,
      maxWidth: 800,
      everyNthFrame: 1,
    } as any);

    let lastFrameTime = 0;

    const frameHandler = async (event: { data: string; sessionId: number }) => {
      try {
        const now = Date.now();
        if (now - lastFrameTime < FRAME_INTERVAL_MS) {
          await session
            .send('Page.screencastFrameAck', { sessionId: event.sessionId } as any)
            .catch(() => {});
          return;
        }
        lastFrameTime = now;
        const taskId = process.env.MYBOTEAM_TASK_ID || 'default';
        console.log(
          JSON.stringify({
            type: 'browser-frame',
            taskId,
            pageName: pageName || 'main',
            frame: event.data,
            timestamp: now,
          }),
        );
        await session
          .send('Page.screencastFrameAck', { sessionId: event.sessionId } as any)
          .catch(() => {});
      } catch (err) {
        console.error('[dev-browser-mcp] Error handling screencast frame:', err);
      }
    };

    activeFrameHandlers.set(pageKey, frameHandler);
    session.on('Page.screencastFrame', frameHandler);
    console.error(`[dev-browser-mcp] Screencast started for page: ${fullPageName}`);
  } catch (err) {
    console.error(`[dev-browser-mcp] Failed to start screencast for ${fullPageName}:`, err);
  } finally {
    screencastStarting.delete(pageKey);
  }
}

export async function stopScreencast(pageName?: string): Promise<void> {
  const pageKey = pageName || 'main';
  const fullPageName = getFullPageName(pageName);

  try {
    const session = await getCDPSession(pageName);
    const existingHandler = activeFrameHandlers.get(pageKey);
    if (existingHandler) {
      session.off('Page.screencastFrame', existingHandler);
      activeFrameHandlers.delete(pageKey);
    }
    await session.send('Page.stopScreencast');
    console.error(`[dev-browser-mcp] Screencast stopped for page: ${fullPageName}`);
  } catch (err) {
    console.error(`[dev-browser-mcp] Failed to stop screencast for ${fullPageName}:`, err);
  }
}
