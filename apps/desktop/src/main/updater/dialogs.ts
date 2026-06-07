import { app, clipboard, dialog, shell } from 'electron';

export async function showUpdateReadyDialog(
  version: string,
  quitAndInstall: () => Promise<void>,
): Promise<void> {
  const { response } = await dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: `Version ${version} has been downloaded.`,
    detail: 'The update will be installed when you restart the app. Would you like to restart now?',
    buttons: ['Restart Now', 'Later'],
    defaultId: 0,
    cancelId: 1,
  });
  if (response === 0) {
    await quitAndInstall();
  }
}

export async function showNoUpdatesDialog(): Promise<void> {
  await dialog.showMessageBox({
    type: 'info',
    title: 'No Updates',
    message: `You're up to date!`,
    detail: `MyBoTeam ${app.getVersion()} is the latest version.`,
    buttons: ['OK'],
  });
}

export async function showUpdateCheckFailedDialog(): Promise<void> {
  await dialog.showMessageBox({
    type: 'error',
    title: 'Update Check Failed',
    message: 'Could not check for updates',
    detail: 'Failed to fetch update information. Please try again later.',
    buttons: ['OK'],
  });
}

export async function showManualUpdateDialog(
  currentVersion: string,
  newVersion: string,
  downloadUrl: string,
): Promise<void> {
  const response = await dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: `A new version of MyBoTeam is available!`,
    detail:
      `Version ${newVersion} is available.\n` +
      `You are currently on version ${currentVersion}.\n\n` +
      `Click "Download" to open the download page in your browser.`,
    buttons: ['Download', 'Copy URL', 'Later'],
    defaultId: 0,
    cancelId: 2,
  });

  if (response.response === 0) {
    await shell.openExternal(downloadUrl);
  } else if (response.response === 1) {
    clipboard.writeText(downloadUrl);
  }
}
