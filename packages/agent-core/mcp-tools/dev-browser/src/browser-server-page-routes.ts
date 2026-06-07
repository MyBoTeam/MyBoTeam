import type { Express, Request, Response } from 'express';
import type { BrowserPageService } from './browser-page-service.js';
import { respondInternalError } from './browser-runtime-utils.js';
import type {
  GetPageRequest,
  GetPageResponse,
  ListPagesResponse,
  ServerInfoResponse,
} from './types.js';

export interface PageRouteContext {
  pageService: BrowserPageService;
  wsEndpoint(): string;
}

export function setupHealthRoute(app: Express, ctx: PageRouteContext): void {
  app.get('/', (_req: Request, res: Response) => {
    const response: ServerInfoResponse = {
      wsEndpoint: ctx.wsEndpoint(),
      browserReady: true,
    };
    res.json(response);
  });
}

export function setupListPagesRoute(app: Express, ctx: PageRouteContext): void {
  app.get('/pages', (_req: Request, res: Response) => {
    const response: ListPagesResponse = { pages: ctx.pageService.listPageNames() };
    res.json(response);
  });
}

export function setupCreatePageRoute(app: Express, ctx: PageRouteContext): void {
  app.post('/pages', async (req: Request, res: Response) => {
    try {
      const body = req.body as GetPageRequest;
      if (!body.name || typeof body.name !== 'string') {
        res.status(400).json({ error: 'name is required and must be a string' });
        return;
      }
      const ensured = await ctx.pageService.ensurePage(body);
      const response: GetPageResponse = {
        wsEndpoint: ctx.wsEndpoint(),
        name: ensured.name,
        targetId: ensured.targetId,
        created: ensured.created,
      };
      res.json(response);
    } catch (error) {
      respondInternalError(res, error);
    }
  });
}

export function setupOpenExternalRoute(app: Express, ctx: PageRouteContext): void {
  app.post('/pages/open-external', async (req: Request, res: Response) => {
    try {
      const { url } = req.body as { url: string };
      if (!url) {
        res.status(400).json({ error: 'url is required' });
        return;
      }
      try {
        new URL(url);
      } catch {
        res.status(400).json({ error: 'invalid url' });
        return;
      }
      await ctx.pageService.openExternalPage(url);
      res.json({ success: true });
    } catch (error) {
      respondInternalError(res, error);
    }
  });
}

export function setupReleasePageRoute(app: Express, ctx: PageRouteContext): void {
  app.post('/pages/:name/release', async (req: Request<{ name: string }>, res: Response) => {
    try {
      const name = decodeURIComponent(req.params.name);
      const released = await ctx.pageService.releasePage(name);
      res.json({ success: released });
    } catch (error) {
      respondInternalError(res, error);
    }
  });
}

export function setupDeletePageRoute(app: Express, ctx: PageRouteContext): void {
  app.delete('/pages/:name', async (req: Request<{ name: string }>, res: Response) => {
    try {
      const name = decodeURIComponent(req.params.name);
      const deleted = await ctx.pageService.deletePage(name);
      if (!deleted) {
        res.status(404).json({ error: 'page not found' });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      respondInternalError(res, error);
    }
  });
}

export function setupPageStateRoute(app: Express, ctx: PageRouteContext): void {
  app.get('/pages/:name/state', async (req: Request<{ name: string }>, res: Response) => {
    try {
      const name = decodeURIComponent(req.params.name);
      const state = await ctx.pageService.readPageState(name);
      if (!state) {
        res.status(404).json({ error: 'page not found' });
        return;
      }
      res.json(state);
    } catch (error) {
      respondInternalError(res, error);
    }
  });
}

export function setupFocusPageRoute(app: Express, ctx: PageRouteContext): void {
  app.post('/pages/:name/focus', async (req: Request<{ name: string }>, res: Response) => {
    try {
      const name = decodeURIComponent(req.params.name);
      const state = await ctx.pageService.focusPage(name);
      if (!state) {
        res.status(404).json({ error: 'page not found' });
        return;
      }
      res.json(state);
    } catch (error) {
      respondInternalError(res, error);
    }
  });
}

export function setupBackgroundPageRoute(app: Express, ctx: PageRouteContext): void {
  app.post('/pages/:name/background', async (req: Request<{ name: string }>, res: Response) => {
    try {
      const name = decodeURIComponent(req.params.name);
      const state = await ctx.pageService.backgroundPageByName(name);
      if (!state) {
        res.status(404).json({ error: 'page not found' });
        return;
      }
      res.json(state);
    } catch (error) {
      respondInternalError(res, error);
    }
  });
}

export function setupScreenshotRoute(app: Express, ctx: PageRouteContext): void {
  app.get('/pages/:name/screenshot', async (req: Request<{ name: string }>, res: Response) => {
    try {
      const name = decodeURIComponent(req.params.name);
      const quality = parseInt(String(req.query.quality ?? '70'), 10);
      const buffer = await ctx.pageService.capturePageScreenshot(name, quality);
      if (!buffer) {
        res.status(404).json({ error: 'page not found' });
        return;
      }
      res.setHeader('Content-Type', 'image/jpeg');
      res.send(buffer);
    } catch (error) {
      respondInternalError(res, error);
    }
  });
}

export function setupShutdownRoute(app: Express): void {
  app.post('/shutdown', (_req: Request, res: Response) => {
    res.json({ ok: true });
    process.exit(0);
  });
}
