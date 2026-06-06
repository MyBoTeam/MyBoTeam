import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@myboteam/agent-core', async () => {
  const actual =
    await vi.importActual<typeof import('@myboteam/agent-core')>('@myboteam/agent-core');
  return {
    ...actual,
  };
});

import type { StorageAPI } from '@myboteam/agent-core';
import { EventEmitter } from 'events';
import { wireStatusListeners } from '../../../src/whatsapp/whatsappStorageSync.js';

class MockWhatsAppService extends EventEmitter {
  sendMessage = vi.fn();
}

function createMockStorage(): StorageAPI {
  let config: Record<string, unknown> | null = null;
  return {
    getMessagingConfig: vi.fn(() => config) as never,
    setMessagingConfig: vi.fn((c: Record<string, unknown>) => {
      config = c;
    }) as never,
    addMessage: vi.fn() as never,
    getMessages: vi.fn() as never,
    deleteMessages: vi.fn() as never,
    getMessage: vi.fn() as never,
  };
}

describe('wireStatusListeners', () => {
  let service: MockWhatsAppService;
  let storage: ReturnType<typeof createMockStorage>;
  let storageAPI: StorageAPI;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new MockWhatsAppService();
    storage = createMockStorage();
    storageAPI = storage as unknown as StorageAPI;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should persist phoneNumber and lastConnectedAt on phoneNumber event', () => {
    wireStatusListeners(service as never, storageAPI, null as never);

    service.emit('phoneNumber', '972501234567');

    expect(storage.setMessagingConfig).toHaveBeenCalledWith({
      integrations: {
        whatsapp: {
          platform: 'whatsapp',
          enabled: true,
          tunnelEnabled: false,
          phoneNumber: '972501234567',
          lastConnectedAt: Date.now(),
        },
      },
    });
  });

  it('should merge phoneNumber into existing config when config already exists', () => {
    storage.setMessagingConfig({
      integrations: {
        slack: { enabled: true },
        whatsapp: {
          platform: 'whatsapp',
          enabled: true,
          tunnelEnabled: false,
          connectionStatus: 'connected',
          lastConnectedAt: 1000,
        },
      },
    } as never);

    wireStatusListeners(service as never, storageAPI, null as never);

    service.emit('phoneNumber', '972501234567');

    expect(storage.setMessagingConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        integrations: expect.objectContaining({
          slack: { enabled: true },
          whatsapp: expect.objectContaining({
            phoneNumber: '972501234567',
            connectionStatus: 'connected',
            lastConnectedAt: Date.now(),
          }),
        }),
      }),
    );
  });

  it('should default to enabled:true and tunnelEnabled:false when no existing whatsapp config', () => {
    wireStatusListeners(service as never, storageAPI, null as never);

    service.emit('phoneNumber', '972501234567');

    expect(storage.setMessagingConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        integrations: expect.objectContaining({
          whatsapp: expect.objectContaining({
            platform: 'whatsapp',
            enabled: true,
            tunnelEnabled: false,
          }),
        }),
      }),
    );
  });

  it('should NOT persist status when status is not "connected"', () => {
    wireStatusListeners(service as never, storageAPI, null as never);

    service.emit('status', 'disconnected');
    service.emit('status', 'connecting');
    service.emit('status', 'qr_ready');

    expect(storage.setMessagingConfig).not.toHaveBeenCalled();
  });

  it('should persist connectionStatus=connected on "connected" status', () => {
    wireStatusListeners(service as never, storageAPI, null as never);

    service.emit('status', 'connected');

    expect(storage.setMessagingConfig).toHaveBeenCalledWith({
      integrations: {
        whatsapp: {
          platform: 'whatsapp',
          enabled: true,
          tunnelEnabled: false,
          connectionStatus: 'connected',
          lastConnectedAt: Date.now(),
        },
      },
    });
  });

  it('should merge connectionStatus into existing config', () => {
    storage.setMessagingConfig({
      integrations: {
        whatsapp: {
          platform: 'whatsapp',
          enabled: true,
          tunnelEnabled: true,
          phoneNumber: '972501234567',
          lastConnectedAt: 1000,
        },
      },
    } as never);

    wireStatusListeners(service as never, storageAPI, null as never);

    service.emit('status', 'connected');

    expect(storage.setMessagingConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        integrations: expect.objectContaining({
          whatsapp: expect.objectContaining({
            phoneNumber: '972501234567',
            connectionStatus: 'connected',
            tunnelEnabled: true,
          }),
        }),
      }),
    );
  });

  it('should update lastConnectedAt on both phoneNumber and connected events', () => {
    wireStatusListeners(service as never, storageAPI, null as never);

    const beforePhone = Date.now();
    service.emit('phoneNumber', '972501234567');

    expect(storage.setMessagingConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        integrations: expect.objectContaining({
          whatsapp: expect.objectContaining({
            lastConnectedAt: beforePhone,
          }),
        }),
      }),
    );

    vi.advanceTimersByTime(5000);

    service.emit('status', 'connected');

    expect(storage.setMessagingConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        integrations: expect.objectContaining({
          whatsapp: expect.objectContaining({
            lastConnectedAt: beforePhone + 5000,
          }),
        }),
      }),
    );
  });
});
