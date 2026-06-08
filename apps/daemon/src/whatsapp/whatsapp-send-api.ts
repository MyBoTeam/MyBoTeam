import type http from 'node:http';
import { createHttpServer } from '../http-server-factory.js';
import { RateLimiter } from '../rate-limiter.js';
import type { WhatsAppDaemonService } from '../whatsapp-service.js';
import {
  buildChatsRoute,
  buildGroupInfoRoute,
  buildGroupsRoute,
  buildLogoutRoute,
  buildMarkReadRoute,
  buildMediaRoute,
  buildMessagesRoute,
  buildSendPollRoute,
  buildSendReactionRoute,
  buildSendRoute,
  buildSendTypingRoute,
  buildStatusRoute,
} from './whatsapp-api-routes.js';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;

export class WhatsAppSendApi {
  private whatsappService: WhatsAppDaemonService;
  private authToken: string;
  private server: http.Server | null = null;
  private port: number | null = null;
  private rateLimiter = new RateLimiter(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS);

  constructor(whatsappService: WhatsAppDaemonService, authToken: string) {
    this.whatsappService = whatsappService;
    this.authToken = authToken;
  }

  async start(fixedPort?: number): Promise<void> {
    const { server, port } = await createHttpServer({
      authToken: this.authToken,
      rateLimiter: this.rateLimiter,
      serviceName: 'WhatsAppSendApi',
      port: fixedPort,
      routes: [
        buildSendRoute(this.whatsappService),
        buildSendReactionRoute(this.whatsappService),
        buildSendPollRoute(this.whatsappService),
        buildSendTypingRoute(this.whatsappService),
        buildChatsRoute(this.whatsappService),
        buildMessagesRoute(this.whatsappService),
        buildGroupsRoute(this.whatsappService),
        buildGroupInfoRoute(this.whatsappService),
        buildMediaRoute(this.whatsappService),
        buildMarkReadRoute(this.whatsappService),
        buildStatusRoute(this.whatsappService),
        buildLogoutRoute(this.whatsappService),
      ],
    });

    this.server = server;
    this.port = port;
  }

  getPort(): number | null {
    return this.port;
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
      this.port = null;
    }
  }
}
