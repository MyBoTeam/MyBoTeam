import { existsSync, unlinkSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DaemonProcessManager } from '../../../src/daemon/lifecycle/daemon-process-manager';
import { ResourceCleanupHandler } from '../../../src/daemon/lifecycle/resource-cleanup-handler';

describe('Resource Cleanup Integration', () => {
  const socketPath = '/tmp/test-daemon-cleanup.sock';
  const pidPath = '/tmp/test-daemon-cleanup.pid';
  let daemonManager: DaemonProcessManager;
  let cleanupHandler: ResourceCleanupHandler;

  beforeAll(() => {
    // Clean up any existing files
    if (existsSync(socketPath)) unlinkSync(socketPath);
    if (existsSync(pidPath)) unlinkSync(pidPath);
  });

  afterAll(async () => {
    // Clean up after tests
    if (daemonManager?.isRunning()) {
      await daemonManager.kill();
    }
    if (existsSync(socketPath)) unlinkSync(socketPath);
    if (existsSync(pidPath)) unlinkSync(pidPath);
  });

  it('should cleanup all resources on shutdown', async () => {
    daemonManager = new DaemonProcessManager({
      socketPath,
      pidFilePath: pidPath,
      shutdownTimeoutMs: 5000,
    });

    cleanupHandler = new ResourceCleanupHandler();

    // Register resources that should be cleaned up
    const mockSocket = { destroy: () => {} };
    const mockHandle = { close: async () => {} };
    cleanupHandler.registerSocket(mockSocket as any);
    cleanupHandler.registerFileHandle(mockHandle as any);

    // Verify resources are registered
    let counts = cleanupHandler.getResourceCounts();
    expect(counts.sockets).toBe(1);
    expect(counts.fileHandles).toBe(1);

    await daemonManager.start();
    expect(daemonManager.isRunning()).toBe(true);

    // Stop daemon and clean up resources
    await daemonManager.stop();
    await cleanupHandler.destroySockets();
    await cleanupHandler.closeFileHandles();

    // Verify cleanup
    counts = cleanupHandler.getResourceCounts();
    expect(counts.sockets).toBe(0);
    expect(counts.fileHandles).toBe(0);
    expect(counts.tempFiles).toBe(0);
  });

  it('should destroy sockets immediately', async () => {
    cleanupHandler = new ResourceCleanupHandler();

    // Mock socket
    const mockSocket = {
      destroy: () => {},
    };

    cleanupHandler.registerSocket(mockSocket as any);
    cleanupHandler.destroySockets();

    const counts = cleanupHandler.getResourceCounts();
    expect(counts.sockets).toBe(0);
  });

  it('should close file handles', async () => {
    cleanupHandler = new ResourceCleanupHandler();

    // Mock file handle
    const mockHandle = {
      close: async () => {},
    };

    cleanupHandler.registerFileHandle(mockHandle as any);
    await cleanupHandler.closeFileHandles();

    const counts = cleanupHandler.getResourceCounts();
    expect(counts.fileHandles).toBe(0);
  });
});
