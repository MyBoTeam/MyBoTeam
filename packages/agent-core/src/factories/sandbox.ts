import type { SandboxConfig, SandboxPaths, SandboxProvider } from '../common/types/sandbox.js';
import { DisabledSandboxProvider } from '../sandbox/disabled-provider.js';

import { DockerSandboxProvider } from '../sandbox/docker-provider.js';
import { NativeSandboxProvider } from '../sandbox/native-provider.js';

export function createSandboxProvider(
  config: SandboxConfig,
  platform?: NodeJS.Platform,
  getSandboxPaths?: () => SandboxPaths,
): SandboxProvider {
  switch (config.mode) {
    case 'native':
      return new NativeSandboxProvider(platform);
    case 'docker':
      return new DockerSandboxProvider(platform, getSandboxPaths);
    default:
      return new DisabledSandboxProvider();
  }
}
