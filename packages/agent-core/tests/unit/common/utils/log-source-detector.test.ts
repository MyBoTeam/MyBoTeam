import { describe, expect, it } from 'vitest';
import {
  detectLogSource,
  LOG_SOURCE_PATTERNS,
} from '../../../../src/common/utils/log-source-detector.js';

describe('detectLogSource', () => {
  it('detects opencode source from TaskManager prefix', () => {
    expect(detectLogSource('[TaskManager] Starting task')).toBe('opencode');
  });

  it('detects opencode source from OpenCode prefix', () => {
    expect(detectLogSource('[OpenCode] Initializing')).toBe('opencode');
  });

  it('detects browser source from DevBrowser prefix', () => {
    expect(detectLogSource('[DevBrowser] Opening page')).toBe('browser');
  });

  it('detects browser source from Playwright prefix', () => {
    expect(detectLogSource('[Playwright] Navigating')).toBe('browser');
  });

  it('detects mcp source from MCP prefix', () => {
    expect(detectLogSource('[MCP] Tool call')).toBe('mcp');
  });

  it('detects mcp source from MCP server mention', () => {
    expect(detectLogSource('MCP server connected')).toBe('mcp');
  });

  it('detects ipc source from IPC prefix', () => {
    expect(detectLogSource('[IPC] Handling request')).toBe('ipc');
  });

  it('falls back to main for unknown messages', () => {
    expect(detectLogSource('Some random log message')).toBe('main');
  });

  it('falls back to main for empty string', () => {
    expect(detectLogSource('')).toBe('main');
  });
});

describe('LOG_SOURCE_PATTERNS', () => {
  it('has entries for all expected sources', () => {
    const sources = Object.keys(LOG_SOURCE_PATTERNS);
    expect(sources).toEqual(
      expect.arrayContaining(['opencode', 'browser', 'mcp', 'ipc', 'main', 'env', 'daemon']),
    );
  });
});
