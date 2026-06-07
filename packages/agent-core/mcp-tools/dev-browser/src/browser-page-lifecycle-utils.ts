import type { Page } from 'playwright';
import { navigatePageToUrl } from './browser-page-navigator.js';
import type { CreatedTaskPage, PageEntry } from './browser-page-service-state.js';
import { isClosedPageError } from './browser-runtime-utils.js';
import { isHttpNavigationUrl } from './navigation-url.js';
import type { ViewportSize } from './types.js';

export async function finishCreatedPageSetup(
  createdPage: CreatedTaskPage,
  viewport: ViewportSize | undefined,
): Promise<void> {
  if (!viewport || createdPage.navigatedDuringCreate) return;
  await createdPage.page.setViewportSize(viewport);
}

export async function finishCreatedPageNavigation(
  name: string,
  entry: PageEntry,
  restoreUrl: string | undefined,
  createdPage: CreatedTaskPage,
): Promise<void> {
  if (!restoreUrl || createdPage.navigatedDuringCreate) return;
  try {
    await navigatePageToUrl(name, entry.page, restoreUrl);
  } catch (error) {
    if (isClosedPageError(error)) throw new Error('page not found');
    throw error;
  }
}

export function attachPageCloseHandler(
  name: string,
  entry: PageEntry,
  registry: Map<string, PageEntry>,
  closeHandlers: WeakMap<Page, () => void>,
  screencastController: { stop(entry: PageEntry): Promise<void> },
): void {
  const previousHandler = closeHandlers.get(entry.page);
  if (previousHandler) entry.page.off('close', previousHandler);
  const closeHandler = () => {
    if (registry.get(name) === entry) {
      void screencastController.stop(entry);
      registry.delete(name);
    }
  };
  entry.page.on('close', closeHandler);
  closeHandlers.set(entry.page, closeHandler);
}

export function rememberReleasedUrl(
  name: string,
  entry: PageEntry,
  releasedPageUrls: Map<string, string>,
): void {
  const recoverableUrl = isHttpNavigationUrl(entry.page.url()) ? entry.page.url() : null;
  if (recoverableUrl) releasedPageUrls.set(name, recoverableUrl);
  else releasedPageUrls.delete(name);
}

export async function detachReleasedEntry(
  name: string,
  entry: PageEntry,
  registry: Map<string, PageEntry>,
  closeHandlers: WeakMap<Page, () => void>,
  screencastController: { stop(entry: PageEntry): Promise<void> },
): Promise<void> {
  const handler = closeHandlers.get(entry.page);
  if (handler) {
    entry.page.off('close', handler);
    closeHandlers.delete(entry.page);
  }
  await screencastController.stop(entry);
  registry.delete(name);
}
