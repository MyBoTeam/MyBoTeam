import type { CloudBrowserConfig } from '@myboteam/agent-core/common';
import type { IpcMainInvokeEvent } from 'electron';
import { getDaemonClient } from '../../../daemon-bootstrap';
import type { IpcHandler } from '../../types';

const VALID_CLOUD_BROWSER_PROVIDERS = new Set(['aws-agentcore', 'browserbase', 'steel']);

export function registerCloudBrowserHandlers(handle: IpcHandler): void {
  handle('settings:cloud-browser-config:get', async (_event: IpcMainInvokeEvent) => {
    return getDaemonClient().call('settings.getCloudBrowserConfig');
  });

  handle(
    'settings:cloud-browser-config:set',
    async (_event: IpcMainInvokeEvent, config: string | null) => {
      if (config === null) {
        await getDaemonClient().call('settings.setCloudBrowserConfig', { config: null });
        return;
      }
      if (typeof config !== 'string') {
        throw new Error('Invalid cloud browser config');
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(config);
      } catch {
        throw new Error('Invalid cloud browser config: malformed JSON');
      }
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Invalid cloud browser config: expected object');
      }
      const cfg = parsed as Record<string, unknown>;
      if (
        cfg.activeProvider !== null &&
        (typeof cfg.activeProvider !== 'string' ||
          !VALID_CLOUD_BROWSER_PROVIDERS.has(cfg.activeProvider as string))
      ) {
        throw new Error(
          'Invalid cloud browser config: activeProvider must be a valid provider or null',
        );
      }
      if (cfg.providers !== undefined) {
        if (
          typeof cfg.providers !== 'object' ||
          cfg.providers === null ||
          Array.isArray(cfg.providers)
        ) {
          throw new Error('Invalid cloud browser config: providers must be a plain object');
        }

        if (
          cfg.activeProvider !== null &&
          typeof cfg.activeProvider === 'string' &&
          !(cfg.providers as Record<string, unknown>)[cfg.activeProvider]
        ) {
          throw new Error(
            'Invalid cloud browser config: activeProvider has no corresponding entry in providers',
          );
        }
      }

      await getDaemonClient().call('settings.setCloudBrowserConfig', {
        config: cfg as unknown as CloudBrowserConfig,
      });
    },
  );
}
