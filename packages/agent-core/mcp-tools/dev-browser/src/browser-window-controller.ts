import type { BrowserContext, Page } from 'playwright';
import { isClosedPageError, withTimeout } from './browser-runtime-utils.js';
import type { BrowserWindowControllerOptions } from './browser-window-controller-types.js';
import { setWindowStateForPage, syncWindowToViewport } from './browser-window-helpers.js';

export class BrowserWindowController {
  constructor(private readonly options: BrowserWindowControllerOptions) {}

  async getTargetId(page: Page, browserContext?: BrowserContext): Promise<string> {
    const activeContext = browserContext ?? (await this.options.ensureBrowserContext());
    const cdpSession = await activeContext.newCDPSession(page);
    try {
      const { targetInfo } = await cdpSession.send('Target.getTargetInfo');
      return targetInfo.targetId;
    } finally {
      await cdpSession.detach();
    }
  }

  async backgroundPage(page: Page, browserContext?: BrowserContext): Promise<void> {
    if (this.options.headless) {
      return;
    }
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY_MS = 500;
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        await setWindowStateForPage(page, 'minimized', this.options, undefined, browserContext);
        return;
      } catch (error) {
        lastError = error;
        if (isClosedPageError(error)) {
          throw error;
        }
        if (attempt < MAX_ATTEMPTS - 1) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
        }
      }
    }
    throw lastError;
  }

  async setNormalWindowState(
    page: Page,
    targetId: string,
    browserContext: BrowserContext,
  ): Promise<void> {
    await setWindowStateForPage(page, 'normal', this.options, targetId, browserContext);
  }

  async restorePageWithoutForeground(
    page: Page,
    targetId: string,
    browserContext: BrowserContext,
  ): Promise<void> {
    if (this.options.headless) {
      return;
    }
    await this.options.withPreservedForeground(async () => {
      await setWindowStateForPage(page, 'normal', this.options, targetId, browserContext);
    });
  }

  async focusPreparedPage(
    page: Page,
    targetId: string,
    browserContext: BrowserContext,
    timeoutMessage: string,
  ): Promise<void> {
    await this.prepareForegroundedWindow(page, targetId, browserContext);
    await withTimeout(page.bringToFront(), 15000, timeoutMessage);
  }

  private async prepareForegroundedWindow(
    page: Page,
    targetId: string,
    browserContext: BrowserContext,
  ): Promise<void> {
    await setWindowStateForPage(page, 'normal', this.options, targetId, browserContext);
    if (this.options.headless) {
      return;
    }
    await syncWindowToViewport(page, targetId, browserContext, this.options);
  }
}
