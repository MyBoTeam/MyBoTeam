import type { BrowserWindow } from 'electron';
import { _s } from './state-data';

export function getMainWindow(): BrowserWindow | null {
  return _s.mainWindow;
}

export function getDownloadedVersion(): string | null {
  return _s.downloadedVersion;
}

export function getUserCheckInFlight(): boolean {
  return _s.userCheckInFlight;
}

export function invokeOnUpdateDownloaded(): void {
  _s.onUpdateDownloadedCallback?.();
}

export function getUpdateState(): {
  updateAvailable: boolean;
  downloadedVersion: string | null;
  availableVersion: string | null;
} {
  return {
    updateAvailable: !!_s.updateAvailable,
    downloadedVersion: _s.downloadedVersion,
    availableVersion: _s.updateAvailable?.version ?? null,
  };
}
