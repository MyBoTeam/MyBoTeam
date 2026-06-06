import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDaemonClient = vi.hoisted(() => ({
  call: vi.fn(),
}));

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: vi.fn(() => mockDaemonClient),
}));

const handlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('@main/ipc/handlers/utils', () => ({
  handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
    handlers[channel as string] = handler;
  }),
}));

import type { IpcHandler } from '@main/ipc/types';

vi.mock('@main/ipc/handlers/whatsapp-handlers', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
  };
});

import { registerWhatsAppHandlers } from '@main/ipc/handlers/whatsapp-handlers';

describe('whatsapp-handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(handlers)) {
      delete handlers[k];
    }
    registerWhatsAppHandlers((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler;
    });
  });

  describe('integrations:whatsapp:get-config', () => {
    it('should call daemon whatsapp.getConfig', async () => {
      mockDaemonClient.call.mockResolvedValue({ enabled: true });
      const result = await handlers['integrations:whatsapp:get-config']();
      expect(mockDaemonClient.call).toHaveBeenCalledWith('whatsapp.getConfig');
      expect(result).toEqual({ enabled: true });
    });
  });

  describe('integrations:whatsapp:connect', () => {
    it('should call daemon whatsapp.connect', async () => {
      await handlers['integrations:whatsapp:connect']();
      expect(mockDaemonClient.call).toHaveBeenCalledWith('whatsapp.connect');
    });
  });

  describe('integrations:whatsapp:disconnect', () => {
    it('should call daemon whatsapp.disconnect', async () => {
      await handlers['integrations:whatsapp:disconnect']();
      expect(mockDaemonClient.call).toHaveBeenCalledWith('whatsapp.disconnect');
    });
  });

  describe('integrations:whatsapp:set-enabled', () => {
    it('should call daemon whatsapp.setEnabled with enabled param', async () => {
      await handlers['integrations:whatsapp:set-enabled']({} as unknown, false);
      expect(mockDaemonClient.call).toHaveBeenCalledWith('whatsapp.setEnabled', { enabled: false });
    });
  });
});
