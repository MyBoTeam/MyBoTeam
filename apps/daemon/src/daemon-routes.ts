import type { DaemonRpcServer, MyboteamRuntime } from '@myboteam/agent-core';
import type { ConnectorService } from './connector-service.js';
import type { GoogleAccountService } from './google-account-service.js';
import type { HealthService } from './health.js';
import type { OpenAiOauthManager } from './opencode/auth-openai.js';
import type { SchedulerService } from './scheduler-service.js';
import type { SecretsService } from './secrets-service.js';
import type { SettingsService } from './settings-service.js';
import type { SkillsService } from './skills-service.js';
import type { StorageService } from './storage-service.js';
import type { TaskService } from './task-service.js';
import type { WhatsAppDaemonService } from './whatsapp-service.js';
import type { WorkspaceService } from './workspace-service.js';

export { safeHandler } from './daemon-routes-middleware.js';

export interface RouteServices {
  rpc: DaemonRpcServer;
  taskService: TaskService;
  healthService: HealthService;
  storageService: StorageService;
  schedulerService: SchedulerService;
  myboteamRuntime: MyboteamRuntime;
  whatsappService: WhatsAppDaemonService;
  openAiOauthManager: OpenAiOauthManager;
  secretsService: SecretsService;
  settingsService: SettingsService;
  workspaceService: WorkspaceService;
  connectorService: ConnectorService;
  googleAccountService: GoogleAccountService;
  skillsService: SkillsService;
}

import { registerGoogleRoutes } from './daemon-routes-google.js';
import { registerMcpRoutes } from './daemon-routes-mcp.js';
import { registerMiscRoutes } from './daemon-routes-misc.js';
import { registerModelConfigRoutes } from './daemon-routes-modelconfig.js';
import { registerProviderRoutes } from './daemon-routes-provider.js';
import { registerSettingsRoutes } from './daemon-routes-settings.js';
import { registerTaskRoutes } from './daemon-routes-tasks.js';
import { registerWhatsAppRoutes } from './daemon-routes-whatsapp.js';
import { registerWorkspaceRoutes } from './daemon-routes-workspace.js';

export function registerRpcMethods(services: RouteServices): void {
  registerTaskRoutes(services);
  registerSettingsRoutes(services);
  registerModelConfigRoutes(services);
  registerProviderRoutes(services);
  registerWhatsAppRoutes(services);
  registerGoogleRoutes(services);
  registerMcpRoutes(services);
  registerWorkspaceRoutes(services);
  registerMiscRoutes(services);
}
