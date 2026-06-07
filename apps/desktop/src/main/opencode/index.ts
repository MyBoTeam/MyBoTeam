export type {
  TaskCallbacks,
  TaskManagerAPI,
  TaskManagerOptions,
  TaskProgressEvent,
} from '@myboteam/agent-core/desktop-main';
export {
  getBundledOpenCodeVersion,
  getOpenCodeCliPath,
  isOpenCodeCliAvailable,
} from './cli-resolver';
export { stopDevBrowserServer } from './dev-browser-shutdown';
export { cleanupVertexServiceAccountKey } from './vertex-cleanup';

import { getBundledOpenCodeVersion, isOpenCodeCliAvailable } from './cli-resolver';

export async function isOpenCodeCliInstalled(): Promise<boolean> {
  return isOpenCodeCliAvailable();
}

export async function getOpenCodeCliVersion(): Promise<string | null> {
  return getBundledOpenCodeVersion();
}
