import type { Express, Request, Response } from 'express';
import type { BrowserPageService } from './browser-page-service.js';
import { respondInternalError } from './browser-runtime-utils.js';
import {
  setupBackgroundPageRoute,
  setupCreatePageRoute,
  setupDeletePageRoute,
  setupFocusPageRoute,
  setupHealthRoute,
  setupListPagesRoute,
  setupOpenExternalRoute,
  setupPageStateRoute,
  setupReleasePageRoute,
  setupScreenshotRoute,
  setupShutdownRoute,
} from './browser-server-page-routes.js';

export interface ServerRoutesContext {
  pageService: BrowserPageService;
  wsEndpoint(): string;
}

export function setupAllRoutes(app: Express, ctx: ServerRoutesContext): void {
  setupHealthRoute(app, ctx);
  setupListPagesRoute(app, ctx);
  setupCreatePageRoute(app, ctx);
  setupOpenExternalRoute(app, ctx);
  setupReleasePageRoute(app, ctx);
  setupDeletePageRoute(app, ctx);
  setupPageStateRoute(app, ctx);
  setupFocusPageRoute(app, ctx);
  setupBackgroundPageRoute(app, ctx);
  setupScreenshotRoute(app, ctx);
  setupNavigationRoutes(app, ctx);
  setupShutdownRoute(app);
}

function setupNavigationRoutes(app: Express, ctx: ServerRoutesContext): void {
  app.post('/pages/:name/navigate', async (req: Request<{ name: string }>, res: Response) => {
    try {
      const name = decodeURIComponent(req.params.name);
      const { url } = req.body as { url: string };
      let valid = false;
      if (typeof url === 'string') {
        try {
          new URL(url);
          valid = true;
        } catch {}
      }
      if (!valid) {
        res.status(400).json({ error: 'invalid url' });
        return;
      }
      const state = await ctx.pageService.navigatePage(name, url);
      if (!state) {
        res.status(404).json({ error: 'page not found' });
        return;
      }
      res.json(state);
    } catch (error) {
      respondInternalError(res, error);
    }
  });

  app.post('/pages/:name/back', async (req: Request<{ name: string }>, res: Response) => {
    try {
      const name = decodeURIComponent(req.params.name);
      const state = await ctx.pageService.goBack(name);
      if (!state) {
        res.status(404).json({ error: 'page not found' });
        return;
      }
      res.json(state);
    } catch (error) {
      respondInternalError(res, error);
    }
  });

  app.post('/pages/:name/forward', async (req: Request<{ name: string }>, res: Response) => {
    try {
      const name = decodeURIComponent(req.params.name);
      const state = await ctx.pageService.goForward(name);
      if (!state) {
        res.status(404).json({ error: 'page not found' });
        return;
      }
      res.json(state);
    } catch (error) {
      respondInternalError(res, error);
    }
  });

  app.post('/pages/:name/reload', async (req: Request<{ name: string }>, res: Response) => {
    try {
      const name = decodeURIComponent(req.params.name);
      const state = await ctx.pageService.reloadPage(name);
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
