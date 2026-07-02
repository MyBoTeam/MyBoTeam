import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockHandle = vi.fn();
const mockInvoke = vi.fn();

vi.mock('electron', () => ({
  ipcMain: {
    handle: (...args: unknown[]) => mockHandle(...args),
  },
}));

vi.mock('../../src/main/ipc-bridge.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/main/ipc-bridge.js')>();
  return mod;
});

import { getDaemonClient, setDaemonClient } from '../../src/main/ipc-bridge.js';

beforeEach(() => {
  vi.clearAllMocks();
  setDaemonClient(null);
});

describe('ipc-bridge daemon client management', () => {
  it('getDaemonClient returns null by default', () => {
    expect(getDaemonClient()).toBeNull();
  });

  it('setDaemonClient stores client reference', () => {
    const fakeClient = { isConnected: true, call: vi.fn() } as unknown as Parameters<
      typeof setDaemonClient
    >[0];
    setDaemonClient(fakeClient);
    expect(getDaemonClient()).toBe(fakeClient);
  });

  it('setDaemonClient(null) clears client reference', () => {
    const fakeClient = { isConnected: true, call: vi.fn() } as unknown as Parameters<
      typeof setDaemonClient
    >[0];
    setDaemonClient(fakeClient);
    setDaemonClient(null);
    expect(getDaemonClient()).toBeNull();
  });
});
