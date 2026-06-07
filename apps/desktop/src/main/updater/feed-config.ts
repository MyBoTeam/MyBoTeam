import { getBuildConfig } from '../config/build-config';

export function getFeedUrl(): string {
  const url = getBuildConfig().myboteamUpdaterUrl;
  return url.replace(/\/+$/, '');
}

export function getManifestName(platform: 'win' | 'linux', arch?: 'x64' | 'arm64'): string {
  if (platform === 'win') {
    return 'latest-win.yml';
  }
  if (arch === 'arm64') {
    return 'latest-linux-arm64.yml';
  }
  return 'latest-linux.yml';
}
