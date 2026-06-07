import { computeDeviceFingerprint } from '../identity/device-fingerprint';
import { getAnalyticsStore, getClientId } from './analytics-service-utils-store';

export function isFirstTaskCompleted(): boolean {
  return getAnalyticsStore().get('firstTaskCompleted');
}

export function markFirstTaskCompleted(): void {
  getAnalyticsStore().set('firstTaskCompleted', true);
}

export function getDeviceFingerprint(): string {
  return getAnalyticsStore().get('deviceFingerprint') || getClientId();
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
