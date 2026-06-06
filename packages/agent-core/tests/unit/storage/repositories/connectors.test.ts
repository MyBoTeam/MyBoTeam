import { afterEach, describe, expect, it, vi } from 'vitest';

const mockDb = vi.hoisted(() => ({
  exec: vi.fn(),
  run: vi.fn(),
  getRowsModified: vi.fn(),
}));

vi.mock('../../../../src/storage/database.js', () => ({
  getDatabase: vi.fn(() => mockDb),
  flushDatabase: vi.fn(),
}));

vi.mock('../../../../src/utils/logging.js', () => ({
  createConsoleLogger: vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  })),
}));

import type { McpConnector } from '../../../../src/common/types/connector.js';
import {
  clearAllConnectors,
  deleteConnector,
  getAllConnectors,
  getConnectorById,
  getEnabledConnectors,
  setConnectorEnabled,
  setConnectorStatus,
  upsertConnector,
} from '../../../../src/storage/repositories/connectors.js';

function makeConnector(overrides: Partial<McpConnector> = {}): McpConnector {
  return {
    id: 'conn-1',
    name: 'Test Connector',
    url: 'https://example.com/mcp',
    status: 'disconnected',
    isEnabled: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const sampleRow = {
  id: 'conn-1',
  name: 'Test Connector',
  url: 'https://example.com/mcp',
  status: 'disconnected',
  is_enabled: 1,
  oauth_metadata_json: null,
  client_registration_json: null,
  last_connected_at: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

function qResult<T extends Record<string, unknown>>(rows: T | T[]): any[] {
  const arr = Array.isArray(rows) ? rows : [rows];
  if (arr.length === 0) return [];
  const columns = Object.keys(arr[0]);
  const values = arr.map((r) => columns.map((c) => r[c]));
  return [{ columns, values }];
}

describe('connectors repository', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllConnectors', () => {
    it('returns all connectors ordered by created_at DESC', () => {
      mockDb.exec.mockReturnValueOnce(qResult([sampleRow]));

      const result = getAllConnectors();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('conn-1');
      expect(result[0].isEnabled).toBe(true);
    });

    it('returns empty array when no connectors exist', () => {
      mockDb.exec.mockReturnValueOnce(qResult([]));

      const result = getAllConnectors();
      expect(result).toEqual([]);
    });
  });

  describe('getEnabledConnectors', () => {
    it('returns only enabled connectors', () => {
      mockDb.exec.mockReturnValueOnce(qResult([sampleRow]));

      const result = getEnabledConnectors();
      expect(result).toHaveLength(1);
      expect(result[0].isEnabled).toBe(true);
    });
  });

  describe('getConnectorById', () => {
    it('returns connector when found', () => {
      mockDb.exec.mockReturnValueOnce(qResult(sampleRow));

      const result = getConnectorById('conn-1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('conn-1');
    });

    it('returns null when connector not found', () => {
      mockDb.exec.mockReturnValueOnce(qResult([]));

      const result = getConnectorById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('upsertConnector', () => {
    it('inserts a new connector', () => {
      const connector = makeConnector();
      upsertConnector(connector);

      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO connectors'), [
        connector.id,
        connector.name,
        connector.url,
        connector.status,
        1,
        null,
        null,
        null,
        connector.createdAt,
        connector.updatedAt,
      ]);
    });

    it('serializes oauthMetadata and clientRegistration as JSON', () => {
      const connector = makeConnector({
        oauthMetadata: {
          authorizationEndpoint: 'https://auth.example.com',
          tokenEndpoint: 'https://token.example.com',
        },
        clientRegistration: { client_id: 'abc', client_secret: 'secret' } as never,
      });
      upsertConnector(connector);

      expect(mockDb.run).toHaveBeenCalled();
      const args = mockDb.run.mock.calls[0][1];
      expect(args[5]).toBe(JSON.stringify(connector.oauthMetadata));
      expect(args[6]).toBe(JSON.stringify(connector.clientRegistration));
    });
  });

  describe('setConnectorEnabled', () => {
    it('enables a connector', () => {
      setConnectorEnabled('conn-1', true);
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE connectors'), [
        1,
        expect.any(String),
        'conn-1',
      ]);
    });

    it('disables a connector', () => {
      setConnectorEnabled('conn-1', false);
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE connectors'), [
        0,
        expect.any(String),
        'conn-1',
      ]);
    });
  });

  describe('setConnectorStatus', () => {
    it('updates connector status', () => {
      setConnectorStatus('conn-1', 'connected');
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE connectors'), [
        'connected',
        expect.any(String),
        'conn-1',
      ]);
    });
  });

  describe('deleteConnector', () => {
    it('deletes a connector by id', () => {
      deleteConnector('conn-1');
      expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM connectors WHERE id = ?', ['conn-1']);
    });
  });

  describe('clearAllConnectors', () => {
    it('deletes all connectors', () => {
      clearAllConnectors();
      expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM connectors');
    });
  });
});
