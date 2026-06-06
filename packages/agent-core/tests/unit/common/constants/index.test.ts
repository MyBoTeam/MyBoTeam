import { describe, expect, it } from 'vitest';
import {
  CONNECTOR_AUTH_REQUIRED_MARKER,
  DEV_BROWSER_CDP_PORT,
  DEV_BROWSER_PORT,
  LOG_BUFFER_FLUSH_INTERVAL_MS,
  LOG_BUFFER_MAX_ENTRIES,
  LOG_MAX_FILE_SIZE_BYTES,
  LOG_RETENTION_DAYS,
  MCP_TOOL_TIMEOUT_MS,
  PERMISSION_REQUEST_TIMEOUT_MS,
  WHATSAPP_API_PORT,
} from '../../../../src/common/constants.js';

describe('constants', () => {
  it('DEV_BROWSER_PORT is 9224', () => {
    expect(DEV_BROWSER_PORT).toBe(9224);
  });

  it('DEV_BROWSER_CDP_PORT is 9225', () => {
    expect(DEV_BROWSER_CDP_PORT).toBe(9225);
  });

  it('WHATSAPP_API_PORT is 9230', () => {
    expect(WHATSAPP_API_PORT).toBe(9230);
  });

  it('PERMISSION_REQUEST_TIMEOUT_MS is 5 minutes', () => {
    expect(PERMISSION_REQUEST_TIMEOUT_MS).toBe(5 * 60 * 1000);
  });

  it('LOG_MAX_FILE_SIZE_BYTES is 50MB', () => {
    expect(LOG_MAX_FILE_SIZE_BYTES).toBe(50 * 1024 * 1024);
  });

  it('LOG_RETENTION_DAYS is 7', () => {
    expect(LOG_RETENTION_DAYS).toBe(7);
  });

  it('LOG_BUFFER_FLUSH_INTERVAL_MS is 5000', () => {
    expect(LOG_BUFFER_FLUSH_INTERVAL_MS).toBe(5000);
  });

  it('LOG_BUFFER_MAX_ENTRIES is 100', () => {
    expect(LOG_BUFFER_MAX_ENTRIES).toBe(100);
  });

  it('MCP_TOOL_TIMEOUT_MS is 30000', () => {
    expect(MCP_TOOL_TIMEOUT_MS).toBe(30000);
  });

  it('CONNECTOR_AUTH_REQUIRED_MARKER is the expected string', () => {
    expect(CONNECTOR_AUTH_REQUIRED_MARKER).toContain('MYBOTEAM_CONNECTOR_AUTH_REQUIRED');
  });
});
