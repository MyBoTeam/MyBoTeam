import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/sandbox/native-provider.js', () => ({
  NativeSandboxProvider: class Native {
    type = 'native';
    constructor(readonly platform?: NodeJS.Platform) {}
  },
}));

vi.mock('../../../src/sandbox/docker-provider.js', () => ({
  DockerSandboxProvider: class Docker {
    type = 'docker';
    constructor(
      readonly platform?: NodeJS.Platform,
      readonly getSandboxPaths?: () => { workspace: string },
    ) {}
  },
}));

vi.mock('../../../src/sandbox/disabled-provider.js', () => ({
  DisabledSandboxProvider: class Disabled {
    type = 'disabled';
  },
}));

import { createSandboxProvider } from '../../../src/factories/sandbox.js';

describe('createSandboxProvider', () => {
  it('should create NativeSandboxProvider for native mode', () => {
    const result = createSandboxProvider({ mode: 'native' });
    expect((result as { type: string }).type).toBe('native');
  });

  it('should pass platform to NativeSandboxProvider', () => {
    const result = createSandboxProvider({ mode: 'native' }, 'darwin');
    expect((result as { platform: NodeJS.Platform }).platform).toBe('darwin');
  });

  it('should create DockerSandboxProvider for docker mode', () => {
    const getPaths = () => ({ workspace: '/workspace' });
    const result = createSandboxProvider({ mode: 'docker' }, 'linux', getPaths);
    expect((result as { type: string }).type).toBe('docker');
    expect((result as { platform: string }).platform).toBe('linux');
  });

  it('should create DisabledSandboxProvider for unknown mode', () => {
    const result = createSandboxProvider({ mode: 'unknown' as never });
    expect((result as { type: string }).type).toBe('disabled');
  });
});
