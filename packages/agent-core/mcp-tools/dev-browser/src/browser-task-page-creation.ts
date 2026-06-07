import type { BrowserContext, Page } from 'playwright';
import { navigatePageToUrl } from './browser-page-navigator.js';
import {
  type CreatedTaskPage,
  selectReusableStartupPage,
  type TaskPageLaunchMode,
} from './browser-page-service-state.js';
import { isClosedPageError, withTimeout } from './browser-runtime-utils.js';
import type {
  BrowserTaskPageFactoryOptions,
  CreateTaskPageParams,
} from './browser-task-page-types.js';
import type { BrowserWindowController } from './browser-window-controller.js';
import type { ViewportSize } from './types.js';

export interface CreateTaskPageResult {
  createdPage: CreatedTaskPage;
  consumedStartupPage: boolean;
}

export async function createTaskPage(
  params: CreateTaskPageParams,
  reusableStartupPage: Page | null,
  options: BrowserTaskPageFactoryOptions,
): Promise<CreateTaskPageResult> {
  const launchMode = options.headless ? 'background-normal' : params.launchMode;
  const openPages = params.browserContext.pages().filter((candidate) => !candidate.isClosed());
  const candidate = selectReusableStartupPage(
    reusableStartupPage,
    params.activeTaskPageCount,
    openPages,
  );
  if (candidate) {
    const createdPage = await createFromReusableStartupPage(
      {
        browserContext: params.browserContext,
        initialUrl: params.initialUrl,
        launchMode,
        name: params.name,
        page: candidate,
        viewport: params.viewport,
      },
      options.windowController,
    );
    return { createdPage, consumedStartupPage: true };
  }
  const anchorPage = openPages[0];
  if (options.headless || !anchorPage) {
    const createdPage = await createStandalonePage(params, options);
    return { createdPage, consumedStartupPage: false };
  }
  const createdPage = await createAnchoredPage(anchorPage, params, options);
  return { createdPage, consumedStartupPage: false };
}

async function createFromReusableStartupPage(
  opts: {
    browserContext: BrowserContext;
    initialUrl?: string;
    launchMode: TaskPageLaunchMode;
    name: string;
    page: Page;
    viewport?: ViewportSize;
  },
  windowController: BrowserWindowController,
): Promise<CreatedTaskPage> {
  const { browserContext, initialUrl, launchMode, name, page, viewport } = opts;
  try {
    const targetId = await windowController.getTargetId(page, browserContext);
    if (viewport) {
      await page.setViewportSize(viewport);
    }
    let navigatedDuringCreate = false;
    if (initialUrl) {
      await navigatePageToUrl(name, page, initialUrl);
      navigatedDuringCreate = true;
    }
    await prepareReusedStartupPageForLaunch(
      { browserContext, launchMode, page, targetId },
      windowController,
    );
    return {
      page,
      targetId,
      windowState: 'normal',
      backgroundAfterFirstFrame: launchMode === 'minimized-once',
      navigatedDuringCreate,
    };
  } catch (error) {
    if (!page.isClosed()) {
      await page.close().catch(() => {});
    }
    throw error;
  }
}

async function prepareReusedStartupPageForLaunch(
  opts: {
    browserContext: BrowserContext;
    launchMode: TaskPageLaunchMode;
    page: Page;
    targetId: string;
  },
  windowController: BrowserWindowController,
): Promise<void> {
  const { browserContext, launchMode, page, targetId } = opts;
  if (launchMode === 'foreground') {
    await windowController.setNormalWindowState(page, targetId, browserContext);
  }
}

async function createStandalonePage(
  params: CreateTaskPageParams,
  options: BrowserTaskPageFactoryOptions,
): Promise<CreatedTaskPage> {
  return options.withPreservedForeground(async () => {
    const page = await withTimeout(
      params.browserContext.newPage(),
      30000,
      'Page creation timed out after 30s',
    );
    try {
      if (params.viewport) {
        await page.setViewportSize(params.viewport);
      }
      let navigatedDuringCreate = false;
      if (params.initialUrl) {
        await navigatePageToUrl(params.name, page, params.initialUrl);
        navigatedDuringCreate = true;
      }
      const targetId = await options.windowController.getTargetId(page, params.browserContext);
      return {
        page,
        targetId,
        windowState: 'normal',
        backgroundAfterFirstFrame: params.launchMode === 'minimized-once',
        navigatedDuringCreate,
      };
    } catch (error) {
      await page.close().catch(() => {});
      throw error;
    }
  });
}

async function createAnchoredPage(
  anchorPage: Page,
  params: CreateTaskPageParams,
  options: BrowserTaskPageFactoryOptions,
): Promise<CreatedTaskPage> {
  return options.withPreservedForeground(async () => {
    const cdpSession = await params.browserContext.newCDPSession(anchorPage);
    let _createdTargetId: string | null = null;
    let page: Page | null = null;
    try {
      const { targetId } = (await cdpSession.send('Target.createTarget', {
        url: params.initialUrl ?? 'about:blank',
        background: params.launchMode !== 'foreground',
      })) as { targetId: string };
      _createdTargetId = targetId;
      page = await waitForPageByTargetId(targetId, params.browserContext, options.windowController);
      if (params.viewport) {
        await page.setViewportSize(params.viewport);
      }
      return {
        page,
        targetId,
        windowState: 'normal',
        backgroundAfterFirstFrame: params.launchMode === 'minimized-once',
        navigatedDuringCreate: !!params.initialUrl,
      };
    } catch (error) {
      if (page && !page.isClosed()) {
        await page.close().catch(() => {});
      }
      throw error;
    } finally {
      if (_createdTargetId && !page) {
        await cdpSession.send('Target.closeTarget', { targetId: _createdTargetId }).catch(() => {});
      }
      await cdpSession.detach().catch(() => {});
    }
  });
}

async function waitForPageByTargetId(
  targetId: string,
  browserContext: BrowserContext,
  windowController: BrowserWindowController,
): Promise<Page> {
  const startTime = Date.now();
  while (Date.now() - startTime < 30000) {
    for (const candidate of browserContext.pages()) {
      if (candidate.isClosed()) continue;
      try {
        if ((await windowController.getTargetId(candidate, browserContext)) === targetId) {
          return candidate;
        }
      } catch (error) {
        if (!isClosedPageError(error)) throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for background page target ${targetId}`);
}
