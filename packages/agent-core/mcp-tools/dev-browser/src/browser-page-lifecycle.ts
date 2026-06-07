import {
  attachPageCloseHandler,
  detachReleasedEntry,
  finishCreatedPageNavigation,
  finishCreatedPageSetup,
  rememberReleasedUrl,
} from './browser-page-lifecycle-utils.js';
import {
  createPageEntry,
  type PageEntry,
  resolveRequestedLaunchIntent,
  shouldLaunchMinimizedOnce,
  type TaskPageLaunchMode,
} from './browser-page-service-state.js';
import { isClosedPageError, withTimeout } from './browser-runtime-utils.js';
import { BrowserScreencastController } from './browser-screencast-controller.js';
import { BrowserTaskPageFactory } from './browser-task-page-factory.js';
import { BrowserWindowController } from './browser-window-controller.js';
import { isHttpNavigationUrl } from './navigation-url.js';
import type {
  BrowserPageServiceOptions,
  EnsuredPage,
  GetPageRequest,
  PageLaunchIntent,
  ViewportSize,
} from './types.js';

export class PageLifecycleManager {
  readonly registry = new Map<string, PageEntry>();
  readonly releasedPageUrls = new Map<string, string>();
  readonly knownTaskPages = new Set<string>();
  readonly closeHandlers = new WeakMap<any, () => void>();
  readonly screencastController = new BrowserScreencastController();
  readonly pageFactory: BrowserTaskPageFactory;
  readonly windowController: BrowserWindowController;
  private readonly pendingCreations = new Map<string, Promise<EnsuredPage>>();
  constructor(private readonly options: BrowserPageServiceOptions) {
    this.windowController = new BrowserWindowController(options);
    this.pageFactory = new BrowserTaskPageFactory({
      ensureBrowserContext: options.ensureBrowserContext,
      headless: options.headless,
      withPreservedForeground: options.withPreservedForeground,
      windowController: this.windowController,
    });
  }
  async ensurePage(body: GetPageRequest): Promise<EnsuredPage> {
    const { name, viewport, initialUrl, keepForegroundUntilFirstFrame, launchIntent } = body;
    const existingEntry = this.registry.get(name);
    if (existingEntry) return { name, targetId: existingEntry.targetId, created: false };
    if (this.pendingCreations.has(name)) {
      return { name, targetId: (await this.pendingCreations.get(name)!).targetId, created: true };
    }
    const creationPromise: Promise<EnsuredPage> = this.createAndRegisterPageEntry({
      initialUrl,
      keepForegroundUntilFirstFrame,
      launchIntent,
      name,
      viewport,
    }).then((createdEntry) => ({ name, targetId: createdEntry.targetId, created: true }));
    this.pendingCreations.set(name, creationPromise);
    try {
      return await creationPromise;
    } finally {
      this.pendingCreations.delete(name);
    }
  }
  async deletePage(name: string): Promise<boolean> {
    const entry = this.registry.get(name);
    this.releasedPageUrls.delete(name);
    if (!entry) return false;
    await this.screencastController.stop(entry);
    try {
      await entry.page.close();
    } catch {}
    this.registry.delete(name);
    return true;
  }
  async releasePage(name: string): Promise<boolean> {
    const entry = this.registry.get(name);
    if (!entry) return false;
    rememberReleasedUrl(name, entry, this.releasedPageUrls);
    await detachReleasedEntry(
      name,
      entry,
      this.registry,
      this.closeHandlers,
      this.screencastController,
    );
    await this.pageFactory.recycleOrClosePage(entry.page);
    return true;
  }
  async openExternalPage(url: string): Promise<void> {
    if (!isHttpNavigationUrl(url)) throw new Error('url must use http or https');
    const activeContext = await this.options.ensureBrowserContext();
    const page = await this.pageFactory.acquirePageForExternalOpen(activeContext);
    try {
      const targetId = await this.windowController.getTargetId(page, activeContext);
      await this.windowController.focusPreparedPage(
        page,
        targetId,
        activeContext,
        `Focus timed out for external page: ${url}`,
      );
      await withTimeout(page.goto(url), 30000, `Navigation timed out for external page: ${url}`);
    } catch (error) {
      if (isClosedPageError(error)) return;
      await page.close().catch(() => {});
      throw error;
    }
  }
  async closeAllPages(): Promise<void> {
    for (const entry of this.registry.values()) {
      try {
        await entry.page.close();
      } catch {}
    }
    this.registry.clear();
    this.knownTaskPages.clear();
    this.releasedPageUrls.clear();
    try {
      await this.pageFactory.closeReusableStartupPage();
    } catch {}
    this.pageFactory.reset();
  }
  private async createAndRegisterPageEntry(options: {
    initialUrl?: string;
    keepForegroundUntilFirstFrame?: boolean;
    launchIntent?: PageLaunchIntent;
    name: string;
    viewport?: ViewportSize;
  }): Promise<PageEntry> {
    const initialUrl = options.initialUrl;
    const launchIntent = options.launchIntent;
    const requestedLaunchIntent = resolveRequestedLaunchIntent(
      launchIntent,
      options.keepForegroundUntilFirstFrame,
      this.options.headless,
    );
    const launchMode: TaskPageLaunchMode =
      requestedLaunchIntent === 'foreground'
        ? 'foreground'
        : shouldLaunchMinimizedOnce({
              launchIntent: requestedLaunchIntent,
              hasReleasedPageUrl: this.releasedPageUrls.has(options.name),
              hasKnownTaskPage: this.knownTaskPages.has(options.name),
            })
          ? 'minimized-once'
          : 'background-normal';
    const restoreUrl = initialUrl
      ? initialUrl
      : launchIntent === 'browser-tool-open'
        ? this.releasedPageUrls.get(options.name)
        : undefined;
    const browserContext = await this.options.ensureBrowserContext();
    const createdPage = await this.pageFactory.createTaskPage({
      activeTaskPageCount: this.registry.size,
      browserContext,
      initialUrl: restoreUrl,
      name: options.name,
      launchMode,
      viewport: options.viewport,
    });
    await finishCreatedPageSetup(createdPage, options.viewport);
    if (launchMode === 'background-normal' && !this.options.headless) {
      void this.windowController.backgroundPage(createdPage.page, browserContext).catch(() => {});
    }
    const entry = createPageEntry(createdPage);
    try {
      await finishCreatedPageNavigation(options.name, entry, restoreUrl, createdPage);
    } catch (error) {
      try {
        await entry.page.close();
      } catch {}
      throw error;
    }
    this.registry.set(options.name, entry);
    this.knownTaskPages.add(options.name);
    attachPageCloseHandler(
      options.name,
      entry,
      this.registry,
      this.closeHandlers,
      this.screencastController,
    );
    this.releasedPageUrls.delete(options.name);
    return entry;
  }
}
