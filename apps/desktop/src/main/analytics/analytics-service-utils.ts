import { randomUUID } from 'node:crypto';
import { app } from 'electron';
import Store from 'electron-store';
import { getBuildConfig } from '../config/build-config';
import { computeDeviceFingerprint } from '../identity/device-fingerprint';

// ── Store schema type ────────────────────────────────────────────────

export interface AnalyticsConfigSchema {
  clientId: string;
  deviceFingerprint: string;
  firstSeenAt: string;
  firstLaunchVersion: string;
  firstTaskCompleted: boolean;
}

// ── Lazily-initialized store ─────────────────────────────────────────

export let _analyticsStore: Store<AnalyticsConfigSchema> | null = null;

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

// ── GA4 helpers ──────────────────────────────────────────────────────

export function getGaMeasurementId(): string {
  return getBuildConfig().gaMeasurementId;
}

export function getGaApiSecret(): string {
  return getBuildConfig().gaApiSecret;
}

export function isDebugMode(): boolean {
  return process.env.GA_DEBUG_MODE === '1' || process.env.GA_DEBUG_MODE === 'true';
}

export function getEndpoint(): string {
  return `https://www.google-analytics.com/mp/collect?measurement_id=${getGaMeasurementId()}&api_secret=${getGaApiSecret()}`;
}

export function isGA4Configured(): boolean {
  return !!(getAnalyticsStore().get('clientId') && getGaApiSecret() && getGaMeasurementId());
}

// ── Session state ────────────────────────────────────────────────────

export let sessionId: string = '';
export let numericSessionId: number = 0;
export let sessionStartTime: number = 0;
export let sessionTaskCount: number = 0;

export function initSessionState(): void {
  sessionId = randomUUID();
  numericSessionId = Date.now();
  sessionStartTime = Date.now();
  sessionTaskCount = 0;
}

// ── Getters / setters ────────────────────────────────────────────────

export function getClientId(): string {
  return getAnalyticsStore().get('clientId');
}

export function getAnalyticsSessionId(): string {
  return sessionId;
}

export function getFirstSeenAt(): string {
  return getAnalyticsStore().get('firstSeenAt') || '';
}

export function getFirstLaunchVersion(): string {
  return getAnalyticsStore().get('firstLaunchVersion') || '';
}

export function isFirstTaskCompleted(): boolean {
  return getAnalyticsStore().get('firstTaskCompleted');
}

export function markFirstTaskCompleted(): void {
  getAnalyticsStore().set('firstTaskCompleted', true);
}

export function incrementTaskCount(): void {
  sessionTaskCount++;
}

export function getSessionTaskCount(): number {
  return sessionTaskCount;
}

export function getSessionDuration(): number {
  return Math.floor((Date.now() - sessionStartTime) / 1000);
}

export function getDeviceFingerprint(): string {
  return getAnalyticsStore().get('deviceFingerprint') || getClientId();
}

// ── Initialization helpers ──────────────────────────────────────────

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

export function initDeviceFingerprintCache(): void {
  const cached = getAnalyticsStore().get('deviceFingerprint');
  if (cached) {
    console.log(
      '[Analytics] Device fingerprint loaded from cache:',
      `${cached.substring(0, 8)}...`,
    );
    return;
  }

  const fingerprint = computeDeviceFingerprint();
  if (fingerprint) {
    getAnalyticsStore().set('deviceFingerprint', fingerprint);
    console.log('[Analytics] Device fingerprint computed:', `${fingerprint.substring(0, 8)}...`);
  } else {
    console.warn('[Analytics] Device fingerprint computation failed, will fall back to clientId');
  }
}
