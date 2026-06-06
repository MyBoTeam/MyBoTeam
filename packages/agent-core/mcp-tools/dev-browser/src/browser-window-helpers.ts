import type { BrowserContext, CDPSession, Page } from 'playwright';
import type { BrowserWindowBounds, BrowserWindowState } from './browser-page-service-state.js';
import { isClosedPageError } from './browser-runtime-utils.js';
import type { BrowserWindowControllerOptions } from './browser-window-controller-types.js';

export async function withBrowserWindowForPage<T>(
  page: Page,
  operation: (cdpSession: CDPSession, windowId: number, bounds: BrowserWindowBounds) => Promise<T>,
  options: BrowserWindowControllerOptions,
  targetId?: string,
  browserContext?: BrowserContext,
): Promise<T> {
  const activeContext = browserContext ?? (await options.ensureBrowserContext());
  const cdpSession = await activeContext.newCDPSession(page);
  try {
    const resolvedTargetId =
      targetId ??
      ((await cdpSession.send('Target.getTargetInfo')) as { targetInfo: { targetId: string } })
        .targetInfo.targetId;
    const { windowId, bounds } = (await cdpSession.send('Browser.getWindowForTarget', {
      targetId: resolvedTargetId,
    })) as { windowId: number; bounds?: BrowserWindowBounds };
    return await operation(cdpSession, windowId, bounds ?? {});
  } finally {
    await cdpSession.detach().catch(() => {});
  }
}

export async function setWindowStateForPage(
  page: Page,
  windowState: BrowserWindowState,
  options: BrowserWindowControllerOptions,
  targetId?: string,
  browserContext?: BrowserContext,
): Promise<void> {
  await withBrowserWindowForPage(
    page,
    async (cdpSession, windowId) => {
      await cdpSession.send('Browser.setWindowBounds', { windowId, bounds: { windowState } });
    },
    options,
    targetId,
    browserContext,
  );
}

export async function setWindowBoundsForPage(
  page: Page,
  bounds: BrowserWindowBounds,
  options: BrowserWindowControllerOptions,
  targetId?: string,
  browserContext?: BrowserContext,
): Promise<void> {
  await withBrowserWindowForPage(
    page,
    async (cdpSession, windowId) => {
      await cdpSession.send('Browser.setWindowBounds', { windowId, bounds });
    },
    options,
    targetId,
    browserContext,
  );
}

export async function setWindowContentsSizeForPage(
  page: Page,
  width: number,
  height: number,
  options: BrowserWindowControllerOptions,
  targetId?: string,
  browserContext?: BrowserContext,
): Promise<void> {
  await withBrowserWindowForPage(
    page,
    async (cdpSession, windowId) => {
      await cdpSession.send('Browser.setContentsSize', { windowId, width, height });
    },
    options,
    targetId,
    browserContext,
  );
}

function clampWindowSizeDelta(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export async function normalizeWindowBoundsForPage(
  page: Page,
  width: number,
  height: number,
  options: BrowserWindowControllerOptions,
  targetId?: string,
  browserContext?: BrowserContext,
): Promise<void> {
  await withBrowserWindowForPage(
    page,
    async (_cdpSession, _windowId, bounds) => {
      const desiredWidth = width + clampWindowSizeDelta((bounds.width ?? width) - width, 0, 64);
      const desiredHeight =
        height + clampWindowSizeDelta((bounds.height ?? height) - height, 80, 220);
      await setWindowBoundsForPage(
        page,
        { width: desiredWidth, height: desiredHeight },
        options,
        targetId,
        browserContext,
      );
    },
    options,
    targetId,
    browserContext,
  );
}

export async function syncWindowToViewport(
  page: Page,
  targetId: string,
  browserContext: BrowserContext,
  options: BrowserWindowControllerOptions,
): Promise<void> {
  const viewport = page.viewportSize() ?? { width: 1280, height: 720 };
  await setWindowContentsSizeForPage(
    page,
    viewport.width,
    viewport.height,
    options,
    targetId,
    browserContext,
  ).catch((error) => {
    if (isClosedPageError(error)) throw error;
    console.warn('[syncWindowToViewport] setWindowContentsSizeForPage failed', {
      targetId,
      viewport,
      pageId: page?.id?.(),
      error,
    });
  });
  await normalizeWindowBoundsForPage(
    page,
    viewport.width,
    viewport.height,
    options,
    targetId,
    browserContext,
  ).catch((error) => {
    if (isClosedPageError(error)) throw error;
    console.warn('[syncWindowToViewport] normalizeWindowBoundsForPage failed', {
      targetId,
      viewport,
      pageId: page?.id?.(),
      error,
    });
  });
}
