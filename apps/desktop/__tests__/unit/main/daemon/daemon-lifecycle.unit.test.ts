import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockClose = vi.fn();
const mockDaemonClient = { call: vi.fn(), close: mockClose };

vi.mock('@main/daemon-bootstrap', () => ({
  getDaemonClient: vi.fn(() => mockDaemonClient),
}));

import {
  getDaemonClient,
  getDaemonMode,
  setClient,
  setMode,
  shutdownDaemon,
} from '@main/daemon/daemon-lifecycle';

describe('daemon-lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setClient(null);
    setMode(null);
  });

  describe('setClient / getDaemonClient', () => {
    it('should return the client after it is set', () => {
      const client = { call: vi.fn(), close: vi.fn() };
      setClient(client);
      expect(getDaemonClient()).toBe(client);
    });

    it('should throw when no client is set', () => {
      expect(() => getDaemonClient()).toThrow(
        'Daemon not bootstrapped. Call bootstrapDaemon() first.',
      );
    });
  });

  describe('setMode / getDaemonMode', () => {
    it('should return the mode after it is set', () => {
      setMode('socket');
      expect(getDaemonMode()).toBe('socket');
    });

    it('should return null when mode is not set', () => {
      expect(getDaemonMode()).toBeNull();
    });

    it('should allow resetting mode to null', () => {
      setMode('socket');
      setMode(null);
      expect(getDaemonMode()).toBeNull();
    });
  });

  describe('shutdownDaemon', () => {
    it('should close the client and set it to null', () => {
      const client = { call: vi.fn(), close: vi.fn() };
      setClient(client);
      setMode('socket');

      shutdownDaemon();

      expect(client.close).toHaveBeenCalledOnce();
      expect(getDaemonMode()).toBeNull();
    });

    it('should handle being called when no client exists', () => {
      expect(() => shutdownDaemon()).not.toThrow();
    });

    it('should reset mode to null even without a client', () => {
      setMode('socket');
      shutdownDaemon();
      expect(getDaemonMode()).toBeNull();
    });
  });
});
