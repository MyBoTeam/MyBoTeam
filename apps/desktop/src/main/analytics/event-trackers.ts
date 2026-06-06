import { nativeTheme } from 'electron';
import { getAllApiKeys } from '../store/secureStorage';
import {
  getFirstSeenAt,
  getSessionDuration,
  getSessionTaskCount,
  trackEvent,
} from './analytics-service';
import type { HardwareProperties } from './event-types';

let cachedHardwareProps: HardwareProperties | null = null;

export function setHardwareProperties(props: HardwareProperties): void {
  cachedHardwareProps = props;
}

export function getHardwareProperties(): HardwareProperties | null {
  return cachedHardwareProps;
}

const CRASH_WINDOW_MS = 60_000;
const MAX_CRASH_EVENTS = 5;
let crashTimestamps: number[] = [];

export function _resetCrashRateLimit(): void {
  crashTimestamps = [];
}

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

export function trackPageView(pagePath: string, pageTitle?: string): void {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
    event_category: 'navigation',
  });
}

export function trackSubmitTask(model?: string, provider?: string): void {
  trackEvent('submit_task', {
    event_category: 'engagement',
    model,
    provider,
  });
}

export function trackNewTask(): void {
  trackEvent('new_task', {
    event_category: 'engagement',
  });
}

export function trackOpenSettings(): void {
  trackEvent('open_settings', {
    event_category: 'engagement',
  });
}

export function trackUpdateCheck(): void {
  trackEvent('update_check', { event_category: 'updates' });
}

export function trackUpdateAvailable(currentVersion: string, newVersion: string): void {
  trackEvent('update_available', {
    event_category: 'updates',
    current_version: currentVersion,
    new_version: newVersion,
  });
}

export function trackUpdateNotAvailable(): void {
  trackEvent('update_not_available', { event_category: 'updates' });
}

export function trackUpdateDownloadStart(newVersion: string): void {
  trackEvent('update_download_start', { event_category: 'updates', new_version: newVersion });
}

export function trackUpdateDownloadComplete(newVersion: string): void {
  trackEvent('update_download_complete', { event_category: 'updates', new_version: newVersion });
}

export function trackUpdateInstallStart(newVersion: string): void {
  trackEvent('update_install_start', { event_category: 'updates', new_version: newVersion });
}

export function trackUpdateFailed(errorType: string, errorMessage: string): void {
  trackEvent('update_failed', {
    event_category: 'updates',
    error_type: errorType,
    error_message: errorMessage,
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
