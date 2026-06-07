import type { BrowserContext, Page } from 'playwright';
import type { CreatedTaskPage } from './browser-page-service-state.js';
import { isClosedPageError, withTimeout } from './browser-runtime-utils.js';
import { type CreateTaskPageResult, createTaskPage } from './browser-task-page-creation.js';
import type {
  BrowserTaskPageFactoryOptions,
  CreateTaskPageParams,
} from './browser-task-page-types.js';
import { isReusableStartupPageUrl } from './navigation-url.js';

export class BrowserTaskPageFactory {
  private reusableStartupPage: Page | null = null;
  private readonly startupCloseHandlers = new WeakMap<Page, () => void>();

  constructor(private readonly options: BrowserTaskPageFactoryOptions) {}

  attachStartupPage(page: Page | null): void {
    if (page && isReusableStartupPageUrl(page.url())) {
      const prevHandler = this.startupCloseHandlers.get(page);
      if (prevHandler) {
        page.off('close', prevHandler);
      }
      this.reusableStartupPage = page;
      const closeHandler = () => {
        if (this.reusableStartupPage === page) {
          this.reusableStartupPage = null;
        }
        this.startupCloseHandlers.delete(page);
      };
      this.startupCloseHandlers.set(page, closeHandler);
      page.once('close', closeHandler);
      return;
    }
    this.reusableStartupPage = null;
  }

  async acquirePageForExternalOpen(browserContext: BrowserContext): Promise<Page> {
    const reusableStartupPage = this.takeReusableStartupPage();
    if (reusableStartupPage) {
      return reusableStartupPage;
    }
    return withTimeout(browserContext.newPage(), 30000, 'Page creation timed out after 30s');
  }

  reset(): void {
    this.reusableStartupPage = null;
  }

  async closeReusableStartupPage(): Promise<void> {
    const page = this.takeReusableStartupPage();
    if (!page) {
      return;
    }
    try {
      await page.close();
    } catch {
      // Ignore errors when closing the reusable startup page
    }
  }

  private takeReusableStartupPage(): Page | null {
    if (!this.reusableStartupPage || this.reusableStartupPage.isClosed()) {
      this.reusableStartupPage = null;
      return null;
    }
    const startupPage = this.reusableStartupPage;
    this.reusableStartupPage = null;
    return startupPage;
  }

  async createTaskPage(params: CreateTaskPageParams): Promise<CreatedTaskPage> {
    const result: CreateTaskPageResult = await createTaskPage(
      params,
      this.reusableStartupPage,
      this.options,
    );
    if (result.consumedStartupPage) {
      this.reusableStartupPage = null;
    } else {
      this.clearUnavailableReusableStartupPage(params.activeTaskPageCount);
    }

    // For background-normal mode, ensure the OS window stays minimized after page creation.
    // Fire-and-forget: window management must NOT block page registration.
    if (params.launchMode === 'background-normal' && !this.options.headless) {
      void this.options.windowController
        .backgroundPage(result.createdPage.page, params.browserContext)
        .catch(() => {});
    }

    return result.createdPage;
  }

  async recycleOrClosePage(page: Page): Promise<void> {
    if (page.isClosed()) {
      return;
    }
    const pageContext = page.context();
    if (!(await this.isLastOpenPage(page, pageContext))) {
      await page.close();
      return;
    }
    try {
      await this.prepareReusableStartupPage(page, pageContext);
    } catch (error) {
      if (!isClosedPageError(error)) {
        await page.close().catch(() => {});
      }
    }
  }

  private clearUnavailableReusableStartupPage(activeTaskPageCount: number): void {
    if (!this.reusableStartupPage) {
      return;
    }
    if (this.reusableStartupPage.isClosed() || activeTaskPageCount > 0) {
      this.reusableStartupPage = null;
    }
  }

  private async prepareReusableStartupPage(
    page: Page,
    browserContext?: BrowserContext,
  ): Promise<void> {
    if (page.isClosed()) {
      if (this.reusableStartupPage === page) {
        this.reusableStartupPage = null;
      }
      return;
    }
    if (!isReusableStartupPageUrl(page.url())) {
      await withTimeout(
        page.goto('about:blank'),
        30000,
        'Navigation timed out while preparing reusable startup page',
      );
    }
    this.attachStartupPage(page);
    await this.options.windowController.backgroundPage(page, browserContext);
  }

  private async isLastOpenPage(page: Page, browserContext: BrowserContext): Promise<boolean> {
    const openPages = browserContext.pages().filter((candidate) => !candidate.isClosed());
    return openPages.length === 1 && openPages[0] === page;
  }
}
