import type { BrowserWindow } from 'electron';
import type { UpdateInfo } from 'electron-updater';
import { _s } from './state-data';

export function setMainWindow(window: BrowserWindow): void {
  _s.mainWindow = window;
}

export function setDownloadedVersion(v: string | null): void {
  _s.downloadedVersion = v;
}

export function setUpdateAvailable(info: UpdateInfo | null): void {
  _s.updateAvailable = info;
}

export function setUserCheckInFlight(v: boolean): void {
  _s.userCheckInFlight = v;
}

export function setOnUpdateDownloaded(callback: () => void): void {
  _s.onUpdateDownloadedCallback = callback;
}
