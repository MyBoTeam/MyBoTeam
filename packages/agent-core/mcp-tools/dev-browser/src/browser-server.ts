import { mkdirSync } from 'node:fs';
import type { Socket } from 'node:net';
import { join } from 'node:path';
import express from 'express';
import { type BrowserContext, chromium } from 'playwright';
import { BrowserPageService } from './browser-page-service.js';
import { fetchWithRetry } from './browser-runtime-utils.js';
import { setupAllRoutes } from './browser-server-routes.js';
import { withPreservedForeground } from './foreground-application.js';
import type { DevBrowserServer, ServeOptions } from './types.js';

export class BrowserServer {
  private _wsEndpoint = '';
  private _browserContext: BrowserContext | null = null;
  private _launchPromise: Promise<BrowserContext> | null = null;
  private readonly app = express();
  private readonly pageService: BrowserPageService;
  private readonly connections = new Set<Socket>();
  private cleaningUp = false;
  private readonly headless: boolean;
  private readonly cdpPort: number;
  private readonly useSystemChrome: boolean;
  private readonly baseProfileDir: string;

  constructor(options: ServeOptions) {
    this.headless = options.headless ?? false;
    this.cdpPort = options.cdpPort ?? parseInt(process.env.DEV_BROWSER_CDP_PORT || '9225', 10);
    this.useSystemChrome = options.useSystemChrome ?? true;
    const profileDir = options.profileDir ?? process.env.DEV_BROWSER_PROFILE;
    this.baseProfileDir = profileDir ?? join(process.cwd(), '.browser-data');

    this.pageService = new BrowserPageService({
      headless: this.headless,
      ensureBrowserContext: () => this.ensureBrowserContext(),
      withPreservedForeground,
    });

    this.app.use(express.json());
    setupAllRoutes(this.app, {
      pageService: this.pageService,
      wsEndpoint: () => this._wsEndpoint,
      browserReady: () => !!this._browserContext,
    });
  }

  private async launchBrowserContext(): Promise<BrowserContext> {
    let browserContext: BrowserContext;
    let usedSystemChrome = false;

    try {
      if (this.useSystemChrome) {
        try {
          console.log('Trying to use system Chrome...');
          const chromeUserDataDir = join(this.baseProfileDir, 'chrome-profile');
          mkdirSync(chromeUserDataDir, { recursive: true });
          browserContext = await chromium.launchPersistentContext(chromeUserDataDir, {
            headless: this.headless,
            channel: 'chrome',
            ignoreDefaultArgs: ['--enable-automation'],
            args: [
              `--remote-debugging-port=${this.cdpPort}`,
              '--remote-debugging-address=127.0.0.1',
              '--disable-blink-features=AutomationControlled',
            ],
          });
          usedSystemChrome = true;
          console.log('Using system Chrome');
        } catch {
          console.log('System Chrome not available, falling back to Playwright Chromium...');
        }
      }

      if (!usedSystemChrome) {
        const playwrightUserDataDir = join(this.baseProfileDir, 'playwright-profile');
        mkdirSync(playwrightUserDataDir, { recursive: true });
        browserContext = await chromium.launchPersistentContext(playwrightUserDataDir, {
          headless: this.headless,
          ignoreDefaultArgs: ['--enable-automation'],
          args: [
            `--remote-debugging-port=${this.cdpPort}`,
            '--remote-debugging-address=127.0.0.1',
            '--disable-blink-features=AutomationControlled',
          ],
        });
      }

      const cdpResponse = await fetchWithRetry(`http://127.0.0.1:${this.cdpPort}/json/version`);
      const cdpInfo = (await cdpResponse.json()) as { webSocketDebuggerUrl: string };
      this._wsEndpoint = cdpInfo.webSocketDebuggerUrl.replace(
        /^(wss?:\/\/)localhost(:\d+)/,
        '$1127.0.0.1$2',
      );
      console.log(`CDP WebSocket endpoint: ${this._wsEndpoint}`);

      this._browserContext = browserContext!;

      const startupPages = browserContext?.pages();
      const blankStartup = startupPages.find((p) => p.url() === 'about:blank') ?? null;
      if (blankStartup) {
        this.pageService.attachStartupPage(blankStartup);
        void this.pageService.backgroundPage(blankStartup, browserContext!).catch(() => {});
      }

      browserContext?.on('close', () => {
        console.log('Browser context closed.');
        this._launchPromise = null;
        this._browserContext = null;
        this._wsEndpoint = '';
      });

      return browserContext!;
    } catch (error) {
      this._launchPromise = null;
      this._browserContext = null;
      this._wsEndpoint = '';
      throw error;
    }
  }

  private ensureBrowserContext(): Promise<BrowserContext> {
    if (!this._launchPromise) {
      this._launchPromise = this.launchBrowserContext();
    }
    return this._launchPromise;
  }

  async cleanup(): Promise<void> {
    if (this.cleaningUp) return;
    this.cleaningUp = true;
    console.log('\nShutting down...');
    for (const socket of this.connections) {
      socket.destroy();
    }
    this.connections.clear();
    await this.pageService.closeAllPages();
    if (this._browserContext) {
      try {
        await this._browserContext.close();
      } catch {}
    }
    console.log('Server stopped.');
  }

  async serve(port: number): Promise<DevBrowserServer> {
    const server = this.app.listen(port, '127.0.0.1', () => {
      console.log(`dev-browser HTTP server running on port ${port}`);
    });

    server.on('connection', (socket: Socket) => {
      this.connections.add(socket);
      socket.on('close', () => this.connections.delete(socket));
    });

    const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const;
    const signalHandler = async () => {
      await this.cleanup();
      process.exit(0);
    };
    const errorHandler = async (err: unknown) => {
      console.error('Unhandled error:', err);
      await this.cleanup();
      process.exit(1);
    };

    signals.forEach((sig) => process.on(sig, signalHandler));
    process.on('uncaughtException', errorHandler);
    process.on('unhandledRejection', errorHandler);
    process.on('exit', () => {
      if (this._browserContext) {
        try {
          this._browserContext.close();
        } catch {}
      }
    });

    const removeHandlers = () => {
      signals.forEach((sig) => process.off(sig, signalHandler));
      process.off('uncaughtException', errorHandler);
      process.off('unhandledRejection', errorHandler);
    };

    return {
      get wsEndpoint() {
        return this._wsEndpoint;
      },
      port,
      async stop() {
        removeHandlers();
        await this.cleanup();
      },
    };
  }
}
