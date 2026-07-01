import { contextBridge } from 'electron';
import { ipcBusAPI } from './ipc-handlers.js';

const myboteamAPI = {
  ...ipcBusAPI,
};

contextBridge.exposeInMainWorld('myboteam', myboteamAPI);

const packageVersion = process.env.npm_package_version;
if (!packageVersion) {
  throw new Error('Package version is not defined. Build is misconfigured.');
}
contextBridge.exposeInMainWorld('myboteamShell', {
  version: packageVersion,
  platform: process.platform,
  isElectron: true,
});

export type MyBoTeamAPI = typeof myboteamAPI;
