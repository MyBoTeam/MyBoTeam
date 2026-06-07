import type { BrowserContext } from 'playwright';

export interface ServeOptions {
  port?: number;
  headless?: boolean;
  cdpPort?: number;
  profileDir?: string;
  useSystemChrome?: boolean;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export type PageLaunchIntent = 'background-normal' | 'browser-tool-open' | 'foreground';

export interface GetPageRequest {
  name: string;
  viewport?: ViewportSize;
  initialUrl?: string;
  launchIntent?: PageLaunchIntent;
  keepForegroundUntilFirstFrame?: boolean;
}

export interface GetPageResponse {
  wsEndpoint: string;
  name: string;
  targetId: string;
  created: boolean;
}

export interface ListPagesResponse {
  pages: string[];
}

export interface ServerInfoResponse {
  wsEndpoint: string;
  browserReady: boolean;
}

export interface PageStateResponse {
  name: string;
  targetId: string;
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface DevBrowserServer {
  wsEndpoint: string;
  port: number;
  stop: () => Promise<void>;
}

export interface BrowserPageServiceOptions {
  headless: boolean;
  ensureBrowserContext: () => Promise<BrowserContext>;
  withPreservedForeground: <T>(operation: () => Promise<T>) => Promise<T>;
}

export interface EnsuredPage {
  name: string;
  targetId: string;
  created: boolean;
}
