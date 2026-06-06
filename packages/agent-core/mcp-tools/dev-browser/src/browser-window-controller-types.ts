import type { BrowserContext } from 'playwright';

export interface BrowserWindowControllerOptions {
  headless: boolean;
  ensureBrowserContext: () => Promise<BrowserContext>;
  withPreservedForeground: <T>(operation: () => Promise<T>) => Promise<T>;
}
