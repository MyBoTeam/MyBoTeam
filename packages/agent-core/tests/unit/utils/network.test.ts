import { type AddressInfo, createServer } from 'node:net';
import { describe, expect, it } from 'vitest';
import { isPortInUse, waitForPortRelease } from '../../../src/utils/network.js';

describe('isPortInUse', () => {
  it('returns false for an unused port', async () => {
    const inUse = await isPortInUse(0);
    expect(inUse).toBe(false);
  });

  it('returns true for a port in use', async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const address = server.address() as AddressInfo;
    try {
      const inUse = await isPortInUse(address.port);
      expect(inUse).toBe(true);
    } finally {
      server.close();
    }
  });
});

describe('waitForPortRelease', () => {
  it('resolves immediately for unused port', async () => {
    await expect(waitForPortRelease(0, 1000)).resolves.toBeUndefined();
  });

  it('rejects when port stays in use', async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const address = server.address() as AddressInfo;
    try {
      await expect(waitForPortRelease(address.port, 200)).rejects.toThrow(
        `Port ${address.port} still in use after 200ms`,
      );
    } finally {
      server.close();
    }
  });
});
