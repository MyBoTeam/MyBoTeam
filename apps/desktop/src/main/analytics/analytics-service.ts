/**
 * analytics-service.ts — GA4 Measurement Protocol analytics.
 *
 * No-ops gracefully when GA4 is not configured (OSS builds).
 * Session and client state management lives in analytics-service-utils.ts.
 * GA4 sending logic lives in analytics-service-ga4.ts.
 */

import { app } from 'electron';
import { trackGa4Event } from './analytics-service-ga4';
import {
  sessionId as _sessionUuid,
  getClientId,
  initClientId,
  initDeviceFingerprintCache,
  initSessionState,
  isDebugMode,
} from './analytics-service-utils';

export type { EventParams } from './analytics-service-ga4';
export { flushAnalytics, setOnlineStatus, trackGa4Event } from './analytics-service-ga4';
export {
  getAnalyticsSessionId,
  getClientId,
  getDeviceFingerprint,
  getFirstLaunchVersion,
  getFirstSeenAt,
  getSessionDuration,
  getSessionTaskCount,
  incrementTaskCount,
  isFirstTaskCompleted,
  markFirstTaskCompleted,
} from './analytics-service-utils';

// ── Init ─────────────────────────────────────────────────────────────

export function initAnalytics(): { isFirstLaunch: boolean } {
  const result = initClientId();
  initSessionState();

  console.log('[Analytics] Initialized with client ID:', `${getClientId().substring(0, 8)}...`);
  console.log('[Analytics] Session ID:', `${_sessionUuid.substring(0, 8)}...`);
  console.log('[Analytics] Environment:', app.isPackaged ? 'production' : 'dev');
  if (isDebugMode()) {
    console.log('[Analytics] Debug mode enabled — events sent to GA4 DebugView');
  }

  return result;
}

export function initDeviceFingerprint(): void {
  initDeviceFingerprintCache();
}

// ── Event tracking ───────────────────────────────────────────────────

export async function trackEvent(
  eventName: string,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<void> {
  try {
    try {
      const { trackMixpanelEvent } = await import('./mixpanel-service');
      trackMixpanelEvent(eventName, params);
    } catch {
      // Mixpanel not initialized — no-op
    }

    await trackGa4Event(eventName, params);
  } catch (error) {
    console.error(`[Analytics] Failed to track event "${eventName}":`, error);
  }
}
