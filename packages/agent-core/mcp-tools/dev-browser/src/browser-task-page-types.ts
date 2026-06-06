import type { BrowserContext } from 'playwright';
import type { TaskPageLaunchMode } from './browser-page-service-state.js';
import type { BrowserWindowController } from './browser-window-controller.js';
import type { ViewportSize } from './types.js';

export interface BrowserTaskPageFactoryOptions {
  headless: boolean;
  ensureBrowserContext: () => Promise<BrowserContext>;
  withPreservedForeground: <T>(operation: () => Promise<T>) => Promise<T>;
  windowController: BrowserWindowController;
}

export interface CreateTaskPageParams {
  activeTaskPageCount: number;
  browserContext: BrowserContext;
  initialUrl?: string;
  launchMode: TaskPageLaunchMode;
  name: string;
  viewport?: ViewportSize;
}
