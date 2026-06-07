import { DEFAULT_SANDBOX_CONFIG } from '../../common/types/sandbox.js';
import { DisabledSandboxProvider } from '../../sandbox/disabled-provider.js';
import type { AdapterOptions } from './adapter-types.js';

export function resolveSandboxProvider(options: AdapterOptions) {
  if (options.sandboxFactory) {
    return options.sandboxFactory().provider;
  }
  if (
    options.sandboxConfig &&
    options.sandboxConfig.mode !== 'disabled' &&
    !options.sandboxProvider
  ) {
    throw new Error(
      `sandboxProvider must be supplied when sandboxConfig.mode is "${options.sandboxConfig.mode}". ` +
        'Omitting it causes the task to run unsandboxed on the host.',
    );
  }
  return options.sandboxProvider ?? new DisabledSandboxProvider();
}

export function resolveSandboxConfig(options: AdapterOptions) {
  if (options.sandboxFactory) {
    return options.sandboxFactory().config;
  }
  return options.sandboxConfig ?? DEFAULT_SANDBOX_CONFIG;
}
