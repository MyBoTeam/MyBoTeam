import { randomUUID } from 'node:crypto';
import { app } from 'electron';
import Store from 'electron-store';
import type { AnalyticsConfigSchema } from './analytics-service-utils-ga';

let _analyticsStore: Store<AnalyticsConfigSchema> | null = null;

export function getAnalyticsStore(): Store<AnalyticsConfigSchema> {
  if (!_analyticsStore) {
    _analyticsStore = new Store<AnalyticsConfigSchema>({
      name: 'analytics',
      defaults: {
        clientId: '',
        deviceFingerprint: '',
        firstSeenAt: '',
        firstLaunchVersion: '',
        firstTaskCompleted: false,
      },
    });
  }
  return _analyticsStore;
}

export function getClientId(): string {
  return getAnalyticsStore().get('clientId');
}

export function getFirstSeenAt(): string {
  return getAnalyticsStore().get('firstSeenAt') || '';
}

export function getFirstLaunchVersion(): string {
  return getAnalyticsStore().get('firstLaunchVersion') || '';
}

export function initClientId(): { isFirstLaunch: boolean } {
  let clientId = getAnalyticsStore().get('clientId');
  const isFirstLaunch = !clientId;
  if (!clientId) {
    clientId = randomUUID();
    getAnalyticsStore().set('clientId', clientId);
    getAnalyticsStore().set('firstSeenAt', new Date().toISOString());
    getAnalyticsStore().set('firstLaunchVersion', app.getVersion());
  }

  if (!getAnalyticsStore().get('firstLaunchVersion')) {
    getAnalyticsStore().set('firstLaunchVersion', app.getVersion());
  }

  return { isFirstLaunch };
}
