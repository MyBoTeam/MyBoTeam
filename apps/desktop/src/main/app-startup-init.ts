import path from 'node:path';
import { app, nativeImage, nativeTheme } from 'electron';
import { initAnalytics, initDeviceFingerprint } from './analytics/analytics-service';
import { trackAppLaunched } from './analytics/events';
import { initMixpanel } from './analytics/mixpanel-service';
import { getBuildConfig, isAnalyticsEnabled, isFreeMode } from './config/build-config';
import { getDaemonClient } from './daemon-bootstrap';
import { getLogCollector } from './logging';
import { startHuggingFaceServer } from './providers/huggingface-local';
import { skillsManager } from './skills';
import { migrateLegacyData } from './store/legacyMigration';
import { getApiKey } from './store/secureStorage';
import * as workspaceManager from './store/workspaceManager';

function logMain(level: 'INFO' | 'WARN' | 'ERROR', msg: string, data?: Record<string, unknown>) {
  try {
    const l = getLogCollector();
    if (l?.log) l.log(level, 'main', msg, data);
  } catch (_e) {}
}

export function runLegacyMigration(): void {
  if (process.env.CLEAN_START !== '1') {
    try {
      const didMigrate = migrateLegacyData();
      if (didMigrate) logMain('INFO', '[Main] Migrated data from legacy userData path');
    } catch (err) {
      logMain('ERROR', '[Main] Legacy data migration failed', { err: String(err) });
    }
  }
}

export async function initAnalyticsAndSkills(): Promise<boolean> {
  let isFirstLaunch = false;
  try {
    if (isAnalyticsEnabled()) {
      const result = initAnalytics();
      isFirstLaunch = result.isFirstLaunch;
      initDeviceFingerprint();
    }
    if (getBuildConfig().mixpanelToken) {
      initMixpanel();
    }
  } catch (err) {
    logMain('WARN', '[Main] Analytics initialization failed', { err: String(err) });
  }

  await skillsManager.initialize();

  if (process.platform === 'darwin' && app.dock) {
    const iconPath = app.isPackaged
      ? path.join(process.resourcesPath, 'icon.png')
      : path.join(process.env.APP_ROOT!, 'resources', 'icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty()) app.dock.setIcon(icon);
  }

  return isFirstLaunch;
}

export async function initPostBootstrap(): Promise<void> {
  try {
    await workspaceManager.initialize();
  } catch (err) {
    logMain('ERROR', '[Main] Workspace initialization failed', { err: String(err) });
  }

  try {
    const snap = await getDaemonClient().call('settings.getAll');

    try {
      nativeTheme.themeSource = snap.app.theme;
    } catch {}

    const hfConfig = snap.huggingFaceLocalConfig;
    if (hfConfig?.enabled && hfConfig.selectedModelId) {
      logMain(
        'INFO',
        `[Main] Auto-starting HuggingFace server for model: ${hfConfig.selectedModelId}`,
      );
      startHuggingFaceServer(hfConfig.selectedModelId)
        .then((result) => {
          if (!result.success) {
            logMain('ERROR', '[Main] Failed to auto-start HuggingFace local server', {
              error: result.error,
            });
          }
        })
        .catch((err: unknown) => {
          logMain('ERROR', '[Main] Failed to auto-start HuggingFace local server (thrown)', {
            err: String(err),
          });
        });
    }

    try {
      if (!isFreeMode()) {
        const connected = snap.providers.connectedProviders['myboteam-ai'];
        if (connected) {
          const client = getDaemonClient();
          await client.call('provider.removeConnected', { providerId: 'myboteam-ai' });
          if (snap.providers.activeProviderId === 'myboteam-ai') {
            await client.call('provider.setActive', { providerId: null });
          }
          logMain('INFO', '[Main] Removed stale myboteam-ai provider (free mode not available)');
        }
      }
    } catch {}
  } catch (err) {
    logMain('WARN', '[Main] Post-bootstrap settings snapshot read failed', {
      err: String(err),
    });
  }
}

export async function validateConnectedProviders(): Promise<void> {
  try {
    const client = getDaemonClient();
    const providerSettings = await client.call('provider.getSettings');
    for (const [id, provider] of Object.entries(providerSettings.connectedProviders)) {
      const providerId = id as import('@myboteam/agent-core/desktop-main').ProviderId;
      const credType = provider?.credentials?.type;
      if (!credType || credType === 'api_key') {
        const key = await getApiKey(providerId);
        if (!key) {
          logMain(
            'WARN',
            `[Main] Provider ${providerId} has api_key auth but key not found in secure storage`,
          );
          await client.call('provider.removeConnected', { providerId });
          logMain('INFO', `[Main] Removed provider ${providerId} due to missing API key`);
        }
      }
    }
  } catch (err) {
    logMain('ERROR', '[Main] Provider validation failed', { err: String(err) });
  }
}

export async function trackAppLaunchedIfEnabled(isFirstLaunch: boolean): Promise<void> {
  if (isAnalyticsEnabled()) {
    trackAppLaunched(isFirstLaunch).catch((err) =>
      logMain('WARN', '[Main] trackAppLaunched failed', { err: String(err) }),
    );
  }
}
