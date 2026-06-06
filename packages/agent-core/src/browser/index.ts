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
  type ServerStartResult,
  shutdownDevBrowserServer,
  startDevBrowserServer,
  waitForDevBrowserServer,
} from './server.js';
