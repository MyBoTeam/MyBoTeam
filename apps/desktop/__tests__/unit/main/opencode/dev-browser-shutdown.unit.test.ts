import { describe, expect, it, vi } from 'vitest';

vi.mock('@myboteam/agent-core/desktop-main', () => ({
  DEV_BROWSER_CDP_PORT: 12345,
  DEV_BROWSER_PORT: 8080,
  shutdownDevBrowserServer: vi.fn(),
}));

vi.mock('@main/logging', () => ({
  getLogCollector: vi.fn(() => ({ log: vi.fn() })),
}));

import { stopDevBrowserServer } from '@main/opencode/dev-browser-shutdown';
import { shutdownDevBrowserServer } from '@myboteam/agent-core/desktop-main';

describe('stopDevBrowserServer', () => {
  it('should call shutdownDevBrowserServer with correct ports', async () => {
    await stopDevBrowserServer();
    expect(shutdownDevBrowserServer).toHaveBeenCalledWith({
      devBrowserPort: 8080,
      devBrowserCdpPort: 12345,
    });
  });
});
