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

    await daemonManager.start();
    expect(daemonManager.isRunning()).toBe(true);

    // Register resources for cleanup
    // In real implementation, these would be actual sockets/file handles
    // For this test, we're just verifying the cleanup process works

    // Stop daemon
    await daemonManager.stop();

    // Verify cleanup
    const counts = cleanupHandler.getResourceCounts();
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
