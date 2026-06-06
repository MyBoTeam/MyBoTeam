import { describe, expect, it, vi } from 'vitest';

vi.mock('@main/opencode/cli-resolver', () => ({
  getBundledOpenCodeVersion: vi.fn(() => '0.5.0'),
  isOpenCodeCliAvailable: vi.fn(() => true),
  getOpenCodeCliPath: vi.fn(() => ({ command: '/usr/bin/opencode', args: [] })),
}));

describe('opencode/index barrel', () => {
  it('should export isOpenCodeCliInstalled returning true', async () => {
    const mod = await import('@main/opencode/index');
    const result = await mod.isOpenCodeCliInstalled();
    expect(result).toBe(true);
  });

  it('should export getOpenCodeCliVersion returning version string', async () => {
    const mod = await import('@main/opencode/index');
    const result = await mod.getOpenCodeCliVersion();
    expect(result).toBe('0.5.0');
  });

  it('should re-export type and value symbols', async () => {
    const mod = await import('@main/opencode/index');
    expect(typeof mod.getOpenCodeCliPath).toBe('function');
    expect(typeof mod.isOpenCodeCliAvailable).toBe('function');
    expect(typeof mod.getBundledOpenCodeVersion).toBe('function');
    expect(typeof mod.stopDevBrowserServer).toBe('function');
    expect(typeof mod.cleanupVertexServiceAccountKey).toBe('function');
  });
});
