import { BrowserServer } from './browser-server.js';
import type {
  DevBrowserServer,
  GetPageResponse,
  ListPagesResponse,
  ServeOptions,
  ServerInfoResponse,
} from './types.js';

export type {
  DevBrowserServer,
  GetPageResponse,
  ListPagesResponse,
  ServeOptions,
  ServerInfoResponse,
};

export async function serve(options: ServeOptions = {}): Promise<DevBrowserServer> {
  const port = options.port ?? parseInt(process.env.DEV_BROWSER_PORT || '9224', 10);
  const server = new BrowserServer(options);
  return server.serve(port);
}
