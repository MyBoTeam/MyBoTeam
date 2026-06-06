import { contextBridge } from 'electron';
import { appCoreHandlers } from './handlers/app-core';
import { authKeyHandlers } from './handlers/auth-keys';
import { analyticsHandlers } from './handlers/debug-analytics';
import { integrationHandlers } from './handlers/integrations';
import { providerLocalHandlers } from './handlers/providers-local';
import { providerRemoteHandlers } from './handlers/providers-remote';
import { serviceHandlers } from './handlers/services';
import { taskEventHandlers } from './handlers/tasks-events';
import { workspaceFileHandlers } from './handlers/workspace-files';

const myboteamAPI = {
  ...appCoreHandlers,
  ...taskEventHandlers,
  ...authKeyHandlers,
  ...providerLocalHandlers,
  ...providerRemoteHandlers,
  ...serviceHandlers,
  ...integrationHandlers,
  ...workspaceFileHandlers,
  ...analyticsHandlers,
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
