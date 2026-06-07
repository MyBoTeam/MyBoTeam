import type { BrowserWindow } from 'electron';
import type { UpdateInfo } from 'electron-updater';

export const _s = {
  mainWindow: null as BrowserWindow | null,
  downloadedVersion: null as string | null,
  updateAvailable: null as UpdateInfo | null,
  onUpdateDownloadedCallback: null as (() => void) | null,
  userCheckInFlight: false,
};
