import type { Page } from 'playwright';
import { navigatePageToUrl } from './browser-page-navigator.js';
import { withTimeout } from './browser-runtime-utils.js';

export async function navigateEntryPage(name: string, page: Page, url: string): Promise<void> {
  await navigatePageToUrl(name, page, url);
}

export async function goBackInPage(page: Page): Promise<void> {
  await page.goBack();
}

export async function goForwardInPage(page: Page): Promise<void> {
  await page.goForward();
}

export async function reloadPage(page: Page): Promise<void> {
  await withTimeout(page.reload(), 30000, `Reload timed out`);
}
