export {
  hasBrowserAvailable,
  isPlaywrightInstalled,
  isSystemChromeInstalled,
} from './detection.js';
export {
  type BrowserServerConfig,
  ensureDevBrowserServer,
  installPlaywrightChromium,
  isDevBrowserServerReady,
  shutdownDevBrowserServer,
  startDevBrowserServer,
  waitForDevBrowserServer,
} from './server.js';
export type { ServerStartResult } from './server-config.js';
