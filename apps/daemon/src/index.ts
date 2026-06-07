import crypto from 'node:crypto';
import { acquirePidLock, installCrashHandlers, type PidLockHandle } from '@myboteam/agent-core';
import {
  DRAIN_TIMEOUT_MS,
  loadOptionalRuntime,
  logStartupBanner,
  parseDaemonArgs,
  resolveDaemonPaths,
} from './app-config.js';
import { type BootConfig, type BootResult, bootDaemon } from './app-setup.js';
import { safeHandler } from './daemon-routes.js';
import { VERSION } from './health.js';
import { log } from './logger.js';

let pidLock: PidLockHandle | null = null;

async function main(): Promise<void> {
  installCrashHandlers();

  const args = parseDaemonArgs();
  if (args.version) {
    console.log(VERSION);
    process.exit(0);
  }

  const paths = resolveDaemonPaths(args);
  const { myboteamRuntime, setProxyTaskId } = await loadOptionalRuntime();
  const authToken = crypto.randomUUID();

  pidLock = acquirePidLock(paths.pidPath);
  logStartupBanner(args.dataDir, paths.pidPath);

  const bootConfig: BootConfig = {
    paths,
    isPackaged: args.isPackaged,
    authToken,
    myboteamRuntime,
    setProxyTaskId,
  };
  const services: BootResult = await bootDaemon(bootConfig);
  log.info(`[Daemon] Listening on ${paths.socketPath}`);

  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info('[Daemon] Shutting down...');

    services.schedulerService.stop();
    log.info('[Daemon] Scheduler stopped');

    const activeCount = services.taskService.getActiveTaskCount();
    if (activeCount > 0) {
      log.info(`[Daemon] Draining ${activeCount} active task(s)...`);
      await new Promise<void>((resolve) => {
        let remaining = services.taskService.getActiveTaskCount();
        if (remaining === 0) {
          resolve();
          return;
        }
        const drainTimeout = setTimeout(() => {
          log.warn('[Daemon] Drain timeout reached, force-killing active tasks');
          services.taskService.dispose();
          resolve();
        }, DRAIN_TIMEOUT_MS);
        drainTimeout.unref();

        const onComplete = () => {
          remaining = services.taskService.getActiveTaskCount();
          if (remaining === 0) {
            clearTimeout(drainTimeout);
            services.taskService.removeListener('complete', onComplete);
            services.taskService.removeListener('error', onComplete);
            resolve();
          }
        };
        services.taskService.on('complete', onComplete);
        services.taskService.on('error', onComplete);
      });
    }

    services.whatsappSendApi.stop();
    services.whatsappService.dispose();
    services.openAiOauthManager.dispose();
    services.taskService.dispose();
    await services.rpc.stop();
    services.storageService.close();
    pidLock?.release();
    log.info('[Daemon] Shutdown complete');
    process.exit(0);
  };

  const forceShutdown = () => {
    log.error('[Daemon] Forced shutdown after timeout');
    pidLock?.release();
    process.exit(1);
  };

  services.rpc.registerMethod(
    'daemon.shutdown',
    safeHandler(async () => {
      log.info('[Daemon] Shutdown requested via RPC');
      setTimeout(() => void shutdown(), 100);
      return Promise.resolve();
    }),
  );

  process.on('SIGINT', () => {
    setTimeout(forceShutdown, DRAIN_TIMEOUT_MS + 10_000).unref();
    void shutdown();
  });
  process.on('SIGTERM', () => {
    setTimeout(forceShutdown, DRAIN_TIMEOUT_MS + 10_000).unref();
    void shutdown();
  });
}

main().catch((err) => {
  log.error('[Daemon] Fatal error:', err);
  pidLock?.release();
  process.exit(1);
});
