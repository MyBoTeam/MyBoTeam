import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseArgs } from '../../src/cli.js';

describe('cli parseArgs', () => {
  it('parses --data-dir and resolves to absolute path', () => {
    const args = parseArgs(['--data-dir', '/some/path']);
    expect(args.dataDir).toBe('/some/path');
  });

  it('resolves relative --data-dir to absolute', () => {
    const args = parseArgs(['--data-dir', 'relative/path']);
    expect(args.dataDir).toBe(resolve('relative/path'));
  });

  it('parses --socket-path', () => {
    const args = parseArgs(['--socket-path', '/tmp/daemon.sock']);
    expect(args.socketPath).toBe('/tmp/daemon.sock');
  });

  it('parses --version', () => {
    const args = parseArgs(['--version']);
    expect(args.version).toBe(true);
  });

  it('returns empty when no args', () => {
    const args = parseArgs([]);
    expect(args.dataDir).toBeUndefined();
    expect(args.socketPath).toBeUndefined();
    expect(args.version).toBeUndefined();
  });

  it('ignores --data-dir without a value', () => {
    const args = parseArgs(['--data-dir']);
    expect(args.dataDir).toBeUndefined();
  });

  it('parses multiple flags', () => {
    const args = parseArgs(['--data-dir', '/data', '--socket-path', '/sock']);
    expect(args.dataDir).toBe('/data');
    expect(args.socketPath).toBe('/sock');
  });

  it('parses --packaged flag', () => {
    const args = parseArgs(['--packaged']);
    expect(args.isPackaged).toBe(true);
  });

  it('parses --resources-path', () => {
    const args = parseArgs(['--resources-path', '/Applications/MyBoTeam.app/Resources']);
    expect(args.resourcesPath).toBe('/Applications/MyBoTeam.app/Resources');
  });

  it('parses --app-path', () => {
    const args = parseArgs(['--app-path', '/Applications/MyBoTeam.app']);
    expect(args.appPath).toBe('/Applications/MyBoTeam.app');
  });

  it('parses all uncommon flags together', () => {
    const args = parseArgs(['--packaged', '--resources-path', '/res', '--app-path', '/app']);
    expect(args.isPackaged).toBe(true);
    expect(args.resourcesPath).toBe('/res');
    expect(args.appPath).toBe('/app');
  });
});
