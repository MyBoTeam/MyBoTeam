import type { BrowserContext, Page } from 'playwright';
import { isClosedPageError } from './browser-runtime-utils.js';
import type { BrowserWindowController } from './browser-window-controller.js';

export async function focusPageWithController(
  page: Page,
  targetId: string,
  browserContext: BrowserContext,
  windowController: BrowserWindowController,
  name: string,
): Promise<void> {
  await windowController.focusPreparedPage(
    page,
    targetId,
    browserContext,
    `Focus timed out for ${name}`,
  );
}

export async function backgroundPageWithController(
  page: Page,
  browserContext: BrowserContext | undefined,
  windowController: BrowserWindowController,
): Promise<void> {
  await windowController.backgroundPage(page, browserContext);
}

export function isPageClosedError(error: unknown): boolean {
  return isClosedPageError(error);
}

export async function captureScreenshot(page: Page, quality: number): Promise<Buffer> {
  return page.screenshot({ type: 'jpeg', quality, fullPage: false }) as Promise<Buffer>;
}
