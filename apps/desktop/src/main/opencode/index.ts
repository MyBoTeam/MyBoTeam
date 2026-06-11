export {
  getBundledOpenCodeVersion,
  getOpenCodeCliPath,
  isOpenCodeCliAvailable,
} from './cli-resolver';
export { cleanupVertexServiceAccountKey } from './vertex-cleanup';

import { getBundledOpenCodeVersion, isOpenCodeCliAvailable } from './cli-resolver';

export async function isOpenCodeCliInstalled(): Promise<boolean> {
  return isOpenCodeCliAvailable();
}

export async function getOpenCodeCliVersion(): Promise<string | null> {
  return getBundledOpenCodeVersion();
}

export async function stopDevBrowserServer(): Promise<void> {
  const mod = await import('./dev-browser-shutdown');
  await mod.stopDevBrowserServer();
}
