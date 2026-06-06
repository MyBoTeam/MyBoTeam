import type { BrowserContext, Page } from 'playwright';
import {
  backgroundPageWithController,
  focusPageWithController,
} from './browser-page-interaction.js';
import { PageLifecycleManager } from './browser-page-lifecycle.js';
import {
  goBackInPage,
  goForwardInPage,
  navigateEntryPage,
  reloadPage,
} from './browser-page-navigation.js';
import { BrowserPageStateReader } from './browser-page-state-reader.js';
import { isClosedPageError } from './browser-runtime-utils.js';
import type {
  BrowserPageServiceOptions,
  EnsuredPage,
  GetPageRequest,
  PageStateResponse,
} from './types.js';

export type { EnsuredPage };

export class BrowserPageService {
  private readonly lifecycle = new PageLifecycleManager(this.options);
  private readonly pageStateReader = new BrowserPageStateReader({
    ensureBrowserContext: this.options.ensureBrowserContext,
  });

  constructor(private readonly options: BrowserPageServiceOptions) {}

  private get registry() {
    return this.lifecycle.registry;
  }

  listPageNames(): string[] {
    return Array.from(this.registry.keys());
  }

  hasPage(name: string): boolean {
    return this.registry.has(name);
  }

  ensurePage(body: GetPageRequest): Promise<EnsuredPage> {
    return this.lifecycle.ensurePage(body);
  }

  deletePage(name: string): Promise<boolean> {
    return this.lifecycle.deletePage(name);
  }

  releasePage(name: string): Promise<boolean> {
    return this.lifecycle.releasePage(name);
  }

  openExternalPage(url: string): Promise<void> {
    return this.lifecycle.openExternalPage(url);
  }

  closeAllPages(): Promise<void> {
    return this.lifecycle.closeAllPages();
  }

  async readPageState(name: string): Promise<PageStateResponse | null> {
    const entry = this.registry.get(name);
    if (!entry) return null;
    return this.getPageState(name, entry);
  }

  async navigatePage(name: string, url: string): Promise<PageStateResponse | null> {
    return this.runPageOperation(name, async (entry) => {
      await navigateEntryPage(name, entry.page, url);
    });
  }

  async goBack(name: string): Promise<PageStateResponse | null> {
    return this.runPageOperation(name, async (entry) => {
      await goBackInPage(entry.page);
    });
  }

  async goForward(name: string): Promise<PageStateResponse | null> {
    return this.runPageOperation(name, async (entry) => {
      await goForwardInPage(entry.page);
    });
  }

  async reloadPage(name: string): Promise<PageStateResponse | null> {
    return this.runPageOperation(name, async (entry) => {
      await reloadPage(entry.page);
    });
  }

  async focusPage(name: string): Promise<PageStateResponse | null> {
    const entry = this.registry.get(name);
    if (!entry) return null;
    try {
      const pageContext = entry.page.context();
      await focusPageWithController(
        entry.page,
        entry.targetId,
        pageContext,
        this.lifecycle.windowController,
        name,
      );
      entry.windowState = 'normal';
    } catch (error) {
      if (isClosedPageError(error)) {
        this.deleteStaleEntry(name, entry);
        return null;
      }
      throw error;
    }
    return this.getPageState(name, entry);
  }

  async capturePageScreenshot(name: string, quality: number): Promise<Buffer | null> {
    const entry = this.registry.get(name);
    if (!entry) return null;
    try {
      return await this.lifecycle.screencastController.captureScreenshot(entry, quality);
    } catch (error) {
      if (isClosedPageError(error)) {
        this.deleteStaleEntry(name, entry);
        return null;
      }
      throw error;
    }
  }

  async backgroundPageByName(name: string): Promise<PageStateResponse | null> {
    const entry = this.registry.get(name);
    if (!entry) return null;
    try {
      const ctx = entry.page.context();
      await backgroundPageWithController(entry.page, ctx, this.lifecycle.windowController);
      entry.windowState = 'minimized';
    } catch (error) {
      if (isClosedPageError(error)) {
        this.deleteStaleEntry(name, entry);
        return null;
      }
      throw error;
    }
    return this.getPageState(name, entry);
  }

  attachStartupPage(page: Page | null): void {
    this.lifecycle.pageFactory.attachStartupPage(page);
  }

  async backgroundPage(page: Page, browserContext?: BrowserContext): Promise<void> {
    await this.lifecycle.windowController.backgroundPage(page, browserContext);
  }

  async backgroundStartupPage(page: Page): Promise<void> {
    const ctx = page.context();
    await this.lifecycle.windowController.backgroundPage(page, ctx);
  }

  private async runPageOperation(
    name: string,
    operation: (entry: any) => Promise<void>,
  ): Promise<PageStateResponse | null> {
    const entry = this.registry.get(name);
    if (!entry) return null;
    try {
      await operation(entry);
    } catch (error) {
      if (isClosedPageError(error)) {
        this.deleteStaleEntry(name, entry);
        return null;
      }
      throw error;
    }
    return this.getPageState(name, entry);
  }

  private deleteStaleEntry(name: string, entry: any): void {
    if (this.registry.get(name) === entry) {
      void this.lifecycle.screencastController.stop(entry);
      this.registry.delete(name);
    }
  }

  private async getPageState(name: string, entry: any): Promise<PageStateResponse | null> {
    const { page } = entry;
    try {
      if (page.isClosed()) {
        this.deleteStaleEntry(name, entry);
        return null;
      }
      return await this.pageStateReader.readPageState(name, entry);
    } catch (error) {
      if (isClosedPageError(error)) {
        this.deleteStaleEntry(name, entry);
        return null;
      }
      throw error;
    }
  }
}
