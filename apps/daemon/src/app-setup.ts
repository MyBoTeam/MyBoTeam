import { DaemonRpcServer, type MyboteamRuntime, WHATSAPP_API_PORT } from '@myboteam/agent-core';
import type { DaemonPaths } from './app-config.js';
import { ConnectorService } from './connector-service.js';
import { type RouteServices, registerRpcMethods } from './daemon-routes.js';
import { GoogleAccountService } from './google-account-service.js';
import { HealthService } from './health.js';
import { log } from './logger.js';
import { OpenAiOauthManager } from './opencode/auth-openai.js';
import { SchedulerService } from './scheduler-service.js';
import { SecretsService } from './secrets-service.js';
import { SettingsService } from './settings-service.js';
import { SkillsService } from './skills-service.js';
import { StorageService } from './storage-service.js';
import { registerTaskEventForwarding } from './task-event-forwarding.js';
import { TaskService } from './task-service.js';
import { WhatsAppSendApi } from './whatsapp/whatsapp-send-api.js';
import { WhatsAppDaemonService } from './whatsapp-service.js';
import { WorkspaceService } from './workspace-service.js';

export interface BootConfig {
  paths: DaemonPaths;
  isPackaged: boolean;
  authToken: string;
  myboteamRuntime: MyboteamRuntime;
  setProxyTaskId: ((taskId: string | undefined) => void) | undefined;
}

export interface BootResult {
  storageService: StorageService;
  taskService: TaskService;
  healthService: HealthService;
  schedulerService: SchedulerService;
  whatsappService: WhatsAppDaemonService;
  whatsappSendApi: WhatsAppSendApi;
  openAiOauthManager: OpenAiOauthManager;
  secretsService: SecretsService;
  settingsService: SettingsService;
  workspaceService: WorkspaceService;
  connectorService: ConnectorService;
  googleAccountService: GoogleAccountService;
  skillsService: SkillsService;
  rpc: DaemonRpcServer;
}

async function initializeStorage(paths: DaemonPaths): Promise<{
  storageService: StorageService;
  storage: Awaited<ReturnType<StorageService['initialize']>>;
}> {
  const storageService = new StorageService();
  const storage = await storageService.initialize(paths.userDataPath);
  for (const task of storage.getTasks()) {
    if (task.status === 'running') {
      log.warn(`[Daemon] Crash recovery: marking stale task ${task.id} as failed`);
      storage.updateTaskStatus(task.id, 'failed', new Date().toISOString());
    }
  }
  return { storageService, storage };
}

function createRpcServer(paths: DaemonPaths): DaemonRpcServer {
  return new DaemonRpcServer({
    socketPath: paths.socketPath,
    onConnection: (clientId) => log.info(`[Daemon] Client connected: ${clientId}`),
    onDisconnection: (clientId) => log.info(`[Daemon] Client disconnected: ${clientId}`),
  });
}

function createServices(
  storage: Awaited<ReturnType<StorageService['initialize']>>,
  storageService: StorageService,
  paths: DaemonPaths,
  isPackaged: boolean,
  myboteamRuntime: MyboteamRuntime,
  setProxyTaskId: ((taskId: string | undefined) => void) | undefined,
  authToken: string,
  rpc: DaemonRpcServer,
) {
  const taskService = new TaskService(storage, {
    userDataPath: paths.userDataPath,
    mcpToolsPath: paths.mcpToolsPath,
    isPackaged,
    resourcesPath: paths.resourcesPath,
    appPath: paths.appPath,
    myboteamRuntime,
    rpcConnectivityProbe: { hasConnectedClients: () => rpc.hasConnectedClients() },
    setProxyTaskId,
  });
  const healthService = new HealthService();
  const schedulerService = new SchedulerService(storage, (prompt, workspaceId) => {
    void taskService.startTask({ prompt, workspaceId, source: 'scheduler' });
  });
  const whatsappService = new WhatsAppDaemonService(storage, paths.userDataPath, taskService);
  const whatsappSendApi = new WhatsAppSendApi(whatsappService, authToken);
  const openAiOauthManager = new OpenAiOauthManager({
    storage,
    userDataPath: paths.userDataPath,
    mcpToolsPath: paths.mcpToolsPath,
    isPackaged,
    resourcesPath: paths.resourcesPath,
    appPath: paths.appPath,
    myboteamRuntime,
  });
  const secretsService = new SecretsService(storage);
  const settingsService = new SettingsService(storage);
  const workspaceService = new WorkspaceService();
  const connectorService = new ConnectorService(storage);
  const googleAccountService = new GoogleAccountService(storageService.getRawDatabase(), storage);
  const skillsService = new SkillsService({
    dataDir: paths.userDataPath,
    bundledSkillsPath: paths.bundledSkillsPath,
  });
  return {
    taskService,
    healthService,
    schedulerService,
    whatsappService,
    whatsappSendApi,
    openAiOauthManager,
    secretsService,
    settingsService,
    workspaceService,
    connectorService,
    googleAccountService,
    skillsService,
  };
}

async function initializeServices(
  workspaceService: WorkspaceService,
  skillsService: SkillsService,
  googleAccountService: GoogleAccountService,
): Promise<void> {
  workspaceService.ensureInitialized();
  try {
    await skillsService.initialize();
  } catch (err) {
    log.warn(
      `[Daemon] SkillsService initialize failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  googleAccountService.startAllTimers();
}

function registerRoutes(
  rpc: DaemonRpcServer,
  services: ReturnType<typeof createServices>,
  storageService: StorageService,
  myboteamRuntime: MyboteamRuntime,
): void {
  const routeServices = {
    rpc,
    ...services,
    storageService,
    myboteamRuntime,
  } as unknown as RouteServices;
  registerRpcMethods(routeServices);
  registerTaskEventForwarding(routeServices);
}

async function startServices(
  rpc: DaemonRpcServer,
  whatsappSendApi: WhatsAppSendApi,
  schedulerService: SchedulerService,
  whatsappService: WhatsAppDaemonService,
  authToken: string,
): Promise<void> {
  await rpc.start();
  await whatsappSendApi.start(WHATSAPP_API_PORT);
  process.env.MYBOTEAM_DAEMON_AUTH_TOKEN = authToken;
  const whatsappPort = whatsappSendApi.getPort();
  if (whatsappPort) {
    process.env.MYBOTEAM_WHATSAPP_API_PORT = String(whatsappPort);
  }
  schedulerService.start();
  log.info('[Daemon] Scheduler started');
  whatsappService.autoConnectIfEnabled();
}

export async function bootDaemon(config: BootConfig): Promise<BootResult> {
  const { paths, isPackaged, authToken, myboteamRuntime, setProxyTaskId } = config;
  const { storageService, storage } = await initializeStorage(paths);
  const rpc = createRpcServer(paths);
  const services = createServices(
    storage,
    storageService,
    paths,
    isPackaged,
    myboteamRuntime,
    setProxyTaskId,
    authToken,
    rpc,
  );
  await initializeServices(
    services.workspaceService,
    services.skillsService,
    services.googleAccountService,
  );
  registerRoutes(rpc, services, storageService, myboteamRuntime);
  await startServices(
    rpc,
    services.whatsappSendApi,
    services.schedulerService,
    services.whatsappService,
    authToken,
  );
  return { ...services, storageService, rpc };
}
