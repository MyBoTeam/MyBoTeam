import { nativeTheme } from 'electron';
import { getAllApiKeys } from '../store/secureStorage';
import {
  getFirstSeenAt,
  getSessionDuration,
  getSessionTaskCount,
  trackEvent,
} from './analytics-service';

export async function trackAppLaunched(isFirstLaunch: boolean): Promise<void> {
  const firstSeen = getFirstSeenAt();
  const timeSinceInstallS = firstSeen
    ? Math.floor((Date.now() - new Date(firstSeen).getTime()) / 1000)
    : 0;
  const keys = await getAllApiKeys();
  const connectedCount = Object.values(keys).filter((v) => v !== null).length;
  trackEvent('app_launched', {
    event_category: 'app_lifecycle',
    launch_type: isFirstLaunch ? 'cold' : 'warm',
    time_since_install_s: timeSinceInstallS,
    connected_providers_count: connectedCount,
    theme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
  });
}

const CRASH_WINDOW_MS = 60_000;
const MAX_CRASH_EVENTS = 5;
let crashTimestamps: number[] = [];

function _resetCrashRateLimit(): void {
  crashTimestamps = [];
}

export function trackAppCrash(errorType: string, errorMessage: string): void {
  const now = Date.now();

  while (crashTimestamps.length > 0 && now - crashTimestamps[0] >= CRASH_WINDOW_MS) {
    crashTimestamps.shift();
  }

  if (crashTimestamps.length >= MAX_CRASH_EVENTS) {
    return;
  }

  crashTimestamps.push(now);

  trackEvent('app_crash', {
    event_category: 'app_lifecycle',
    error_type: errorType,
    error_message: errorMessage.substring(0, 500),
  });
}

export async function trackAppClose(): Promise<void> {
  const keys = await getAllApiKeys();
  const connectedCount = Object.values(keys).filter((v) => v !== null).length;
  trackEvent('app_close', {
    event_category: 'session',
    duration_seconds: getSessionDuration(),
    task_count: getSessionTaskCount(),
    connected_providers_count: connectedCount,
  });
}

export function trackAppBackgrounded(): void {
  trackEvent('app_backgrounded', { event_category: 'session' });
}

export function trackAppForegrounded(): void {
  trackEvent('app_foregrounded', { event_category: 'session' });
}
