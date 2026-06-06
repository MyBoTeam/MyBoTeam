/**
 * Unit tests for isSameApex — the apex-domain check for manifest `path:` URLs.
 * Pure function; no Electron / network mocks needed.
 */

import { describe, expect, it } from 'vitest';

import {
  isSameApex,
  isTrustedManifestPath,
  isTrustedUpdateInfo,
} from '../../../src/main/updater/origin';

describe('isSameApex', () => {
  it('accepts same-apex subdomain (typical myboteam layout)', () => {
    // Feed lives on d.myboteam.app; artifacts on downloads.myboteam.app — shared apex.
    expect(isSameApex('https://downloads.myboteam.app/x/a.exe', 'https://d.myboteam.app')).toBe(
      true,
    );
  });

  it('accepts identical host', () => {
    expect(isSameApex('https://d.myboteam.app/x/a.exe', 'https://d.myboteam.app')).toBe(true);
  });

  it('accepts bare apex (no subdomain)', () => {
    expect(isSameApex('https://myboteam.app/x/a.exe', 'https://d.myboteam.app')).toBe(true);
  });

  it('rejects different apex (attacker-controlled)', () => {
    expect(isSameApex('https://evil.example.com/malware.exe', 'https://d.myboteam.app')).toBe(
      false,
    );
  });

  it('rejects label-trick hosts (evil-myboteam.app vs myboteam.app)', () => {
    // `evil-myboteam.app`.endsWith('myboteam.app') is true by raw string match, but our
    // boundary-aware check (hostname === apex || hostname.endsWith('.' + apex)) rejects it.
    expect(isSameApex('https://evil-myboteam.app/x/a.exe', 'https://d.myboteam.app')).toBe(false);
  });

  it('accepts localhost with localhost feed (dev opt-in)', () => {
    expect(isSameApex('http://localhost:8080/a.exe', 'http://localhost:8080')).toBe(true);
  });

  it('accepts IP with same IP feed (dev opt-in)', () => {
    expect(isSameApex('http://127.0.0.1:8080/a.exe', 'http://127.0.0.1:8080')).toBe(true);
  });

  it('rejects DIFFERENT IPv4 even when last-two-octets match (would pass the apex rule)', () => {
    // Naive apex of '127.0.0.1' is '0.1'; '192.168.0.1' endsWith '.0.1' → would
    // falsely accept without IP-literal special-case. Pin the fix.
    expect(isSameApex('http://192.168.0.1/a.exe', 'http://127.0.0.1')).toBe(false);
  });

  it('rejects different IPv6 addresses', () => {
    expect(isSameApex('http://[::2]/a.exe', 'http://[::1]/')).toBe(false);
  });

  it('accepts same IPv6', () => {
    expect(isSameApex('http://[::1]/a.exe', 'http://[::1]/')).toBe(true);
  });

  it('rejects IP candidate against DNS feed (or vice versa)', () => {
    expect(isSameApex('http://127.0.0.1/a.exe', 'https://d.myboteam.app')).toBe(false);
    expect(isSameApex('https://d.myboteam.app/a.exe', 'http://127.0.0.1')).toBe(false);
  });

  it('rejects HTTPS → HTTP downgrade even on same apex', () => {
    // An HTTPS feed must never direct users to a plaintext download URL.
    expect(isSameApex('http://downloads.myboteam.app/a.exe', 'https://d.myboteam.app')).toBe(false);
  });

  it('rejects HTTP → HTTPS upgrade (scheme must match)', () => {
    // Symmetric: a dev feed on http://localhost shouldn't accept https://localhost
    // (different URL anyway, but pin the scheme-equality rule).
    expect(isSameApex('https://localhost:8080/a.exe', 'http://localhost:8080')).toBe(false);
  });

  it('accepts same apex + same scheme (HTTPS)', () => {
    expect(isSameApex('https://downloads.myboteam.app/a.exe', 'https://d.myboteam.app')).toBe(true);
  });

  it('rejects malformed URL candidates (returns false, never throws)', () => {
    expect(isSameApex('not a url', 'https://d.myboteam.app')).toBe(false);
    expect(isSameApex('', 'https://d.myboteam.app')).toBe(false);
  });

  it('rejects when reference URL is malformed', () => {
    expect(isSameApex('https://d.myboteam.app/a.exe', 'not a url')).toBe(false);
  });

  it('accepts deep subdomain chains', () => {
    expect(isSameApex('https://a.b.c.myboteam.app/x/a.exe', 'https://d.myboteam.app')).toBe(true);
  });
});

describe('isTrustedManifestPath', () => {
  it('accepts relative manifest paths', () => {
    expect(isTrustedManifestPath('downloads/1.0.0/app.zip', 'https://downloads.myboteam.app')).toBe(
      true,
    );
  });

  it('rejects protocol-relative URLs', () => {
    expect(
      isTrustedManifestPath('//evil.example.com/app.zip', 'https://downloads.myboteam.app'),
    ).toBe(false);
  });

  it('rejects non-http absolute URLs', () => {
    expect(isTrustedManifestPath('file:///tmp/app.zip', 'https://downloads.myboteam.app')).toBe(
      false,
    );
  });
});

describe('isTrustedUpdateInfo', () => {
  it('accepts native update info with same-apex file URLs', () => {
    expect(
      isTrustedUpdateInfo(
        {
          files: [{ url: 'https://downloads.myboteam.app/downloads/1.0.0/app.zip' }],
          path: 'https://downloads.myboteam.app/downloads/1.0.0/app.zip',
        },
        'https://downloads.myboteam.app',
      ),
    ).toBe(true);
  });

  it('rejects native update info with cross-apex file URLs', () => {
    expect(
      isTrustedUpdateInfo(
        {
          files: [{ url: 'https://evil.example.com/app.zip' }],
          path: 'https://downloads.myboteam.app/downloads/1.0.0/app.zip',
        },
        'https://downloads.myboteam.app',
      ),
    ).toBe(false);
  });
});
