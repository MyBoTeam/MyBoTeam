import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildHtml, type CallbackSettings, readLocaleStrings } from './oauth-callback-html';

export type { CallbackSettings } from './oauth-callback-html';

interface OAuthCallbackResult {
  code: string;
  state: string;
  redirectUri: string;
}

export interface OAuthCallbackServer {
  redirectUri: string;
  waitForCallback: () => Promise<OAuthCallbackResult>;
  shutdown: () => void;
}

export interface OAuthCallbackServerOptions {
  host?: string;
  port?: number;
  callbackPath?: string;
  timeoutMs?: number;
  settingsProvider?: () => Promise<CallbackSettings>;
}

const CALLBACK_TIMEOUT_MS = 60_000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function closeServer(server: http.Server): void {
  server.closeAllConnections();
  server.close();
}

export async function createOAuthCallbackServer(
  options: OAuthCallbackServerOptions = {},
): Promise<OAuthCallbackServer> {
  const host = options.host ?? '127.0.0.1';
  const port = options.port ?? 0;
  const callbackPath = options.callbackPath ?? '/callback';
  const timeoutMs = options.timeoutMs ?? CALLBACK_TIMEOUT_MS;
  let resolveCallback: (value: OAuthCallbackResult) => void;
  let rejectCallback: (reason: Error) => void;
  let settled = false;

  const callbackPromise = new Promise<OAuthCallbackResult>((resolve, reject) => {
    resolveCallback = resolve;
    rejectCallback = reject;
  });

  const server = http.createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(400);
      res.end();
      return;
    }

    if (req.url === '/robot.png') {
      const candidates: string[] = [path.resolve(__dirname, '../../assets/robot-callback.png')];
      if (process.resourcesPath) {
        candidates.push(path.join(process.resourcesPath, 'assets', 'robot-callback.png'));
      }
      let image: Buffer | null = null;
      for (const c of candidates) {
        try {
          image = fs.readFileSync(c);
          break;
        } catch {
          // try next candidate
        }
      }
      if (image) {
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000',
        });
        res.end(image);
      } else {
        res.writeHead(404);
        res.end();
      }
      return;
    }

    if (!req.url.startsWith(callbackPath)) {
      res.writeHead(404);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://${host}`);
    const code = parsedUrl.searchParams.get('code');
    const state = parsedUrl.searchParams.get('state');
    const error = parsedUrl.searchParams.get('error');
    const errorDescription = parsedUrl.searchParams.get('error_description');

    let settings: CallbackSettings = { theme: 'light', themeColor: 'neutral', language: 'en' };
    if (options.settingsProvider) {
      try {
        settings = await options.settingsProvider();
      } catch {
        // use defaults on failure
      }
    }

    const isDark = settings.theme === 'dark';

    if (error) {
      const message = errorDescription ?? error;
      const html = buildHtml({
        title: readLocaleStrings(settings.language).errorTitle,
        message,
        isError: true,
        isDark,
        themeColor: settings.themeColor,
      });
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(html, () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          closeServer(server);
          rejectCallback(new Error(message));
        }
      });
      return;
    }

    if (!code || !state) {
      const html = buildHtml({
        title: readLocaleStrings(settings.language).errorTitle,
        message: readLocaleStrings(settings.language).errorMessage,
        isError: true,
        isDark,
        themeColor: settings.themeColor,
      });
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(html, () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          closeServer(server);
          rejectCallback(new Error('Missing code or state parameter'));
        }
      });
      return;
    }

    const html = buildHtml({
      title: readLocaleStrings(settings.language).successTitle,
      message: readLocaleStrings(settings.language).successMessage,
      isError: false,
      isDark,
      themeColor: settings.themeColor,
      autoClose: true,
    });
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html, () => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        closeServer(server);
        resolveCallback({ code, state, redirectUri });
      }
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(port, host, () => resolve());
    server.on('error', reject);
  });

  const boundPort = (server.address() as { port: number }).port;
  const redirectUri = `http://${host}:${boundPort}${callbackPath}`;

  const timeout = setTimeout(() => {
    if (!settled) {
      settled = true;
      closeServer(server);
      rejectCallback(new Error('OAuth callback timed out'));
    }
  }, timeoutMs);

  return {
    redirectUri,
    waitForCallback: () => callbackPromise,
    shutdown: () => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        closeServer(server);
        rejectCallback(new Error('OAuth callback server shut down'));
      }
    },
  };
}
