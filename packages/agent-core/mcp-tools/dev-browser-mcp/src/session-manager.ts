import type { Page } from 'playwright';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { detectAuthPage } from './auth-detection.js';
import {
  ensureConnected as ensureConnectedRaw,
  focusPageWindow,
  backgroundPageWindow,
  getCDPSession,
  getConnectionMode,
  getFullPageName,
  getPage as getPageRaw,
} from './connection.js';
import { getAISnapshot } from './snapshot-manager.js';

// ─── Tool debug ─────────────────────────────────────────────────────────────

type GetAISnapshotFn = (page: Page, options?: Record<string, unknown>) => Promise<string>;

export interface ToolDebug {
  getAISnapshot?: GetAISnapshotFn;
  handlePreAction?(
    name: string,
    args: unknown,
    context: { getPage: typeof getPage; getAISnapshot: GetAISnapshotFn },
  ): Promise<unknown>;
  handlePostAction?(
    name: string,
    args: unknown,
    result: CallToolResult,
    preCapture: unknown,
    context: { getPage: typeof getPage; getAISnapshot: GetAISnapshotFn },
  ): Promise<CallToolResult>;
}

let toolDebug: ToolDebug | null = null;

export function getToolDebug(): ToolDebug | null {
  return toolDebug;
}

export async function loadToolDebug(): Promise<void> {
  const debugPath = process.env.MYBOTEAM_TOOL_DEBUG_PATH;
  if (debugPath) {
    console.error(`[dev-browser-mcp] Loading tool debug from: ${debugPath}`);
    try {
      toolDebug = await import(debugPath);
      console.error('[dev-browser-mcp] Tool debug loaded successfully');
    } catch (err) {
      console.error('[dev-browser-mcp] Failed to load tool debug:', err);
    }
  } else {
    console.error('[dev-browser-mcp] MYBOTEAM_TOOL_DEBUG_PATH not set, tool debug disabled');
  }
}

// ─── Page override state ────────────────────────────────────────────────────

export let activePageOverride: Page | null = null;

export function setActivePageOverride(page: Page | null): void {
  activePageOverride = page;
}

// ─── Glow state ─────────────────────────────────────────────────────────────

let glowingPage: Page | null = null;
const pagesWithGlowListeners = new WeakSet<Page>();
let glowInitialized = false;

async function injectGlowElements(page: Page): Promise<void> {
  if (page.isClosed()) return;

  try {
    await page.evaluate(() => {
      document.getElementById('__dev-browser-active-glow')?.remove();
      document.getElementById('__dev-browser-active-glow-style')?.remove();

      const style = document.createElement('style');
      style.id = '__dev-browser-active-glow-style';
      style.textContent = `
      @keyframes devBrowserGlowColor {
        0%, 100% {
          border-color: rgba(59, 130, 246, 0.9);
          box-shadow:
            inset 0 0 30px rgba(59, 130, 246, 0.6),
            inset 0 0 60px rgba(59, 130, 246, 0.3),
            0 0 20px rgba(59, 130, 246, 0.4);
        }
        25% {
          border-color: rgba(168, 85, 247, 0.9);
          box-shadow:
            inset 0 0 30px rgba(168, 85, 247, 0.6),
            inset 0 0 60px rgba(168, 85, 247, 0.3),
            0 0 20px rgba(168, 85, 247, 0.4);
        }
        50% {
          border-color: rgba(236, 72, 153, 0.9);
          box-shadow:
            inset 0 0 30px rgba(236, 72, 153, 0.6),
            inset 0 0 60px rgba(236, 72, 153, 0.3),
            0 0 20px rgba(236, 72, 153, 0.4);
        }
        75% {
          border-color: rgba(34, 211, 238, 0.9);
          box-shadow:
            inset 0 0 30px rgba(34, 211, 238, 0.6),
            inset 0 0 60px rgba(34, 211, 238, 0.3),
            0 0 20px rgba(34, 211, 238, 0.4);
        }
      }
    `;
      document.head.appendChild(style);

      const overlay = document.createElement('div');
      overlay.id = '__dev-browser-active-glow';
      overlay.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483647;
      border: 5px solid rgba(59, 130, 246, 0.9);
      border-radius: 4px;
      box-shadow:
        inset 0 0 30px rgba(59, 130, 246, 0.6),
        inset 0 0 60px rgba(59, 130, 246, 0.3),
        0 0 20px rgba(59, 130, 246, 0.4);
      animation: devBrowserGlowColor 6s ease-in-out infinite;
    `;
      document.body.appendChild(overlay);
    });
  } catch (err) {
    console.error('[dev-browser-mcp] Error injecting glow elements:', err);
  }
}

export async function injectActiveTabGlow(page: Page): Promise<void> {
  if (glowingPage && glowingPage !== page && !glowingPage.isClosed()) {
    await removeActiveTabGlow(glowingPage);
  }

  glowingPage = page;

  await injectGlowElements(page);

  if (!pagesWithGlowListeners.has(page)) {
    pagesWithGlowListeners.add(page);

    page.on('load', async () => {
      if (glowingPage === page && !page.isClosed()) {
        console.error('[dev-browser-mcp] Page navigated, re-injecting glow...');
        await injectGlowElements(page);
      }
    });
  }
}

export async function removeActiveTabGlow(page: Page): Promise<void> {
  if (page.isClosed()) {
    if (glowingPage === page) {
      glowingPage = null;
    }
    return;
  }

  try {
    await page.evaluate(() => {
      document.getElementById('__dev-browser-active-glow')?.remove();
      document.getElementById('__dev-browser-active-glow-style')?.remove();
    });
  } catch {
    // intentionally empty
  }

  if (glowingPage === page) {
    glowingPage = null;
  }
}

// ─── Connection wrapper ─────────────────────────────────────────────────────

export async function ensureConnected() {
  const b = await ensureConnectedRaw();

  if (!glowInitialized && getConnectionMode() === 'builtin') {
    glowInitialized = true;
    for (const context of b.contexts()) {
      context.on('page', async (page) => {
        console.error('[dev-browser-mcp] New page detected, injecting glow immediately...');
        setTimeout(async () => {
          try {
            if (!page.isClosed()) {
              await injectActiveTabGlow(page);
              console.error('[dev-browser-mcp] Glow injected on new page');
            }
          } catch (err) {
            console.error('[dev-browser-mcp] Failed to inject glow on new page:', err);
          }
        }, 100);
      });

      for (const page of context.pages()) {
        if (!page.isClosed() && !glowingPage) {
          try {
            await injectActiveTabGlow(page);
          } catch (err) {
            console.error('[dev-browser-mcp] Failed to inject glow on existing page:', err);
          }
        }
      }
    }
  }

  return b;
}

export async function getPage(pageName?: string): Promise<Page> {
  if (activePageOverride) {
    if (!activePageOverride.isClosed()) {
      return activePageOverride;
    }
    activePageOverride = null;
  }

  return getPageRaw(pageName);
}

// ─── Interaction mode ───────────────────────────────────────────────────────

const interactionModePages = new Set<string>();

export async function checkInteractionMode(page: Page, pageName?: string): Promise<void> {
  try {
    const url = page.url();
    const title = await page.title().catch(() => '');
    const detection = detectAuthPage({ url, title });
    const fullName = getFullPageName(pageName);

    if (detection.isAuthPage && !interactionModePages.has(fullName)) {
      interactionModePages.add(fullName);
      await focusPageWindow(pageName);
    } else if (!detection.isAuthPage && interactionModePages.has(fullName)) {
      interactionModePages.delete(fullName);
      await backgroundPageWindow(pageName);
    }
  } catch {
    // best-effort — window management must never break the tool call
  }
}

// ─── Screencast ─────────────────────────────────────────────────────────────

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
