import { ipcRenderer } from 'electron';

export const analyticsInvoke = (channel: string, ...args: unknown[]): Promise<void> =>
  ipcRenderer.invoke(channel, ...args).catch(() => {});
