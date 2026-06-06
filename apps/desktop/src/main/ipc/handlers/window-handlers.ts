import { BrowserWindow } from 'electron';
import { handle } from './utils';

export function registerWindowHandlers(): void {
  const getWin = () => BrowserWindow.getAllWindows()[0];

  handle('window:is-maximized', async () => {
    return getWin()?.isMaximized() ?? false;
  });

  handle('window:is-fullscreen', async () => {
    return getWin()?.isFullScreen() ?? false;
  });
}
